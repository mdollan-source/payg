import type { TenantSiteSettings } from "@prisma/client";

interface Accreditation {
  name: string;
  imageUrl?: string;
}

interface AccreditationsRowBlockProps {
  data: Record<string, unknown>;
  siteSettings?: TenantSiteSettings | null;
}

export function AccreditationsRowBlock({ data }: AccreditationsRowBlockProps) {
  const title = data.title as string || "Trusted & Accredited";
  const accreditations = data.accreditations as Accreditation[] || [];

  if (accreditations.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white border-y">
      <div className="container mx-auto px-4">
        {title && (
          <h2 className="text-lg font-medium text-center text-gray-500 mb-8">
            {title}
          </h2>
        )}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {accreditations.map((accreditation, index) => (
            <div
              key={index}
              className="flex items-center justify-center"
              title={accreditation.name}
            >
              {accreditation.imageUrl ? (
                <img
                  src={accreditation.imageUrl}
                  alt={accreditation.name}
                  className="h-12 md:h-16 w-auto grayscale hover:grayscale-0 transition-all"
                />
              ) : (
                <span className="text-gray-400 font-medium">
                  {accreditation.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
