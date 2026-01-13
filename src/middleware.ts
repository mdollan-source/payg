import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for routing requests based on hostname
 *
 * Routes:
 * - paygsite.co.uk / localhost -> Main marketing site + app
 * - *.paygsite.co.uk (subdomains) -> Tenant sites
 * - Custom domains -> Tenant sites
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // Skip middleware for static files and API routes
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes(".") // Static files
  ) {
    return NextResponse.next();
  }

  // Check if this is a tenant domain
  if (isTenantDomain(hostname)) {
    // Rewrite to tenant route group
    url.pathname = `/tenant${url.pathname}`;

    // Pass tenant hostname to the route
    const response = NextResponse.rewrite(url);
    response.headers.set("x-tenant-host", hostname);
    return response;
  }

  // Main site requests continue normally
  return NextResponse.next();
}

/**
 * Check if a hostname is a tenant domain (vs main app domain)
 */
function isTenantDomain(hostname: string): boolean {
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

  // Subdomain pattern (e.g., acme-plumbing.paygsite.co.uk)
  if (host.match(/^[a-z0-9-]+\.paygsite\.co\.uk$/)) {
    return true;
  }

  // Custom domains - assume anything else is a tenant
  // In production, could verify against database
  return true;
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
