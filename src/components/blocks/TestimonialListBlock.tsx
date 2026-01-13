import type { TenantSiteSettings } from "@prisma/client";
import { Star, Quote } from "lucide-react";

interface Testimonial {
  quote: string;
  author: string;
  role?: string;
  rating?: number;
}

interface TestimonialListBlockProps {
  data: Record<string, unknown>;
  siteSettings?: TenantSiteSettings | null;
}

export function TestimonialListBlock({ data }: TestimonialListBlockProps) {
  const title = data.title as string || "What Our Customers Say";
  const testimonials = data.testimonials as Testimonial[] || [];

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 shadow-sm"
            >
              <Quote
                className="w-8 h-8 mb-4 opacity-20"
                style={{ color: "var(--primary-color)" }}
              />
              {testimonial.rating && (
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonial.rating!
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}
              <p className="text-gray-600 mb-4 italic">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div>
                <p className="font-semibold">{testimonial.author}</p>
                {testimonial.role && (
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
