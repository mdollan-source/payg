import Anthropic from "@anthropic-ai/sdk";
import { validateSeed, tryParseJSON } from "./validators";
import type { WebsiteBuildSpec, CMSSeed, PlanPages } from "./types";

// Initialize Anthropic client
function createAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.includes("placeholder")) {
    console.warn(
      "⚠️ Anthropic is not configured. Set ANTHROPIC_API_KEY in your .env file."
    );
    return null;
  }

  return new Anthropic({ apiKey });
}

const anthropic = createAnthropicClient();

/**
 * Build the prompt for Claude seed generation
 */
function buildSeedPrompt(spec: WebsiteBuildSpec): string {
  return `You are a senior UK copywriter and web content strategist creating content for a small business website.

Input: a Website Build Spec JSON.
Output: a CMS seed JSON that our platform will import.

CRITICAL - Content Quality Requirements:
- Write RICH, COMPELLING, PROFESSIONAL content that would make a business owner proud.
- Hero headlines should be punchy and benefit-focused (8-12 words).
- Hero subheadlines should expand on the value proposition (20-30 words).
- About sections need 2-3 substantial paragraphs telling the business story.
- Service descriptions should be detailed (40-60 words each), highlighting benefits not just features.
- Generate 4-6 realistic testimonials with full quotes (30-50 words each), varied names, and specific details.
- FAQs should have thorough, helpful answers (50-80 words each).
- Use British English spelling throughout.
- Write in the business's tone of voice as specified in the spec.
- Include specific local references where the business operates.
- Make the content feel authentic to the industry.

Hard rules:
1) Output ONLY valid JSON. No markdown. No explanation.
2) USE the spec as a foundation but EXPAND it into rich, professional website content.
3) Convert each page.sections[] into CMS blocks with:
   - blockType (same as section.type)
   - data (section.props plus generated content)
4) Create a pages array with:
   - title, slug, seoTitle, seoDescription
   - blocks[]
5) Create global settings:
   - siteName, tagline, contact, colours, footer
6) Ensure internal links are consistent:
   - contact links point to "/contact" if that page exists, otherwise use "#contact" anchor on home.
7) If a page slug conflicts, resolve safely (e.g., /services/roofing).
8) Generate SUBSTANTIAL content for every block - no placeholder text or "Lorem ipsum".

Output schema:
{
  "settings": {
    "siteName": "",
    "tagline": "",
    "contact": {
      "phone": "",
      "email": "",
      "address": "",
      "openingHours": ""
    },
    "colours": {
      "primary": "",
      "secondary": ""
    },
    "footer": {
      "disclaimer": "",
      "copyrightText": ""
    }
  },
  "navigation": {
    "headerLinks": [{"label": "", "href": ""}],
    "footerLinks": [{"label": "", "href": ""}]
  },
  "pages": [
    {
      "title": "",
      "slug": "",
      "seoTitle": "",
      "seoDescription": "",
      "blocks": [
        {
          "blockType": "hero",
          "data": {
            "headline": "",
            "subheadline": "",
            "ctaText": "",
            "ctaLink": "",
            "imageUrl": ""
          }
        }
      ]
    }
  ]
}

Block data schemas by type:
- hero: { headline, subheadline, ctaText, ctaLink, imageUrl }
- services_grid: { title, services: [{ name, description, icon }] }
- about_split: { title, content, imageUrl, imagePosition }
- testimonial_list: { title, testimonials: [{ quote, author, role, rating }] }
- accreditations_row: { title, accreditations: [{ name, imageUrl }] }
- gallery_grid: { title, images: [{ url, caption }] }
- faq_accordion: { title, faqs: [{ question, answer }] }
- service_area: { title, description, areas, mapCenter }
- contact_form: { title, description, fields, submitText }
- cta_banner: { headline, description, ctaText, ctaLink }
- rich_text: { content }

Here is the Website Build Spec JSON:
${JSON.stringify(spec, null, 2)}

Generate the CMS seed JSON now.`;
}

/**
 * Generate CMS Seed using Anthropic Claude
 */
export async function generateSeed(
  spec: WebsiteBuildSpec,
  planPages: PlanPages,
  options?: {
    maxRetries?: number;
    onRetry?: (attempt: number, error: string) => void;
  }
): Promise<{
  seed: CMSSeed;
  usage: { inputTokens: number; outputTokens: number };
}> {
  if (!anthropic) {
    throw new Error("Anthropic is not configured");
  }

  const maxRetries = options?.maxRetries ?? 3;
  let lastError: string | null = null;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Exponential backoff on retries
    if (attempt > 0) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      options?.onRetry?.(attempt, lastError || "Unknown error");
    }

    // Build prompt with retry feedback if needed
    let prompt = buildSeedPrompt(spec);
    if (lastError) {
      prompt += `\n\nYour previous response had issues: ${lastError}\nPlease fix and output ONLY valid JSON.`;
    }

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== "text" || !content.text) {
        lastError = "Empty response from Anthropic";
        continue;
      }

      totalInputTokens += response.usage?.input_tokens ?? 0;
      totalOutputTokens += response.usage?.output_tokens ?? 0;

      // Try to parse JSON
      const { json, error: parseError } = tryParseJSON(content.text);
      if (parseError) {
        lastError = `Invalid JSON: ${parseError}`;
        continue;
      }

      // Validate seed
      const validation = validateSeed(json, planPages);
      if (!validation.valid) {
        lastError = validation.errors.join("; ");
        continue;
      }

      return {
        seed: json as CMSSeed,
        usage: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
        },
      };
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Anthropic API error";
    }
  }

  throw new Error(`Failed to generate seed after ${maxRetries} attempts: ${lastError}`);
}

/**
 * Check if Anthropic is configured
 */
export function isAnthropicConfigured(): boolean {
  return anthropic !== null;
}
