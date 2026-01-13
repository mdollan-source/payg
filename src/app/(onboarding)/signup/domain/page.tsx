"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { step5Schema, type Step5FormData } from "@/lib/validations/onboarding";
import { generateSlug } from "@/lib/tenant/slug";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Globe, ExternalLink, Loader2 } from "lucide-react";

export default function DomainPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { step1, step5, updateStep5, setCurrentStep, markStepComplete, getAllData } =
    useOnboardingStore();

  const form = useForm<Step5FormData>({
    resolver: zodResolver(step5Schema),
    defaultValues: {
      hasExistingDomain: step5.hasExistingDomain || false,
      existingDomain: step5.existingDomain || "",
      registrar: step5.registrar || "",
      hasDnsAccess: step5.hasDnsAccess,
    },
  });

  useEffect(() => {
    setCurrentStep(5);
  }, [setCurrentStep]);

  const hasExistingDomain = form.watch("hasExistingDomain");
  const hasDnsAccess = form.watch("hasDnsAccess");

  // Generate preview subdomain from business name
  const previewSlug = step1.businessName
    ? generateSlug(step1.businessName)
    : "your-business";

  const onSubmit = async (data: Step5FormData) => {
    setIsSubmitting(true);
    updateStep5(data);
    markStepComplete(5);

    try {
      // Get all onboarding data
      const allData = getAllData();

      // Submit to API and redirect to Stripe Checkout
      const response = await fetch("/api/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit onboarding");
      }

      const { checkoutUrl } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Onboarding submission error:", error);
      setIsSubmitting(false);
      // TODO: Show error toast
    }
  };

  const handleBack = () => {
    updateStep5(form.getValues());
    router.push("/signup/practical");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Your Domain</h1>
          <p className="text-muted-foreground mt-2">
            Where should your website live?
          </p>
        </div>

        {/* Free Subdomain */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Your Free Subdomain
            </CardTitle>
            <CardDescription>
              Your site will be live at this address immediately
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <span className="text-lg font-mono">
                <span className="text-primary font-semibold">{previewSlug}</span>
                .paygsite.co.uk
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              You can connect your own domain later
            </p>
          </CardContent>
        </Card>

        {/* Custom Domain */}
        <Card>
          <CardHeader>
            <CardTitle>Do you already own a domain?</CardTitle>
            <CardDescription>
              e.g., yourbusiness.co.uk
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="hasExistingDomain"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === "yes")}
                      value={field.value ? "yes" : "no"}
                      className="grid grid-cols-2 gap-4"
                    >
                      <Label
                        htmlFor="no-domain"
                        className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                          !field.value ? "border-primary bg-primary/5" : "hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value="no" id="no-domain" />
                        <span>No, I&apos;ll use the free subdomain</span>
                      </Label>
                      <Label
                        htmlFor="yes-domain"
                        className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                          field.value ? "border-primary bg-primary/5" : "hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value="yes" id="yes-domain" />
                        <span>Yes, I own a domain</span>
                      </Label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {hasExistingDomain && (
              <div className="space-y-4 pt-4 border-t">
                <FormField
                  control={form.control}
                  name="existingDomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain Name</FormLabel>
                      <FormControl>
                        <Input placeholder="yourbusiness.co.uk" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Where did you register it?</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., GoDaddy, 123-reg, Namecheap" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasDnsAccess"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do you have access to DNS settings?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value === "yes")}
                          value={field.value === true ? "yes" : field.value === false ? "no" : undefined}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="dns-yes" />
                            <Label htmlFor="dns-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="dns-no" />
                            <Label htmlFor="dns-no">No / Not sure</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {hasDnsAccess === false && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      No problem!
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      We&apos;ll send you simple instructions after you sign up, or we can help you set it up.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary & Submit */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Ready to get started?</CardTitle>
            <CardDescription>
              After payment, we&apos;ll build your website using AI and have it live within minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue to Payment
                  <ExternalLink className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Back button */}
        <div className="flex justify-start">
          <Button type="button" variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </form>
    </Form>
  );
}
