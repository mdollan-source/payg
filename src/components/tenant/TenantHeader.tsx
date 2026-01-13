"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TenantHeaderProps {
  siteName: string;
  tagline?: string;
  logoUrl?: string;
  navigation: Array<{ label: string; href: string }>;
  phone?: string;
}

export function TenantHeader({
  siteName,
  tagline,
  logoUrl,
  navigation,
  phone,
}: TenantHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Site Name */}
          <Link href="/" className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={siteName}
                className="h-10 w-auto"
              />
            ) : (
              <span className="text-xl font-bold" style={{ color: "var(--primary-color)" }}>
                {siteName}
              </span>
            )}
            {tagline && !logoUrl && (
              <span className="hidden md:block text-sm text-gray-500">
                {tagline}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                {link.label}
              </Link>
            ))}
            {phone && (
              <Button asChild variant="default" style={{ backgroundColor: "var(--primary-color)" }}>
                <a href={`tel:${phone.replace(/\s/g, "")}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  {phone}
                </a>
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              {navigation.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-600 hover:text-gray-900 font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {phone && (
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 text-white font-medium py-2 px-4 rounded"
                  style={{ backgroundColor: "var(--primary-color)" }}
                >
                  <Phone className="w-4 h-4" />
                  {phone}
                </a>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
