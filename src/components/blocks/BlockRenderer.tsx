import type { TenantSiteSettings } from "@prisma/client";
import { HeroBlock } from "./HeroBlock";
import { ServicesGridBlock } from "./ServicesGridBlock";
import { AboutSplitBlock } from "./AboutSplitBlock";
import { TestimonialListBlock } from "./TestimonialListBlock";
import { AccreditationsRowBlock } from "./AccreditationsRowBlock";
import { GalleryGridBlock } from "./GalleryGridBlock";
import { FaqAccordionBlock } from "./FaqAccordionBlock";
import { ServiceAreaBlock } from "./ServiceAreaBlock";
import { ContactFormBlock } from "./ContactFormBlock";
import { CtaBannerBlock } from "./CtaBannerBlock";
import { RichTextBlock } from "./RichTextBlock";

interface BlockRendererProps {
  blockType: string;
  data: Record<string, unknown>;
  siteSettings?: TenantSiteSettings | null;
}

const blockComponents: Record<string, React.ComponentType<{ data: Record<string, unknown>; siteSettings?: TenantSiteSettings | null }>> = {
  hero: HeroBlock,
  services_grid: ServicesGridBlock,
  about_split: AboutSplitBlock,
  testimonial_list: TestimonialListBlock,
  accreditations_row: AccreditationsRowBlock,
  gallery_grid: GalleryGridBlock,
  faq_accordion: FaqAccordionBlock,
  service_area: ServiceAreaBlock,
  contact_form: ContactFormBlock,
  cta_banner: CtaBannerBlock,
  rich_text: RichTextBlock,
};

export function BlockRenderer({ blockType, data, siteSettings }: BlockRendererProps) {
  const Component = blockComponents[blockType];

  if (!Component) {
    console.warn(`Unknown block type: ${blockType}`);
    return (
      <div className="py-8 px-4 bg-gray-100 text-center text-gray-500">
        Unknown block type: {blockType}
      </div>
    );
  }

  return <Component data={data} siteSettings={siteSettings} />;
}
