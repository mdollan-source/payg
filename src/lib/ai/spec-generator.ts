import OpenAI from "openai";
import type { OnboardingData } from "@/types/onboarding";
import { validateSpec, tryParseJSON } from "./validators";
import type { WebsiteBuildSpec, PlanPages } from "./types";

// Initialize OpenAI client
function createOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.includes("placeholder")) {
    console.warn(
      "⚠️ OpenAI is not configured. Set OPENAI_API_KEY in your .env file."
    );
    return null;
  }

  return new OpenAI({ apiKey });
}

const openai = createOpenAIClient();

/**
 * Build the prompt for GPT spec generation
 */
function buildSpecPrompt(
  onboardingData: OnboardingData,
  planPages: PlanPages
): string {
  return `You are a website content strategist for UK small businesses.

Your job:
- Generate a single JSON object that follows the provided schema EXACTLY.
- The JSON is called "Website Build Spec" and will be used to build a website automatically.
- The website is for a pay-monthly package: ${planPages} pages (${planPages === 1 ? "landing page only" : planPages === 5 ? "Home, About, Services, Gallery/Case Studies, Contact" : "Home, About, Services, 3-4 individual Service pages, Case Studies/Gallery, FAQs, Contact, optionally Areas Covered"}).
- Locale is en-GB. Use British spelling. Avoid exaggerated/unverifiable claims (e.g., "best", "cheapest", "guaranteed") unless the user explicitly provided them.
- Keep copy concise, clear, and conversion-focused.

Hard rules:
1) Output ONLY valid JSON. No markdown. No commentary.
2) Use only the allowed section types: hero, services_grid, about_split, testimonial_list, accreditations_row, gallery_grid, faq_accordion, service_area, contact_form, cta_banner, rich_text.
3) Generate EXACTLY ${planPages} page(s) according to the plan.
4) For every page, include SEO fields: title (<= 60 chars), meta_description (<= 155 chars), primary_keyword, up to 5 secondary keywords.
5) Include a helpful but realistic FAQ (3–6 items) relevant to the business.
6) If logo/brand colours are missing, set branding.design_vibe based on tone and industry and leave hex fields empty.
7) Include navigation.header_links and footer_links using the generated pages.
8) Include assets.image_requests for each page's hero and any gallery sections with short prompts.

Schema shape:
{
  "spec_version": "1.0",
  "tenant": {
    "business_name": "",
    "legal_name": "",
    "industry": "",
    "tagline": "",
    "tone_of_voice": "",
    "usp_bullets": [],
    "avoid_claims_or_words": []
  },
  "branding": {
    "logo_url": "",
    "primary_colour_hex": "",
    "secondary_colour_hex": "",
    "design_vibe": ""
  },
  "contact": {
    "phone": "",
    "email": "",
    "address": "",
    "opening_hours": "",
    "cta_primary": "",
    "cta_secondary": ""
  },
  "service_area": {
    "mode": "radius|list|nationwide",
    "radius_miles": 0,
    "areas": [],
    "primary_location": ""
  },
  "seo_defaults": {
    "locale": "en-GB",
    "brand_name": "",
    "primary_location": "",
    "service_area_hint": ""
  },
  "navigation": {
    "header_links": [{"label": "", "href": ""}],
    "footer_links": [{"label": "", "href": ""}]
  },
  "pages": [
    {
      "id": "home",
      "title": "Home",
      "slug": "/",
      "purpose": "",
      "seo": {
        "title": "",
        "meta_description": "",
        "primary_keyword": "",
        "secondary_keywords": [],
        "og_title": "",
        "og_description": ""
      },
      "sections": [
        { "type": "hero", "props": {} }
      ]
    }
  ],
  "global_blocks": {
    "footer": {
      "disclaimer": "",
      "copyright_text": ""
    }
  },
  "assets": {
    "image_style_notes": "",
    "image_requests": [
      { "section_ref": "home.hero", "description": "", "keywords": [] }
    ]
  },
  "change_policy_hints": {
    "self_serve": [],
    "managed_changes": []
  }
}

Input data (from onboarding):
${JSON.stringify(onboardingData, null, 2)}

Now produce the Website Build Spec JSON.`;
}

/**
 * Generate Website Build Spec using OpenAI GPT-4o
 */
export async function generateSpec(
  onboardingData: OnboardingData,
  planPages: PlanPages,
  options?: {
    maxRetries?: number;
    onRetry?: (attempt: number, error: string) => void;
  }
): Promise<{
  spec: WebsiteBuildSpec;
  usage: { promptTokens: number; completionTokens: number };
}> {
  if (!openai) {
    throw new Error("OpenAI is not configured");
  }

  const maxRetries = options?.maxRetries ?? 3;
  let lastError: string | null = null;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Exponential backoff on retries
    if (attempt > 0) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      options?.onRetry?.(attempt, lastError || "Unknown error");
    }

    // Build prompt with retry feedback if needed
    let prompt = buildSpecPrompt(onboardingData, planPages);
    if (lastError) {
      prompt += `\n\nYour previous response had issues: ${lastError}\nPlease fix and output ONLY valid JSON.`;
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 8000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        lastError = "Empty response from OpenAI";
        continue;
      }

      totalPromptTokens += response.usage?.prompt_tokens ?? 0;
      totalCompletionTokens += response.usage?.completion_tokens ?? 0;

      // Try to parse JSON
      const { json, error: parseError } = tryParseJSON(content);
      if (parseError) {
        lastError = `Invalid JSON: ${parseError}`;
        continue;
      }

      // Validate spec
      const validation = validateSpec(json, planPages);
      if (!validation.valid) {
        lastError = validation.errors.join("; ");
        continue;
      }

      return {
        spec: json as WebsiteBuildSpec,
        usage: {
          promptTokens: totalPromptTokens,
          completionTokens: totalCompletionTokens,
        },
      };
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "OpenAI API error";
    }
  }

  throw new Error(`Failed to generate spec after ${maxRetries} attempts: ${lastError}`);
}

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
  return openai !== null;
}
