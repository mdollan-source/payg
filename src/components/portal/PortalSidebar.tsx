"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  CreditCard,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/portal/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Pages",
    href: "/portal/pages",
    icon: FileText,
  },
  {
    label: "Change Requests",
    href: "/portal/tickets",
    icon: MessageSquare,
  },
  {
    label: "Billing",
    href: "/portal/billing",
    icon: CreditCard,
  },
];

export function PortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:bg-white lg:min-h-[calc(100vh-4rem)]">
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ExternalLink className="w-4 h-4" />
          View your website
        </a>
      </div>
    </aside>
  );
}
