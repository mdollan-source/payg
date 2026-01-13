"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, Trash2 } from "lucide-react";

interface JobActionsProps {
  job: {
    id: string;
    status: string;
  };
}

export function JobActions({ job }: JobActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);

    try {
      const response = await fetch(`/api/admin/jobs/${job.id}/${action}`, {
        method: "POST",
      });

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

  const canRetry = job.status === "failed" || job.status === "dead";
  const canDelete = job.status === "completed" || job.status === "dead";

  return (
    <div className="flex items-center gap-1">
      {canRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction("retry")}
          disabled={loading !== null}
          title="Retry job"
        >
          {loading === "retry" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      )}
      {canDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction("delete")}
          disabled={loading !== null}
          title="Delete job"
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
