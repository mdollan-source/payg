import type { PrismaClient } from "@prisma/client";
import type { CMSSeed } from "@/lib/ai/types";

/**
 * Import a CMS seed into the database for a tenant
 */
export async function importSeed(
  db: PrismaClient,
  tenantId: string,
  seedData: object
): Promise<void> {
  const seed = seedData as CMSSeed;

  console.log(`[Importer] Starting import for tenant ${tenantId}`);

  // Use a transaction for atomicity
  await db.$transaction(async (tx) => {
    // 1. Upsert site settings
    await tx.tenantSiteSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        tagline: seed.settings.tagline || null,
        phone: seed.settings.contact?.phone || null,
        email: seed.settings.contact?.email || null,
        address: seed.settings.contact?.address || null,
        openingHours: seed.settings.contact?.openingHours || null,
        primaryColourHex: seed.settings.colours?.primary || null,
        secondaryColourHex: seed.settings.colours?.secondary || null,
        footerDisclaimer: seed.settings.footer?.disclaimer || null,
      },
      update: {
        tagline: seed.settings.tagline || null,
        phone: seed.settings.contact?.phone || null,
        email: seed.settings.contact?.email || null,
        address: seed.settings.contact?.address || null,
        openingHours: seed.settings.contact?.openingHours || null,
        primaryColourHex: seed.settings.colours?.primary || null,
        secondaryColourHex: seed.settings.colours?.secondary || null,
        footerDisclaimer: seed.settings.footer?.disclaimer || null,
      },
    });

    console.log(`[Importer] Site settings saved`);

    // 2. Upsert navigation (header and footer separately)
    if (seed.navigation?.headerLinks) {
      await tx.navigation.upsert({
        where: {
          tenantId_location: { tenantId, location: "header" },
        },
        create: {
          tenantId,
          location: "header",
          items: seed.navigation.headerLinks as unknown as object,
        },
        update: {
          items: seed.navigation.headerLinks as unknown as object,
        },
      });
    }

    if (seed.navigation?.footerLinks) {
      await tx.navigation.upsert({
        where: {
          tenantId_location: { tenantId, location: "footer" },
        },
        create: {
          tenantId,
          location: "footer",
          items: seed.navigation.footerLinks as unknown as object,
        },
        update: {
          items: seed.navigation.footerLinks as unknown as object,
        },
      });
    }

    console.log(`[Importer] Navigation saved`);

    // 3. Delete existing pages and blocks (clean import)
    await tx.pageBlock.deleteMany({ where: { page: { tenantId } } });
    await tx.page.deleteMany({ where: { tenantId } });

    // 4. Create pages with blocks
    const existingSlugs = new Set<string>();

    for (const [pageIndex, page] of seed.pages.entries()) {
      // Resolve slug conflicts
      let slug = normalizeSlug(page.slug);
      if (existingSlugs.has(slug)) {
        slug = resolveSlugConflict(slug, existingSlugs);
      }
      existingSlugs.add(slug);

      // Create page
      const createdPage = await tx.page.create({
        data: {
          tenantId,
          title: page.title,
          slug,
          seoTitle: page.seoTitle || page.title,
          seoDescription: page.seoDescription || "",
          sortOrder: pageIndex,
          status: "published",
        },
      });

      console.log(`[Importer] Page created: ${page.title} (${slug})`);

      // Create blocks for page
      for (const [blockIndex, block] of page.blocks.entries()) {
        await tx.pageBlock.create({
          data: {
            pageId: createdPage.id,
            blockType: block.blockType,
            data: block.data as object,
            sortOrder: blockIndex,
          },
        });
      }

      console.log(`[Importer] Created ${page.blocks.length} blocks for page ${page.title}`);
    }

    console.log(`[Importer] Import complete: ${seed.pages.length} pages created`);
  });
}

/**
 * Normalize a slug to ensure it's valid
 */
function normalizeSlug(slug: string): string {
  // Ensure slug starts with /
  if (!slug.startsWith("/")) {
    slug = "/" + slug;
  }

  // Normalize to lowercase
  slug = slug.toLowerCase();

  // Remove trailing slash (except for root)
  if (slug !== "/" && slug.endsWith("/")) {
    slug = slug.slice(0, -1);
  }

  // Remove multiple slashes
  slug = slug.replace(/\/+/g, "/");

  return slug;
}

/**
 * Resolve a slug conflict by appending a number
 */
function resolveSlugConflict(slug: string, existingSlugs: Set<string>): string {
  let counter = 2;
  let newSlug = `${slug}-${counter}`;

  while (existingSlugs.has(newSlug)) {
    counter++;
    newSlug = `${slug}-${counter}`;
  }

  console.warn(`[Importer] Slug conflict resolved: ${slug} -> ${newSlug}`);
  return newSlug;
}

/**
 * Validate a seed structure before import
 */
export function validateSeedForImport(seed: object): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const s = seed as Partial<CMSSeed>;

  if (!s.settings) {
    errors.push("Missing settings object");
  } else if (!s.settings.siteName) {
    errors.push("Missing settings.siteName");
  }

  if (!s.pages || !Array.isArray(s.pages) || s.pages.length === 0) {
    errors.push("Missing or empty pages array");
  }

  return { valid: errors.length === 0, errors };
}
