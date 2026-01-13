import type { TenantSiteSettings } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeroBlockProps {
  data: Record<string, unknown>;
  siteSettings?: TenantSiteSettings | null;
}

export function HeroBlock({ data, siteSettings }: HeroBlockProps) {
  const headline = data.headline as string || "Welcome";
  const subheadline = data.subheadline as string || "";
  const ctaText = data.ctaText as string || "Get Started";
  const ctaLink = data.ctaLink as string || "#contact";
  const imageUrl = data.imageUrl as string || "";

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background Image or Gradient */}
      {imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)`,
          }}
        />
      )}

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {headline}
          </h1>
          {subheadline && (
            <p className="text-lg md:text-xl mb-8 opacity-90">
              {subheadline}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="default" className="bg-white text-gray-900 hover:bg-gray-100">
              <Link href={ctaLink}>
                {ctaText}
              </Link>
            </Button>
            {siteSettings?.phone && (
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
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
