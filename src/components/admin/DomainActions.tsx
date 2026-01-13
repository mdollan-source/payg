"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw, Star, Trash2, Loader2 } from "lucide-react";

interface DomainActionsProps {
  domain: {
    id: string;
    domain: string;
    domainType: string;
    isPrimary: boolean;
    verificationStatus: string;
  };
  tenantId: string;
}

export function DomainActions({ domain, tenantId }: DomainActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);

    try {
      const response = await fetch(
        `/api/admin/tenants/${tenantId}/domains/${domain.id}/${action}`,
        { method: "POST" }
      );

      if (!response.ok) {
        const data = await response.json();
        console.error(data.error);
      }

      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete domain ${domain.domain}?`)) return;

    setLoading("delete");

    try {
      const response = await fetch(
        `/api/admin/tenants/${tenantId}/domains/${domain.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        console.error(data.error);
      }

      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  // Don't allow deleting the only subdomain
  const canDelete = domain.domainType === "custom";

  return (
    <div className="flex items-center gap-1">
      {/* Verify DNS */}
      {domain.verificationStatus !== "verified" && domain.domainType === "custom" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction("verify")}
          disabled={loading !== null}
          title="Verify DNS"
        >
          {loading === "verify" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      )}

      {/* Set as Primary */}
      {!domain.isPrimary && domain.verificationStatus === "verified" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction("set-primary")}
          disabled={loading !== null}
          title="Set as primary"
        >
          {loading === "set-primary" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Star className="w-4 h-4" />
          )}
        </Button>
      )}

      {/* Delete */}
      {canDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={loading !== null}
          title="Delete domain"
          className="text-red-600 hover:text-red-700"
        >
          {loading === "delete" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      )}
    </div>
  );
}
