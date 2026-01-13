"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { step4Schema, type Step4FormData } from "@/lib/validations/onboarding";
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
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { BookingPreference } from "@/types/onboarding";

const BOOKING_OPTIONS: { value: BookingPreference; label: string; description: string }[] = [
  {
    value: "phone_email",
    label: "Phone or Email Only",
    description: "Customers contact you directly",
  },
  {
    value: "enquiry_form",
    label: "Enquiry Form",
    description: "Customers fill out a contact form",
  },
  {
    value: "external_link",
    label: "External Booking System",
    description: "Link to your existing booking system",
  },
];

export default function PracticalPage() {
  const router = useRouter();
  const { step4, updateStep4, setCurrentStep, markStepComplete } = useOnboardingStore();

  const form = useForm<Step4FormData>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      openingHours: step4.openingHours || "",
      address: step4.address || "",
      bookingPreference: step4.bookingPreference || "enquiry_form",
      externalBookingUrl: step4.externalBookingUrl || "",
    },
  });

  useEffect(() => {
    setCurrentStep(4);
  }, [setCurrentStep]);

  const bookingPreference = form.watch("bookingPreference");

  const onSubmit = (data: Step4FormData) => {
    updateStep4(data);
    markStepComplete(4);
    setCurrentStep(5);
    router.push("/signup/domain");
  };

  const handleBack = () => {
    updateStep4(form.getValues());
    router.push("/signup/trust");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Practical Details</h1>
          <p className="text-muted-foreground mt-2">
            Help customers know when and how to reach you
          </p>
        </div>

        {/* Opening Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Opening Hours</CardTitle>
            <CardDescription>When are you available?</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="openingHours"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder={`e.g.,
Monday - Friday: 8am - 6pm
Saturday: 9am - 4pm
Sunday: Closed

Or: Available 24/7 for emergencies`}
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Leave blank if you don&apos;t want to show hours
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Business Address</CardTitle>
            <CardDescription>Optional - only if you have a physical location</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder={`e.g.,
123 High Street
Leicester
LE1 1AA`}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Leave blank if you work from home or don&apos;t want to display an address
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Booking Preference */}
        <Card>
          <CardHeader>
            <CardTitle>How should customers book/enquire?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="bookingPreference"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid gap-4"
                    >
                      {BOOKING_OPTIONS.map((option) => (
                        <div
                          key={option.value}
                          className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                            field.value === option.value
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/50"
                          }`}
                          onClick={() => field.onChange(option.value)}
                        >
                          <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                          <div>
                            <Label htmlFor={option.value} className="font-medium cursor-pointer">
                              {option.label}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {bookingPreference === "external_link" && (
              <FormField
                control={form.control}
                name="externalBookingUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking System URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://calendly.com/yourbusiness"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Link to your Calendly, Fresha, or other booking system
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
