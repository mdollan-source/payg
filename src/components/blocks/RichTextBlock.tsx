import type { TenantSiteSettings } from "@prisma/client";

interface RichTextBlockProps {
  data: Record<string, unknown>;
  siteSettings?: TenantSiteSettings | null;
}

export function RichTextBlock({ data }: RichTextBlockProps) {
  const content = data.content as string || "";

  if (!content) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto prose prose-lg">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    </section>
  );
}
