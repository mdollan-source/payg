// Onboarding form types based on PRD Section 5

export type PlanPages = 1 | 5 | 10;

export type Industry =
  | "trades"
  | "professional"
  | "beauty_wellness"
  | "hospitality"
  | "retail"
  | "other";

export type ToneOfVoice =
  | "professional"
  | "friendly"
  | "premium"
  | "straight_talking"
  | "warm"
  | "bold";

export type CtaPreference =
  | "call_now"
  | "get_quote"
  | "book_now"
  | "request_callback"
  | "email_us";

export type ServiceAreaMode = "radius" | "list" | "nationwide";

export type BookingPreference = "phone_email" | "enquiry_form" | "external_link";

export interface Service {
  name: string;
  description?: string;
}

export interface Testimonial {
  name: string;
  text: string;
  location?: string;
}

export interface CaseStudy {
  title: string;
  description: string;
  imageUrl?: string;
}

// Step 0 - Plan Selection
export interface Step0Data {
  planPages: PlanPages;
  industry: Industry;
}

// Step 1 - Essentials
export interface Step1Data {
  businessName: string;
  whatDoYouDo: string;
  services: Service[];
  primaryLocation: string;
  serviceAreaMode: ServiceAreaMode;
  serviceAreaRadius?: number;
  serviceAreaList?: string[];
  phone: string;
  email: string;
  ctaPreference: CtaPreference;
  logoFile?: File | null;
  photoFiles?: File[];
}

// Step 2 - Brand
export interface Step2Data {
  toneOfVoice: ToneOfVoice;
  hasBrandColours: boolean;
  primaryColourHex?: string;
  secondaryColourHex?: string;
  designVibe?: string;
  tagline?: string;
  mustIncludePoints?: string[];
  mustAvoidWords?: string[];
}

// Step 3 - Trust Signals
export interface Step3Data {
  accreditations?: string[];
  yearsInBusiness?: number;
  testimonials?: Testimonial[];
  caseStudies?: CaseStudy[];
}

// Step 4 - Practical Details
export interface Step4Data {
  openingHours?: string;
  address?: string;
  bookingPreference: BookingPreference;
  externalBookingUrl?: string;
}

// Step 5 - Domains
export interface Step5Data {
  hasExistingDomain: boolean;
  existingDomain?: string;
  registrar?: string;
  hasDnsAccess?: boolean;
}

// Complete onboarding data
export interface OnboardingData {
  step0: Step0Data;
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5: Step5Data;
}

// Form step configuration
export const ONBOARDING_STEPS = [
  { id: 0, title: "Choose Your Plan", path: "plan" },
  { id: 1, title: "Business Essentials", path: "essentials" },
  { id: 2, title: "Brand & Style", path: "brand" },
  { id: 3, title: "Trust Signals", path: "trust" },
  { id: 4, title: "Practical Details", path: "practical" },
  { id: 5, title: "Your Domain", path: "domain" },
] as const;

export type StepPath = (typeof ONBOARDING_STEPS)[number]["path"];
