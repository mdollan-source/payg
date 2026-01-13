import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { resolveTenant } from "@/lib/tenant/resolver";

export const dynamic = "force-dynamic";

export async function GET() {
  const headersList = await headers();
  const hostname = headersList.get("x-tenant-host") || headersList.get("host") || "";

  const db = getDb();
  const resolved = await resolveTenant(db, hostname);

  if (!resolved || resolved.tenant.status !== "active") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { tenant, primaryDomain } = resolved;

  // Get the canonical domain
  const domain = primaryDomain?.domain || `${tenant.businessSlug}.paygsite.co.uk`;
  const baseUrl = `https://${domain}`;

  // Get all published pages
  const pages = await db.page.findMany({
    where: {
      tenantId: tenant.id,
      status: "published",
    },
    orderBy: { sortOrder: "asc" },
  });

  // Build sitemap XML
  const urls = pages.map((page) => {
    const loc = page.slug === "/" ? baseUrl : `${baseUrl}${page.slug}`;
    const lastmod = page.updatedAt.toISOString().split("T")[0];
    const priority = page.slug === "/" ? "1.0" : "0.8";

    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
