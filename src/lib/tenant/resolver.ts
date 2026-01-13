import type { PrismaClient, Tenant, TenantDomain } from "@prisma/client";

export interface ResolvedTenant {
  tenant: Tenant;
  domain: TenantDomain;
  primaryDomain: TenantDomain | null;
}

/**
 * Resolve a tenant from a hostname
 * Returns null if no matching tenant is found
 */
export async function resolveTenant(
  db: PrismaClient,
  hostname: string
): Promise<ResolvedTenant | null> {
  // Normalize hostname (remove port if present)
  const host = hostname.split(":")[0].toLowerCase();

  // Check for custom domain first
  const customDomain = await db.tenantDomain.findFirst({
    where: {
      domain: host,
      domainType: "custom",
      verificationStatus: "verified",
    },
    include: { tenant: true },
  });

  if (customDomain && customDomain.tenant) {
    // Get primary domain for this tenant
    const primaryDomain = await db.tenantDomain.findFirst({
      where: { tenantId: customDomain.tenantId, isPrimary: true },
    });

    return {
      tenant: customDomain.tenant,
      domain: customDomain,
      primaryDomain,
    };
  }

  // Check for subdomain (*.paygsite.co.uk)
  const subdomainMatch = host.match(/^([a-z0-9-]+)\.paygsite\.co\.uk$/);
  if (subdomainMatch) {
    const slug = subdomainMatch[1];

    const tenant = await db.tenant.findFirst({
      where: { businessSlug: slug },
      include: {
        domains: true,
      },
    });

    if (tenant && tenant.domains.length > 0) {
      const subdomainDomain = tenant.domains.find(d => d.domainType === "subdomain");
      const primaryDomain = tenant.domains.find(d => d.isPrimary) || null;

      if (subdomainDomain) {
        return {
          tenant,
          domain: subdomainDomain,
          primaryDomain,
        };
      }
    }
  }

  return null;
}

/**
 * Check if a hostname is a tenant domain (vs main app domain)
 */
export function isTenantDomain(hostname: string): boolean {
  const host = hostname.split(":")[0].toLowerCase();

  // Main app domains (not tenant sites)
  const mainDomains = [
    "paygsite.co.uk",
    "www.paygsite.co.uk",
    "localhost",
    "127.0.0.1",
  ];

  if (mainDomains.includes(host)) {
    return false;
  }

  // Subdomain pattern
  if (host.match(/^[a-z0-9-]+\.paygsite\.co\.uk$/)) {
    return true;
  }

  // Custom domains (anything else is assumed to be a tenant domain)
  // In production, we'd have a more sophisticated check
  return !host.includes("paygsite.co.uk");
}

/**
 * Get tenant data for rendering
 */
export async function getTenantData(
  db: PrismaClient,
  tenantId: string
) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: {
      siteSettings: true,
      navigations: true,
      pages: {
        where: { status: "published" },
        orderBy: { sortOrder: "asc" },
        include: {
          blocks: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  return tenant;
}

/**
 * Get a specific page for a tenant
 */
export async function getTenantPage(
  db: PrismaClient,
  tenantId: string,
  slug: string
) {
  // Normalize slug
  if (!slug.startsWith("/")) {
    slug = "/" + slug;
  }

  const page = await db.page.findFirst({
    where: {
      tenantId,
      slug,
      status: "published",
    },
    include: {
      blocks: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return page;
}
