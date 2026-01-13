import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

interface TenantFooterProps {
  siteName: string;
  navigation: Array<{ label: string; href: string }>;
  phone?: string;
  email?: string;
  address?: string;
  disclaimer?: string;
}

export function TenantFooter({
  siteName,
  navigation,
  phone,
  email,
  address,
  disclaimer,
}: TenantFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">{siteName}</h3>
            {address && (
              <p className="flex items-start gap-2 mb-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>{address}</span>
              </p>
            )}
            {phone && (
              <p className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-white">
                  {phone}
                </a>
              </p>
            )}
            {email && (
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white">
                  {email}
                </a>
              </p>
            )}
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              {navigation.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Opening Hours / Additional Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Get In Touch</h3>
            <p className="mb-4">
              Contact us today for a free quote and consultation.
            </p>
            {phone && (
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="inline-block px-6 py-2 rounded font-medium text-white"
                style={{ backgroundColor: "var(--primary-color)" }}
              >
                Call Us Now
              </a>
            )}
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-sm text-gray-400">
          {disclaimer && (
            <p className="mb-4">{disclaimer}</p>
          )}
          <p>
            &copy; {currentYear} {siteName}. All rights reserved.
          </p>
          <p className="mt-2 text-xs">
            Website by{" "}
            <a
              href="https://paygsite.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              PAYGSite
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
