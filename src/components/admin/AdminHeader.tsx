"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User } from "lucide-react";

interface AdminHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Mobile menu button */}
        <button
          className="lg:hidden p-2 -ml-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-semibold">Admin</span>
        </div>

        {/* Spacer for desktop */}
        <div className="hidden lg:block" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <span className="hidden sm:block text-sm font-medium">
              {user.name || user.email}
            </span>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1">
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <nav className="lg:hidden border-t p-4 space-y-1 bg-white">
          <Link
            href="/admin"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/admin/tenants"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            Tenants
          </Link>
          <Link
            href="/admin/tickets"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            Tickets
          </Link>
          <Link
            href="/admin/minutes"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            Minutes
          </Link>
          <Link
            href="/admin/jobs"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            Jobs
          </Link>
        </nav>
      )}
    </header>
  );
}
