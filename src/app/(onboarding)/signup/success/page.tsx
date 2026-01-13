"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant");
  const { step1, reset } = useOnboardingStore();

  // Clear onboarding data on success
  useEffect(() => {
    // Delay reset to ensure we can still show the business name
    const timer = setTimeout(() => {
      reset();
    }, 5000);
    return () => clearTimeout(timer);
  }, [reset]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">You&apos;re all set!</h1>
        <p className="text-muted-foreground mt-2">
          We&apos;re building your website right now
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            </div>
            <div>
              <p className="font-medium">AI is generating your content</p>
              <p className="text-sm text-muted-foreground">
                Based on your answers, we&apos;re creating tailored copy for your website
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium">2</span>
            </div>
            <div>
              <p className="font-medium">Your site goes live</p>
              <p className="text-sm text-muted-foreground">
                Within a few minutes, your website will be available at your subdomain
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium">3</span>
            </div>
            <div>
              <p className="font-medium">Check your email</p>
              <p className="text-sm text-muted-foreground">
                We&apos;ll send you a link to your dashboard where you can edit your site
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary">
        <CardHeader>
          <CardTitle>Your Website</CardTitle>
          <CardDescription>
            {step1.businessName || "Your business"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your site will be available at:
          </p>
          <div className="p-3 bg-muted rounded-lg font-mono text-sm">
            https://your-business.paygsite.co.uk
          </div>

          <div className="flex gap-4">
            <Button asChild className="flex-1">
              <Link href="/portal/dashboard">
                Go to Dashboard
                <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
