"use client";

import type { TenantSiteSettings } from "@prisma/client";
import { useState } from "react";
import { X } from "lucide-react";

interface GalleryImage {
  url: string;
  caption?: string;
}

interface GalleryGridBlockProps {
  data: Record<string, unknown>;
  siteSettings?: TenantSiteSettings | null;
}

export function GalleryGridBlock({ data }: GalleryGridBlockProps) {
  const title = data.title as string || "Our Work";
  const images = data.images as GalleryImage[] || [];
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);

  if (images.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {title}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setLightboxImage(image)}
              className="relative aspect-square overflow-hidden rounded-lg group"
            >
              <img
                src={image.url}
                alt={image.caption || `Gallery image ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {image.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm">{image.caption}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightboxImage.url}
            alt={lightboxImage.caption || "Gallery image"}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxImage.caption && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-lg">
              {lightboxImage.caption}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
