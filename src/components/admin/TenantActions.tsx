"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Loader2, AlertTriangle, XCircle, CheckCircle } from "lucide-react";

interface TenantActionsProps {
  tenant: {
    id: string;
    status: string;
    businessName: string;
  };
}

export function TenantActions({ tenant }: TenantActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);
    setError(null);

    try {
      const response = await fetch(`/api/admin/tenants/${tenant.id}/${action}`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action}`);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(null);
    }
  };

  const showRebuild = tenant.status === "generation_failed" || tenant.status === "active" || tenant.status === "pending_review";
  const showCancel = tenant.status !== "cancelled" && tenant.status !== "archived";

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-500 mr-2">Actions:</span>

          {showRebuild && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("rebuild")}
              disabled={loading !== null}
            >
              {loading === "rebuild" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Rebuild Site
            </Button>
          )}

          {tenant.status === "building" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("force-complete")}
              disabled={loading !== null}
            >
              {loading === "force-complete" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4 mr-2" />
              )}
              Force Complete
            </Button>
          )}

          {tenant.status === "pending_review" && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleAction("approve")}
              disabled={loading !== null}
            >
              {loading === "approve" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve & Go Live
            </Button>
          )}

          {showCancel && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => {
                if (confirm(`Are you sure you want to cancel ${tenant.businessName}?`)) {
                  handleAction("cancel");
                }
              }}
              disabled={loading !== null}
            >
              {loading === "cancel" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Cancel Subscription
            </Button>
          )}

          {error && (
            <span className="text-sm text-red-600">{error}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
