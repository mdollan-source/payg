"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Ticket,
  Clock,
  AlertTriangle,
  Settings,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Tenants", href: "/admin/tenants", icon: Building2 },
  { name: "Tickets", href: "/admin/tickets", icon: Ticket },
  { name: "Minutes", href: "/admin/minutes", icon: Clock },
  { name: "Jobs", href: "/admin/jobs", icon: AlertTriangle },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 bg-gray-900 lg:block">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-800">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">P</span>
        </div>
        <span className="text-white font-semibold">PAYGSite Admin</span>
      </div>
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
