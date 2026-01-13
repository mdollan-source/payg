"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { step3Schema, type Step3FormData } from "@/lib/validations/onboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";

export default function TrustPage() {
  const router = useRouter();
  const { step3, updateStep3, setCurrentStep, markStepComplete } = useOnboardingStore();

  const form = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      accreditations: step3.accreditations || [],
      yearsInBusiness: step3.yearsInBusiness,
      testimonials: step3.testimonials?.length ? step3.testimonials : [],
      caseStudies: step3.caseStudies || [],
    },
  });

  const testimonialFields = useFieldArray({
    control: form.control,
    name: "testimonials",
  });

  useEffect(() => {
    setCurrentStep(3);
  }, [setCurrentStep]);

  const onSubmit = (data: Step3FormData) => {
    // Clean up empty testimonials
    const cleanedData = {
      ...data,
      testimonials: data.testimonials?.filter((t) => t.name && t.text) || [],
    };
    updateStep3(cleanedData);
    markStepComplete(3);
    setCurrentStep(4);
    router.push("/signup/practical");
  };

  const handleBack = () => {
    updateStep3(form.getValues());
    router.push("/signup/brand");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Trust Signals</h1>
          <p className="text-muted-foreground mt-2">
            Build credibility with your visitors (all optional)
          </p>
        </div>

        {/* Experience */}
        <Card>
          <CardHeader>
            <CardTitle>Experience & Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="yearsInBusiness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years in Business</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={200}
                      placeholder="e.g., 15"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accreditations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accreditations & Memberships</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Gas Safe Registered, NICEIC Approved, Trading Standards Approved"
                      value={field.value?.join("\n") || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value.split("\n").filter(Boolean)
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>One per line</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Testimonials */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Testimonials</CardTitle>
            <CardDescription>Add up to 5 testimonials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testimonialFields.fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Testimonial {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => testimonialFields.remove(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name={`testimonials.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`testimonials.${index}.text`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What they said</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Excellent service, arrived on time and fixed the problem quickly..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`testimonials.${index}.location`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Leicester" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}

            {(testimonialFields.fields.length || 0) < 5 && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  testimonialFields.append({ name: "", text: "", location: "" })
                }
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Testimonial
              </Button>
            )}
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
