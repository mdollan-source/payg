"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";

interface AddDomainFormProps {
  tenantId: string;
}

export function AddDomainForm({ tenantId }: AddDomainFormProps) {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const cleanDomain = domain.trim().toLowerCase();
    if (!cleanDomain) {
      setError("Please enter a domain");
      return;
    }

    // Simple domain format validation
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
    if (!domainRegex.test(cleanDomain)) {
      setError("Invalid domain format");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/domains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: cleanDomain }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add domain");
      }

      setDomain("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3">
        <Input
          type="text"
          placeholder="example.com or www.example.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !domain.trim()}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Add Domain
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
