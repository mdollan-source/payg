"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import type { PlanPages, Industry } from "@/types/onboarding";

const PLANS: { pages: PlanPages; price: string; features: string[] }[] = [
  {
    pages: 1,
    price: "£29",
    features: [
      "Single landing page",
      "Contact form",
      "Mobile responsive",
      "30 mins/month changes",
    ],
  },
  {
    pages: 5,
    price: "£49",
    features: [
      "5 pages (Home, About, Services, Gallery, Contact)",
      "Contact form",
      "Mobile responsive",
      "60 mins/month changes",
    ],
  },
  {
    pages: 10,
    price: "£79",
    features: [
      "10 pages including service pages",
      "Contact form + FAQs",
      "Mobile responsive",
      "120 mins/month changes",
    ],
  },
];

const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: "trades", label: "Trades & Construction" },
  { value: "professional", label: "Professional Services" },
  { value: "beauty_wellness", label: "Beauty & Wellness" },
  { value: "hospitality", label: "Hospitality & Food" },
  { value: "retail", label: "Retail & Shopping" },
  { value: "other", label: "Other" },
];

export default function SignupPage() {
  const router = useRouter();
  const { step0, updateStep0, setCurrentStep, markStepComplete } = useOnboardingStore();

  useEffect(() => {
    setCurrentStep(0);
  }, [setCurrentStep]);

  const handleContinue = () => {
    markStepComplete(0);
    setCurrentStep(1);
    router.push("/signup/essentials");
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Choose Your Plan</h1>
        <p className="text-muted-foreground mt-2">
          Select the plan that best fits your business needs
        </p>
      </div>

      {/* Plan Selection */}
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.pages}
            className={`cursor-pointer transition-all ${
              step0.planPages === plan.pages
                ? "border-primary ring-2 ring-primary/20"
                : "hover:border-primary/50"
            }`}
            onClick={() => updateStep0({ planPages: plan.pages })}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.pages} Page{plan.pages > 1 ? "s" : ""}</span>
                {step0.planPages === plan.pages && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Industry Selection */}
      <Card>
        <CardHeader>
          <CardTitle>What industry are you in?</CardTitle>
          <CardDescription>
            This helps us tailor your website content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={step0.industry}
            onValueChange={(value) => updateStep0({ industry: value as Industry })}
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {INDUSTRIES.map((industry) => (
              <div key={industry.value} className="flex items-center space-x-2">
                <RadioGroupItem value={industry.value} id={industry.value} />
                <Label htmlFor={industry.value} className="cursor-pointer">
                  {industry.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button size="lg" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
