import type { TenantSiteSettings } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CtaBannerBlockProps {
  data: Record<string, unknown>;
  siteSettings?: TenantSiteSettings | null;
}

export function CtaBannerBlock({ data, siteSettings }: CtaBannerBlockProps) {
  const headline = data.headline as string || "Ready to Get Started?";
  const description = data.description as string || "";
  const ctaText = data.ctaText as string || "Contact Us";
  const ctaLink = data.ctaLink as string || "#contact";

  return (
    <section
      className="py-16 md:py-20"
      style={{ backgroundColor: "var(--primary-color)" }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{headline}</h2>
          {description && (
            <p className="text-lg opacity-90 mb-8">{description}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              variant="default"
              className="bg-white text-gray-900 hover:bg-gray-100"
            >
              <Link href={ctaLink}>{ctaText}</Link>
            </Button>
            {siteSettings?.phone && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                <a href={`tel:${siteSettings.phone.replace(/\s/g, "")}`}>
                  Call {siteSettings.phone}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
