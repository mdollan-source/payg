/**
 * Slug generation utilities based on PRD Section 9.1
 *
 * Rules:
 * - lowercase
 * - replace & with "and"
 * - remove non a-z/0-9/spaces/hyphens
 * - spaces → hyphens
 * - trim hyphens
 * - max 40 chars
 * - reserved slugs: www, admin, api, support, mail, ftp, app
 * - uniqueness: append -2, -3…
 */

const RESERVED_SLUGS = [
  "www",
  "admin",
  "api",
  "support",
  "mail",
  "ftp",
  "app",
  "help",
  "billing",
  "dashboard",
  "login",
  "signup",
  "onboarding",
];

/**
 * Generate a URL-safe slug from a business name
 */
export function generateSlug(businessName: string): string {
  let slug = businessName
    // Convert to lowercase
    .toLowerCase()
    // Replace & with "and"
    .replace(/&/g, "and")
    // Remove non a-z/0-9/spaces/hyphens
    .replace(/[^a-z0-9\s-]/g, "")
    // Replace spaces with hyphens
    .replace(/\s+/g, "-")
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, "-")
    // Trim hyphens from start and end
    .replace(/^-+|-+$/g, "");

  // Truncate to max 40 chars (at word boundary if possible)
  if (slug.length > 40) {
    slug = slug.substring(0, 40);
    // Try to cut at a hyphen boundary
    const lastHyphen = slug.lastIndexOf("-");
    if (lastHyphen > 20) {
      slug = slug.substring(0, lastHyphen);
    }
    // Clean up any trailing hyphens
    slug = slug.replace(/-+$/, "");
  }

  return slug;
}

/**
 * Check if a slug is reserved
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}

/**
 * Generate a unique slug by appending a number suffix if needed
 */
export function generateUniqueSlug(
  businessName: string,
  existingSlugs: string[]
): string {
  let baseSlug = generateSlug(businessName);

  // If base slug is reserved, start with -1
  if (isReservedSlug(baseSlug)) {
    baseSlug = `${baseSlug}-1`;
  }

  // Check if slug already exists
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  // Find the next available number
  let counter = 2;
  let candidateSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(candidateSlug)) {
    counter++;
    candidateSlug = `${baseSlug}-${counter}`;

    // Safety limit
    if (counter > 1000) {
      throw new Error("Unable to generate unique slug");
    }
  }

  return candidateSlug;
}

/**
 * Generate a page slug from a page title
 */
export function generatePageSlug(title: string): string {
  // Home page is always "/"
  if (title.toLowerCase() === "home") {
    return "/";
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `/${slug}`;
}

/**
 * Generate a service page slug
 */
export function generateServicePageSlug(serviceName: string): string {
  const slug = serviceName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `/services/${slug}`;
}
