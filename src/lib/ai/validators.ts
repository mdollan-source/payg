import {
  type WebsiteBuildSpec,
  type CMSSeed,
  type PlanPages,
  ALLOWED_BLOCK_TYPES,
  PLAN_PAGE_COUNTS,
} from "./types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate Website Build Spec JSON
 */
export function validateSpec(
  json: unknown,
  planPages: PlanPages
): ValidationResult {
  const errors: string[] = [];

  if (!json || typeof json !== "object") {
    return { valid: false, errors: ["Invalid JSON structure"] };
  }

  const spec = json as WebsiteBuildSpec;

  // Check required top-level fields
  if (!spec.spec_version) {
    errors.push("Missing spec_version");
  }

  if (!spec.tenant) {
    errors.push("Missing tenant object");
  } else {
    if (!spec.tenant.business_name) {
      errors.push("Missing tenant.business_name");
    }
    if (!spec.tenant.industry) {
      errors.push("Missing tenant.industry");
    }
  }

  if (!spec.branding) {
    errors.push("Missing branding object");
  }

  if (!spec.contact) {
    errors.push("Missing contact object");
  } else {
    if (!spec.contact.email && !spec.contact.phone) {
      errors.push("At least one of contact.email or contact.phone required");
    }
  }

  if (!spec.navigation) {
    errors.push("Missing navigation object");
  }

  // Validate pages
  if (!spec.pages || !Array.isArray(spec.pages)) {
    errors.push("Missing pages array");
  } else {
    const expectedPageCount = PLAN_PAGE_COUNTS[planPages];
    if (spec.pages.length !== expectedPageCount) {
      errors.push(
        `Expected ${expectedPageCount} pages for ${planPages}-page plan, got ${spec.pages.length}`
      );
    }

    const slugs = new Set<string>();
    spec.pages.forEach((page, index) => {
      // Check required page fields
      if (!page.id) {
        errors.push(`Page ${index}: missing id`);
      }
      if (!page.title) {
        errors.push(`Page ${index}: missing title`);
      }
      if (!page.slug) {
        errors.push(`Page ${index}: missing slug`);
      } else {
        if (slugs.has(page.slug)) {
          errors.push(`Page ${index}: duplicate slug "${page.slug}"`);
        }
        slugs.add(page.slug);
      }

      // Validate SEO
      if (!page.seo) {
        errors.push(`Page ${index}: missing seo object`);
      } else {
        if (!page.seo.title) {
          errors.push(`Page ${index}: missing seo.title`);
        } else if (page.seo.title.length > 60) {
          errors.push(
            `Page ${index}: seo.title exceeds 60 chars (${page.seo.title.length})`
          );
        }
        if (!page.seo.meta_description) {
          errors.push(`Page ${index}: missing seo.meta_description`);
        } else if (page.seo.meta_description.length > 155) {
          errors.push(
            `Page ${index}: seo.meta_description exceeds 155 chars (${page.seo.meta_description.length})`
          );
        }
      }

      // Validate sections
      if (!page.sections || !Array.isArray(page.sections)) {
        errors.push(`Page ${index}: missing sections array`);
      } else {
        page.sections.forEach((section, sectionIndex) => {
          if (!section.type) {
            errors.push(`Page ${index}, section ${sectionIndex}: missing type`);
          } else if (!ALLOWED_BLOCK_TYPES.includes(section.type)) {
            errors.push(
              `Page ${index}, section ${sectionIndex}: invalid block type "${section.type}"`
            );
          }
        });
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate CMS Seed JSON
 */
export function validateSeed(
  json: unknown,
  planPages: PlanPages
): ValidationResult {
  const errors: string[] = [];

  if (!json || typeof json !== "object") {
    return { valid: false, errors: ["Invalid JSON structure"] };
  }

  const seed = json as CMSSeed;

  // Validate settings
  if (!seed.settings) {
    errors.push("Missing settings object");
  } else {
    if (!seed.settings.siteName) {
      errors.push("Missing settings.siteName");
    }
    if (!seed.settings.contact) {
      errors.push("Missing settings.contact object");
    }
  }

  // Validate navigation
  if (!seed.navigation) {
    errors.push("Missing navigation object");
  }

  // Validate pages
  if (!seed.pages || !Array.isArray(seed.pages)) {
    errors.push("Missing pages array");
  } else {
    const expectedPageCount = PLAN_PAGE_COUNTS[planPages];
    if (seed.pages.length !== expectedPageCount) {
      errors.push(
        `Expected ${expectedPageCount} pages for ${planPages}-page plan, got ${seed.pages.length}`
      );
    }

    const slugs = new Set<string>();
    seed.pages.forEach((page, index) => {
      // Check required page fields
      if (!page.title) {
        errors.push(`Page ${index}: missing title`);
      }
      if (!page.slug) {
        errors.push(`Page ${index}: missing slug`);
      } else {
        if (slugs.has(page.slug)) {
          errors.push(`Page ${index}: duplicate slug "${page.slug}"`);
        }
        slugs.add(page.slug);
      }
      if (!page.seoTitle) {
        errors.push(`Page ${index}: missing seoTitle`);
      } else if (page.seoTitle.length > 60) {
        errors.push(
          `Page ${index}: seoTitle exceeds 60 chars (${page.seoTitle.length})`
        );
      }
      if (!page.seoDescription) {
        errors.push(`Page ${index}: missing seoDescription`);
      } else if (page.seoDescription.length > 155) {
        errors.push(
          `Page ${index}: seoDescription exceeds 155 chars (${page.seoDescription.length})`
        );
      }

      // Validate blocks
      if (!page.blocks || !Array.isArray(page.blocks)) {
        errors.push(`Page ${index}: missing blocks array`);
      } else {
        page.blocks.forEach((block, blockIndex) => {
          if (!block.blockType) {
            errors.push(`Page ${index}, block ${blockIndex}: missing blockType`);
          } else if (!ALLOWED_BLOCK_TYPES.includes(block.blockType)) {
            errors.push(
              `Page ${index}, block ${blockIndex}: invalid blockType "${block.blockType}"`
            );
          }
          if (!block.data || typeof block.data !== "object") {
            errors.push(`Page ${index}, block ${blockIndex}: missing or invalid data object`);
          }
        });
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Try to parse JSON safely
 */
export function tryParseJSON(text: string): { json: unknown; error: string | null } {
  // Remove any markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    return { json: JSON.parse(cleaned), error: null };
  } catch (e) {
    return { json: null, error: e instanceof Error ? e.message : "Invalid JSON" };
  }
}
