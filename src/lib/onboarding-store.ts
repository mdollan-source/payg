"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Step0Data,
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  Step5Data,
  OnboardingData,
} from "@/types/onboarding";

// Default values for each step
const defaultStep0: Step0Data = {
  planPages: 5,
  industry: "trades",
};

const defaultStep1: Partial<Step1Data> = {
  businessName: "",
  whatDoYouDo: "",
  services: [{ name: "" }],
  primaryLocation: "",
  serviceAreaMode: "radius",
  serviceAreaRadius: 25,
  phone: "",
  email: "",
  ctaPreference: "get_quote",
};

const defaultStep2: Partial<Step2Data> = {
  toneOfVoice: "professional",
  hasBrandColours: false,
  primaryColourHex: "",
  secondaryColourHex: "",
  designVibe: "",
  tagline: "",
  mustIncludePoints: [],
  mustAvoidWords: [],
};

const defaultStep3: Partial<Step3Data> = {
  accreditations: [],
  yearsInBusiness: undefined,
  testimonials: [],
  caseStudies: [],
};

const defaultStep4: Partial<Step4Data> = {
  openingHours: "",
  address: "",
  bookingPreference: "enquiry_form",
  externalBookingUrl: "",
};

const defaultStep5: Partial<Step5Data> = {
  hasExistingDomain: false,
  existingDomain: "",
  registrar: "",
  hasDnsAccess: undefined,
};

interface OnboardingStore {
  // Current step
  currentStep: number;
  setCurrentStep: (step: number) => void;

  // Step data
  step0: Step0Data;
  step1: Partial<Step1Data>;
  step2: Partial<Step2Data>;
  step3: Partial<Step3Data>;
  step4: Partial<Step4Data>;
  step5: Partial<Step5Data>;

  // Update functions
  updateStep0: (data: Partial<Step0Data>) => void;
  updateStep1: (data: Partial<Step1Data>) => void;
  updateStep2: (data: Partial<Step2Data>) => void;
  updateStep3: (data: Partial<Step3Data>) => void;
  updateStep4: (data: Partial<Step4Data>) => void;
  updateStep5: (data: Partial<Step5Data>) => void;

  // Completed steps tracking
  completedSteps: number[];
  markStepComplete: (step: number) => void;

  // Get all data for submission
  getAllData: () => Partial<OnboardingData>;

  // Reset form
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      setCurrentStep: (step) => set({ currentStep: step }),

      step0: defaultStep0,
      step1: defaultStep1,
      step2: defaultStep2,
      step3: defaultStep3,
      step4: defaultStep4,
      step5: defaultStep5,

      updateStep0: (data) =>
        set((state) => ({ step0: { ...state.step0, ...data } })),
      updateStep1: (data) =>
        set((state) => ({ step1: { ...state.step1, ...data } })),
      updateStep2: (data) =>
        set((state) => ({ step2: { ...state.step2, ...data } })),
      updateStep3: (data) =>
        set((state) => ({ step3: { ...state.step3, ...data } })),
      updateStep4: (data) =>
        set((state) => ({ step4: { ...state.step4, ...data } })),
      updateStep5: (data) =>
        set((state) => ({ step5: { ...state.step5, ...data } })),

      completedSteps: [],
      markStepComplete: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
        })),

      getAllData: () => {
        const state = get();
        return {
          step0: state.step0,
          step1: state.step1 as Step1Data,
          step2: state.step2 as Step2Data,
          step3: state.step3 as Step3Data,
          step4: state.step4 as Step4Data,
          step5: state.step5 as Step5Data,
        };
      },

      reset: () =>
        set({
          currentStep: 0,
          step0: defaultStep0,
          step1: defaultStep1,
          step2: defaultStep2,
          step3: defaultStep3,
          step4: defaultStep4,
          step5: defaultStep5,
          completedSteps: [],
        }),
    }),
    {
      name: "paygsite-onboarding",
      // Only persist specific fields
      partialize: (state) => ({
        currentStep: state.currentStep,
        step0: state.step0,
        step1: state.step1,
        step2: state.step2,
        step3: state.step3,
        step4: state.step4,
        step5: state.step5,
        completedSteps: state.completedSteps,
      }),
    }
  )
);
