interface LocalBusinessSchemaProps {
  businessName: string;
  url: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  logo?: string | null;
  openingHours?: string | null;
  priceRange?: string | null;
  serviceArea?: string[] | null;
}

export function LocalBusinessSchema({
  businessName,
  url,
  description,
  phone,
  email,
  address,
  logo,
  openingHours,
  priceRange,
  serviceArea,
}: LocalBusinessSchemaProps) {
  // Parse address into structured format if possible
  // Simple parsing - assumes UK format: "123 Street Name, Town, County, POSTCODE"
  let streetAddress: string | undefined;
  let addressLocality: string | undefined;
  let addressRegion: string | undefined;
  let postalCode: string | undefined;
  let addressCountry = "GB";

  if (address) {
    const parts = address.split(",").map((p) => p.trim());
    if (parts.length >= 1) streetAddress = parts[0];
    if (parts.length >= 2) addressLocality = parts[1];
    if (parts.length >= 3) addressRegion = parts[2];
    if (parts.length >= 4) {
      // Try to extract postcode (UK format)
      const lastPart = parts[parts.length - 1];
      const postcodeMatch = lastPart.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/i);
      if (postcodeMatch) {
        postalCode = postcodeMatch[0].toUpperCase();
      }
    }
  }

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: businessName,
    url,
  };

  if (description) {
    schema.description = description;
  }

  if (logo) {
    schema.logo = logo;
    schema.image = logo;
  }

  if (phone) {
    schema.telephone = phone;
  }

  if (email) {
    schema.email = email;
  }

  if (streetAddress || addressLocality || postalCode) {
    schema.address = {
      "@type": "PostalAddress",
      ...(streetAddress && { streetAddress }),
      ...(addressLocality && { addressLocality }),
      ...(addressRegion && { addressRegion }),
      ...(postalCode && { postalCode }),
      addressCountry,
    };
  }

  if (openingHours) {
    // Assume format like "Mon-Fri 9am-5pm"
    schema.openingHours = openingHours;
  }

  if (priceRange) {
    schema.priceRange = priceRange;
  }

  if (serviceArea && serviceArea.length > 0) {
    schema.areaServed = serviceArea.map((area) => ({
      "@type": "Place",
      name: area,
    }));
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
