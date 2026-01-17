import { notFound, redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { resolveTenant, getTenantPage, getTenantData } from "@/lib/tenant/resolver";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { TenantHeader } from "@/components/tenant/TenantHeader";
import { TenantFooter } from "@/components/tenant/TenantFooter";
import { LocalBusinessSchema } from "@/components/seo/LocalBusinessSchema";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin/auth";
import type { Metadata } from "next";

interface TenantPageProps {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ preview?: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: TenantPageProps): Promise<Metadata> {
  const { slug } = await params;
  const headersList = await headers();
  const hostname = headersList.get("x-tenant-host") || headersList.get("host") || "";

  const db = getDb();
  const resolved = await resolveTenant(db, hostname);

  if (!resolved || resolved.tenant.status !== "active") {
    // For pending_review, return basic metadata (admin preview)
    if (resolved?.tenant.status === "pending_review") {
      return { title: `Preview: ${resolved.tenant.businessName}` };
    }
    return { title: "Site Not Found" };
  }

  const pageSlug = "/" + (slug?.join("/") || "");
  const page = await getTenantPage(db, resolved.tenant.id, pageSlug);

  if (!page) {
    return { title: "Page Not Found" };
  }

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
    openGraph: {
      title: page.ogTitle || page.seoTitle || page.title,
      description: page.ogDescription || page.seoDescription || undefined,
    },
  };
}

export default async function TenantPage({ params, searchParams }: TenantPageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const headersList = await headers();
  const hostname = headersList.get("x-tenant-host") || headersList.get("host") || "";

  const db = getDb();

  // Resolve tenant from hostname
  const resolved = await resolveTenant(db, hostname);

  if (!resolved) {
    notFound();
  }

  const { tenant, domain, primaryDomain } = resolved;

  // Canonical redirect: if not on primary domain, redirect there (skip in preview mode)
  if (primaryDomain && !domain.isPrimary && preview !== "1") {
    const pageSlug = "/" + (slug?.join("/") || "");
    const canonicalUrl = `https://${primaryDomain.domain}${pageSlug === "/" ? "" : pageSlug}`;
    redirect(canonicalUrl);
  }

  // Check tenant status - allow pending_review only for admins
  let isPreviewMode = false;
  if (tenant.status === "pending_review") {
    const session = await auth();
    isPreviewMode = !!(session?.user?.email && isAdminEmail(session.user.email));
  }

  if (tenant.status !== "active" && !isPreviewMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Site Coming Soon</h1>
          <p className="text-gray-600">
            This website is currently being built. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  // Get tenant data including settings and navigation
  const tenantData = await getTenantData(db, tenant.id);

  if (!tenantData) {
    notFound();
  }

  // Get the requested page
  const pageSlug = "/" + (slug?.join("/") || "");
  const page = await getTenantPage(db, tenant.id, pageSlug);

  if (!page) {
    notFound();
  }

  // Get navigation
  const headerNav = tenantData.navigations.find((n) => n.location === "header");
  const footerNav = tenantData.navigations.find((n) => n.location === "footer");

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        "--primary-color": tenantData.siteSettings?.primaryColourHex || "#2563eb",
        "--secondary-color": tenantData.siteSettings?.secondaryColourHex || "#1e40af",
      } as React.CSSProperties}
    >
      {isPreviewMode && (
        <div className="bg-yellow-500 text-yellow-900 text-center py-2 text-sm font-medium">
          Preview Mode - This site is pending review
        </div>
      )}
      <LocalBusinessSchema
        businessName={tenant.businessName}
        url={`https://${primaryDomain?.domain || `${tenant.businessSlug}.paygsite.co.uk`}`}
        description={tenantData.siteSettings?.tagline}
        phone={tenantData.siteSettings?.phone}
        email={tenantData.siteSettings?.email}
        address={tenantData.siteSettings?.address}
        logo={tenantData.siteSettings?.logoUrl}
        openingHours={tenantData.siteSettings?.openingHours}
      />
      <TenantHeader
        siteName={tenant.businessName}
        tagline={tenantData.siteSettings?.tagline || undefined}
        logoUrl={tenantData.siteSettings?.logoUrl || undefined}
        navigation={headerNav?.items as Array<{ label: string; href: string }> || []}
        phone={tenantData.siteSettings?.phone || undefined}
      />

      <main className="flex-1">
        {page.blocks.map((block) => (
          <BlockRenderer
            key={block.id}
            blockType={block.blockType}
            data={block.data as Record<string, unknown>}
            siteSettings={tenantData.siteSettings}
          />
        ))}
      </main>

      <TenantFooter
        siteName={tenant.businessName}
        navigation={footerNav?.items as Array<{ label: string; href: string }> || []}
        phone={tenantData.siteSettings?.phone || undefined}
        email={tenantData.siteSettings?.email || undefined}
        address={tenantData.siteSettings?.address || undefined}
        disclaimer={tenantData.siteSettings?.footerDisclaimer || undefined}
      />
    </div>
  );
}
