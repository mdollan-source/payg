"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { step1Schema, type Step1FormData } from "@/lib/validations/onboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import type { ServiceAreaMode, CtaPreference } from "@/types/onboarding";

const CTA_OPTIONS: { value: CtaPreference; label: string }[] = [
  { value: "call_now", label: "Call Now" },
  { value: "get_quote", label: "Get a Quote" },
  { value: "book_now", label: "Book Now" },
  { value: "request_callback", label: "Request Callback" },
  { value: "email_us", label: "Email Us" },
];

export default function EssentialsPage() {
  const router = useRouter();
  const { step1, updateStep1, setCurrentStep, markStepComplete } = useOnboardingStore();

  const form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      businessName: step1.businessName || "",
      whatDoYouDo: step1.whatDoYouDo || "",
      services: step1.services?.length ? step1.services : [{ name: "" }],
      primaryLocation: step1.primaryLocation || "",
      serviceAreaMode: step1.serviceAreaMode || "radius",
      serviceAreaRadius: step1.serviceAreaRadius || 25,
      serviceAreaList: step1.serviceAreaList || [],
      phone: step1.phone || "",
      email: step1.email || "",
      ctaPreference: step1.ctaPreference || "get_quote",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "services",
  });

  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  const serviceAreaMode = form.watch("serviceAreaMode");

  const onSubmit = (data: Step1FormData) => {
    // Filter out empty services
    const filteredData = {
      ...data,
      services: data.services.filter((s) => s.name.trim() !== ""),
    };
    updateStep1(filteredData);
    markStepComplete(1);
    setCurrentStep(2);
    router.push("/signup/brand");
  };

  const handleBack = () => {
    // Save current data before going back
    const currentData = form.getValues();
    updateStep1(currentData);
    router.push("/signup");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Business Essentials</h1>
          <p className="text-muted-foreground mt-2">
            Tell us about your business
          </p>
        </div>

        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle>About Your Business</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Smith & Sons Plumbing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatDoYouDo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What do you do? *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., We provide reliable plumbing services for homes and businesses across Leicester"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    One sentence that describes your business
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle>Your Services</CardTitle>
            <CardDescription>Add 3-10 services you offer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`services.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder={`Service ${index + 1}`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            {fields.length < 10 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ name: "" })}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location & Service Area</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="primaryLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Location *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Leicester, Leicestershire" {...field} />
                  </FormControl>
                  <FormDescription>Town/city and county</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceAreaMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Area *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="radius" id="radius" />
                        <Label htmlFor="radius">Mile radius</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="list" id="list" />
                        <Label htmlFor="list">List of areas</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nationwide" id="nationwide" />
                        <Label htmlFor="nationwide">Nationwide</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serviceAreaMode === "radius" && (
              <FormField
                control={form.control}
                name="serviceAreaRadius"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Radius (miles)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 25)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {serviceAreaMode === "list" && (
              <FormField
                control={form.control}
                name="serviceAreaList"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Areas Covered</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter areas separated by commas, e.g., Leicester, Loughborough, Market Harborough"
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
            )}
          </CardContent>
        </Card>

        {/* Contact & CTA */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 0116 123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g., info@yourbusiness.co.uk" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ctaPreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Call-to-Action *</FormLabel>
                  <FormDescription>
                    What do you want visitors to do?
                  </FormDescription>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2"
                    >
                      {CTA_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value}>{option.label}</Label>
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
