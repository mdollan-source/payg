"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";

interface TimeLogFormProps {
  ticketId: string;
  tenantId: string;
}

export function TimeLogForm({ ticketId, tenantId }: TimeLogFormProps) {
  const router = useRouter();
  const [minutes, setMinutes] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const mins = parseInt(minutes);
    if (isNaN(mins) || mins <= 0) {
      setError("Please enter a valid number of minutes");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}/time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minutes: mins,
          description: description || undefined,
          tenantId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to log time");
      }

      setMinutes("");
      setDescription("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <Input
          type="number"
          placeholder="Minutes"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="w-24"
          min="1"
          disabled={loading}
        />
        <Input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !minutes}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
