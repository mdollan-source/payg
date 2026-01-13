"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useCallback, useState } from "react";

interface TenantFiltersProps {
  currentStatus: string;
  currentPlan: string;
  currentSearch: string;
  statusCounts: Record<string, number>;
  planCounts: Record<number, number>;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "building", label: "Building" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "generation_failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

const PLAN_OPTIONS = [
  { value: "all", label: "All Plans" },
  { value: "1", label: "1 Page" },
  { value: "5", label: "5 Pages" },
  { value: "10", label: "10 Pages" },
];

export function TenantFilters({
  currentStatus,
  currentPlan,
  currentSearch,
  statusCounts,
  planCounts,
}: TenantFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/admin/tenants?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("search", search);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="search"
          placeholder="Search by name or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </form>

      {/* Status Filter */}
      <select
        value={currentStatus}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="px-3 py-2 border rounded-md text-sm bg-white"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.value !== "all" && statusCounts[option.value]
              ? ` (${statusCounts[option.value]})`
              : ""}
          </option>
        ))}
      </select>

      {/* Plan Filter */}
      <select
        value={currentPlan}
        onChange={(e) => updateFilter("plan", e.target.value)}
        className="px-3 py-2 border rounded-md text-sm bg-white"
      >
        {PLAN_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.value !== "all" && planCounts[parseInt(option.value)]
              ? ` (${planCounts[parseInt(option.value)]})`
              : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
