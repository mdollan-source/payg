"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/portal/billing/create-portal-session", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error creating portal session:", error);
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <ExternalLink className="w-4 h-4 mr-2" />
      )}
      Manage Payment
    </Button>
  );
}
