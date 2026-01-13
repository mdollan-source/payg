"use client";

import type { TenantSiteSettings } from "@prisma/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin, Loader2 } from "lucide-react";

interface ContactFormBlockProps {
  data: Record<string, unknown>;
  siteSettings?: TenantSiteSettings | null;
}

export function ContactFormBlock({ data, siteSettings }: ContactFormBlockProps) {
  const title = data.title as string || "Get in Touch";
  const description = data.description as string || "";
  const submitText = data.submitText as string || "Send Message";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // TODO: Implement actual form submission
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
            {description && (
              <p className="text-gray-600 text-lg">{description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Contact Information</h3>

              {siteSettings?.phone && (
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--primary-color)" }}
                  >
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <a
                      href={`tel:${siteSettings.phone.replace(/\s/g, "")}`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {siteSettings.phone}
                    </a>
                  </div>
                </div>
              )}

              {siteSettings?.email && (
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--primary-color)" }}
                  >
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <a
                      href={`mailto:${siteSettings.email}`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {siteSettings.email}
                    </a>
                  </div>
                </div>
              )}

              {siteSettings?.address && (
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--primary-color)" }}
                  >
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-gray-600">{siteSettings.address}</p>
                  </div>
                </div>
              )}

              {siteSettings?.openingHours && (
                <div className="mt-8 p-4 bg-white rounded-lg">
                  <p className="font-medium mb-2">Opening Hours</p>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {siteSettings.openingHours}
                  </p>
                </div>
              )}
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              {submitted ? (
                <div className="text-center py-8">
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: "var(--primary-color)" }}
                  >
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
                  <p className="text-gray-600">
                    We&apos;ve received your message and will get back to you soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="01onal 234 5678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <textarea
                      id="message"
                      className="w-full min-h-[120px] px-3 py-2 border rounded-md resize-y"
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      required
                      placeholder="How can we help?"
                    />
                  </div>

                  {error && (
                    <p className="text-red-600 text-sm">{error}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    style={{ backgroundColor: "var(--primary-color)" }}
                    disabled={submitting}
                  >
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {submitText}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
