"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { step2Schema, type Step2FormData } from "@/lib/validations/onboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ToneOfVoice } from "@/types/onboarding";

const TONE_OPTIONS: { value: ToneOfVoice; label: string; description: string }[] = [
  { value: "professional", label: "Professional", description: "Formal and business-like" },
  { value: "friendly", label: "Friendly", description: "Approachable and warm" },
  { value: "premium", label: "Premium", description: "High-end and luxurious" },
  { value: "straight_talking", label: "Straight-talking", description: "Direct and no-nonsense" },
  { value: "warm", label: "Warm", description: "Caring and personable" },
  { value: "bold", label: "Bold", description: "Confident and impactful" },
];

const DESIGN_VIBES = [
  "Modern & Clean",
  "Traditional & Classic",
  "Bold & Vibrant",
  "Minimal & Simple",
  "Warm & Welcoming",
  "Professional & Corporate",
];

export default function BrandPage() {
  const router = useRouter();
  const { step2, updateStep2, setCurrentStep, markStepComplete } = useOnboardingStore();

  const form = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      toneOfVoice: step2.toneOfVoice || "professional",
      hasBrandColours: step2.hasBrandColours || false,
      primaryColourHex: step2.primaryColourHex || "",
      secondaryColourHex: step2.secondaryColourHex || "",
      designVibe: step2.designVibe || "",
      tagline: step2.tagline || "",
      mustIncludePoints: step2.mustIncludePoints || [],
      mustAvoidWords: step2.mustAvoidWords || [],
    },
  });

  useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  const hasBrandColours = form.watch("hasBrandColours");

  const onSubmit = (data: Step2FormData) => {
    updateStep2(data);
    markStepComplete(2);
    setCurrentStep(3);
    router.push("/signup/trust");
  };

  const handleBack = () => {
    updateStep2(form.getValues());
    router.push("/signup/essentials");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Brand & Style</h1>
          <p className="text-muted-foreground mt-2">
            Help us capture your brand personality
          </p>
        </div>

        {/* Tone of Voice */}
        <Card>
          <CardHeader>
            <CardTitle>Tone of Voice</CardTitle>
            <CardDescription>How should your website sound?</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="toneOfVoice"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 md:grid-cols-3 gap-4"
                    >
                      {TONE_OPTIONS.map((option) => (
                        <div
                          key={option.value}
                          className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-all ${
                            field.value === option.value
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/50"
                          }`}
                          onClick={() => field.onChange(option.value)}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={option.value} />
                            <Label htmlFor={option.value} className="font-medium cursor-pointer">
                              {option.label}
                            </Label>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 ml-6">
                            {option.description}
                          </p>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Brand Colours */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Colours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="hasBrandColours"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>I have specific brand colours</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {hasBrandColours ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="primaryColourHex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Colour</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="#000000" {...field} />
                        </FormControl>
                        <div
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: field.value || "#ffffff" }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondaryColourHex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Colour</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="#000000" {...field} />
                        </FormControl>
                        <div
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: field.value || "#ffffff" }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <FormField
                control={form.control}
                name="designVibe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Design Vibe</FormLabel>
                    <FormDescription>
                      What feeling should your website convey?
                    </FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2"
                      >
                        {DESIGN_VIBES.map((vibe) => (
                          <div key={vibe} className="flex items-center space-x-2">
                            <RadioGroupItem value={vibe} id={vibe} />
                            <Label htmlFor={vibe} className="cursor-pointer">{vibe}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Tagline & Content Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Content Guidelines</CardTitle>
            <CardDescription>Optional but helpful</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tagline (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Quality you can trust" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mustIncludePoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Must Include (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Key points to mention, one per line"
                      value={field.value?.join("\n") || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value.split("\n").filter(Boolean)
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Important points your website must mention
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mustAvoidWords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Words to Avoid (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., cheap, budget, discount"
                      value={field.value?.join(", ") || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit">
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
