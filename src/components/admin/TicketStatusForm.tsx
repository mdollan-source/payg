"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface TicketStatusFormProps {
  ticketId: string;
  currentStatus: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "needs_info", label: "Needs Info" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export function TicketStatusForm({ ticketId, currentStatus }: TicketStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === currentStatus) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-4">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="px-3 py-2 border rounded-md text-sm bg-white flex-1"
        disabled={loading}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={loading || status === currentStatus}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Update
      </Button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  );
}
