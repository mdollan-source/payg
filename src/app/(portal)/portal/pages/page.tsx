import Link from "next/link";
import { getUserTenant } from "@/lib/portal/get-user-tenant";
import { getDb } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Edit, ExternalLink, Home } from "lucide-react";

export default async function PagesPage() {
  const { tenant } = await getUserTenant();

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No website found.</p>
      </div>
    );
  }

  const db = getDb();
  const pages = await db.page.findMany({
    where: { tenantId: tenant.id },
    orderBy: { sortOrder: "asc" },
    include: {
      blocks: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const primaryDomain = await db.tenantDomain.findFirst({
    where: { tenantId: tenant.id, isPrimary: true },
  });

  const siteUrl = primaryDomain
    ? `https://${primaryDomain.domain}`
    : `https://${tenant.businessSlug}.paygsite.co.uk`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pages</h1>
          <p className="text-gray-500">Manage your website pages</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Pages</CardTitle>
          <CardDescription>
            Click on a page to edit its content. Some fields can be edited directly,
            while others require a change request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pages yet</p>
              <p className="text-sm">Your pages will appear here once your site is built.</p>
            </div>
          ) : (
            <div className="divide-y">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      {page.slug === "/" ? (
                        <Home className="w-5 h-5 text-gray-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{page.title}</h3>
                      <p className="text-sm text-gray-500">{page.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      page.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {page.status}
                    </span>
                    <Button asChild variant="ghost" size="sm">
                      <a
                        href={`${siteUrl}${page.slug === "/" ? "" : page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/portal/pages/${page.id}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Need more changes?</CardTitle>
          <CardDescription>
            For changes that can&apos;t be made through self-service editing, submit a change request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/portal/tickets/new">Request a Change</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
