import type { TenantSiteSettings } from "@prisma/client";

interface AboutSplitBlockProps {
  data: Record<string, unknown>;
  siteSettings?: TenantSiteSettings | null;
}

export function AboutSplitBlock({ data }: AboutSplitBlockProps) {
  const title = data.title as string || "About Us";
  const content = data.content as string || "";
  const imageUrl = data.imageUrl as string || "";
  const imagePosition = data.imagePosition as "left" | "right" || "right";

  const contentSection = (
    <div className="flex flex-col justify-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-6">{title}</h2>
      <div className="prose prose-lg text-gray-600 whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );

  const imageSection = imageUrl ? (
    <div className="relative aspect-square md:aspect-auto md:h-full min-h-[300px]">
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover rounded-lg"
      />
    </div>
  ) : (
    <div
      className="aspect-square md:aspect-auto md:h-full min-h-[300px] rounded-lg"
      style={{ backgroundColor: "var(--primary-color)", opacity: 0.1 }}
    />
  );

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {imagePosition === "left" ? (
            <>
              {imageSection}
              {contentSection}
            </>
          ) : (
            <>
              {contentSection}
              {imageSection}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
