"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface TicketFiltersProps {
  currentStatus: string;
  currentCategory: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "needs_info", label: "Needs Info" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "content", label: "Content" },
  { value: "seo", label: "SEO" },
  { value: "design", label: "Design" },
  { value: "new_page", label: "New Page" },
  { value: "other", label: "Other" },
];

export function TicketFilters({ currentStatus, currentCategory }: TicketFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/admin/tickets?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex gap-4">
      {/* Status Filter */}
      <select
        value={currentStatus}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="px-3 py-2 border rounded-md text-sm bg-white"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Category Filter */}
      <select
        value={currentCategory}
        onChange={(e) => updateFilter("category", e.target.value)}
        className="px-3 py-2 border rounded-md text-sm bg-white"
      >
        {CATEGORY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
