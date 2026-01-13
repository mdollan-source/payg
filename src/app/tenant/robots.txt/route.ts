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

  if (!resolved) {
    // Return a disallow-all robots.txt for unknown hosts
    const robotsTxt = `User-agent: *
Disallow: /`;

    return new NextResponse(robotsTxt, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const { tenant, primaryDomain } = resolved;

  // If site is not active, disallow indexing
  if (tenant.status !== "active") {
    const robotsTxt = `User-agent: *
Disallow: /`;

    return new NextResponse(robotsTxt, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // Get the canonical domain
  const domain = primaryDomain?.domain || `${tenant.businessSlug}.paygsite.co.uk`;

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /portal/

Sitemap: https://${domain}/sitemap.xml`;

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
