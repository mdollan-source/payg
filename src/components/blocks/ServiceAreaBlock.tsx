import type { TenantSiteSettings } from "@prisma/client";
import { MapPin } from "lucide-react";

interface ServiceAreaBlockProps {
  data: Record<string, unknown>;
  siteSettings?: TenantSiteSettings | null;
}

export function ServiceAreaBlock({ data }: ServiceAreaBlockProps) {
  const title = data.title as string || "Areas We Cover";
  const description = data.description as string || "";
  const areas = data.areas as string[] || [];

  if (areas.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{title}</h2>
          {description && (
            <p className="text-gray-600 text-lg mb-8">{description}</p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {areas.map((area, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-700"
            >
              <MapPin className="w-4 h-4" style={{ color: "var(--primary-color)" }} />
              {area}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
