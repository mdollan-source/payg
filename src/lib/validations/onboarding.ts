import { z } from "zod";

// Step 0 - Plan Selection
export const step0Schema = z.object({
  planPages: z.union([z.literal(1), z.literal(5), z.literal(10)]),
  industry: z.enum([
    "trades",
    "professional",
    "beauty_wellness",
    "hospitality",
    "retail",
    "other",
  ]),
});

// Step 1 - Essentials
export const step1Schema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be less than 100 characters"),
  whatDoYouDo: z
    .string()
    .min(10, "Please provide a bit more detail")
    .max(200, "Keep it to one sentence (200 characters max)"),
  services: z
    .array(
      z.object({
        name: z.string().min(1, "Service name is required"),
        description: z.string().optional(),
      })
    )
    .min(1, "Add at least one service")
    .max(10, "Maximum 10 services"),
  primaryLocation: z
    .string()
    .min(2, "Please enter your primary location"),
  serviceAreaMode: z.enum(["radius", "list", "nationwide"]),
  serviceAreaRadius: z.number().min(1).max(100).optional(),
  serviceAreaList: z.array(z.string()).optional(),
  phone: z
    .string()
    .min(10, "Please enter a valid phone number")
    .max(20),
  email: z.string().email("Please enter a valid email address"),
  ctaPreference: z.enum([
    "call_now",
    "get_quote",
    "book_now",
    "request_callback",
    "email_us",
  ]),
});

// Step 2 - Brand
export const step2Schema = z.object({
  toneOfVoice: z.enum([
    "professional",
    "friendly",
    "premium",
    "straight_talking",
    "warm",
    "bold",
  ]),
  hasBrandColours: z.boolean(),
  primaryColourHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Please enter a valid hex colour")
    .optional()
    .or(z.literal("")),
  secondaryColourHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Please enter a valid hex colour")
    .optional()
    .or(z.literal("")),
  designVibe: z.string().optional(),
  tagline: z.string().max(100, "Tagline must be less than 100 characters").optional(),
  mustIncludePoints: z.array(z.string()).optional(),
  mustAvoidWords: z.array(z.string()).optional(),
});

// Step 3 - Trust Signals
export const step3Schema = z.object({
  accreditations: z.array(z.string()).optional(),
  yearsInBusiness: z.number().min(0).max(200).optional(),
  testimonials: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        text: z.string().min(10, "Testimonial must be at least 10 characters"),
        location: z.string().optional(),
      })
    )
    .max(5, "Maximum 5 testimonials")
    .optional(),
  caseStudies: z
    .array(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().min(10, "Description must be at least 10 characters"),
        imageUrl: z.string().optional(),
      })
    )
    .max(6, "Maximum 6 case studies")
    .optional(),
});

// Step 4 - Practical Details
export const step4Schema = z.object({
  openingHours: z.string().optional(),
  address: z.string().optional(),
  bookingPreference: z.enum(["phone_email", "enquiry_form", "external_link"]),
  externalBookingUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

// Step 5 - Domains
export const step5Schema = z.object({
  hasExistingDomain: z.boolean(),
  existingDomain: z
    .string()
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
      "Please enter a valid domain (e.g., example.co.uk)"
    )
    .optional()
    .or(z.literal("")),
  registrar: z.string().optional(),
  hasDnsAccess: z.boolean().optional(),
});

// Combined schema for all steps
export const onboardingSchema = z.object({
  step0: step0Schema,
  step1: step1Schema,
  step2: step2Schema,
  step3: step3Schema,
  step4: step4Schema,
  step5: step5Schema,
});

export type Step0FormData = z.infer<typeof step0Schema>;
export type Step1FormData = z.infer<typeof step1Schema>;
export type Step2FormData = z.infer<typeof step2Schema>;
export type Step3FormData = z.infer<typeof step3Schema>;
export type Step4FormData = z.infer<typeof step4Schema>;
export type Step5FormData = z.infer<typeof step5Schema>;
export type OnboardingFormData = z.infer<typeof onboardingSchema>;
