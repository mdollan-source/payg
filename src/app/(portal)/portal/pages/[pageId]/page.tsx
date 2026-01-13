import { notFound } from "next/navigation";
import Link from "next/link";
import { getUserTenant } from "@/lib/portal/get-user-tenant";
import { getDb } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { BlockEditor } from "@/components/portal/BlockEditor";

interface PageEditorProps {
  params: Promise<{ pageId: string }>;
}

export default async function PageEditorPage({ params }: PageEditorProps) {
  const { pageId } = await params;
  const { tenant } = await getUserTenant();

  if (!tenant) {
    notFound();
  }

  const db = getDb();
  const page = await db.page.findFirst({
    where: {
      id: pageId,
      tenantId: tenant.id,
    },
    include: {
      blocks: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!page) {
    notFound();
  }

  const primaryDomain = await db.tenantDomain.findFirst({
    where: { tenantId: tenant.id, isPrimary: true },
  });

  const siteUrl = primaryDomain
    ? `https://${primaryDomain.domain}`
    : `https://${tenant.businessSlug}.paygsite.co.uk`;

  const pageUrl = `${siteUrl}${page.slug === "/" ? "" : page.slug}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/portal/pages">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pages
            </Link>
          </Button>
        </div>
        <Button asChild variant="outline">
          <a href={pageUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Preview Page
          </a>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{page.title}</h1>
        <p className="text-gray-500">{page.slug}</p>
      </div>

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
          <CardDescription>
            These settings affect how your page appears in search results.
            Changes here require a change request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">SEO Title</label>
            <p className="mt-1">{page.seoTitle || page.title}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Meta Description</label>
            <p className="mt-1 text-gray-600">{page.seoDescription || "Not set"}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/portal/tickets/new?type=seo&pageId=${page.id}`}>
              Request SEO Changes
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Page Blocks */}
      <Card>
        <CardHeader>
          <CardTitle>Page Content</CardTitle>
          <CardDescription>
            Edit the content blocks on this page. Fields marked with a lock icon
            require a change request to modify.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {page.blocks.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No content blocks on this page.
            </p>
          ) : (
            page.blocks.map((block, index) => (
              <BlockEditor
                key={block.id}
                block={block}
                pageId={page.id}
                index={index}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
