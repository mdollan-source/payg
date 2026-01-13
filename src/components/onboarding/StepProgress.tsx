"use client";

import { useOnboardingStore } from "@/lib/onboarding-store";
import { ONBOARDING_STEPS } from "@/types/onboarding";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function StepProgress() {
  const { currentStep, completedSteps } = useOnboardingStore();

  return (
    <div className="w-full">
      {/* Desktop: Horizontal progress */}
      <div className="hidden md:flex items-center justify-between">
        {ONBOARDING_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isUpcoming = step.id > currentStep && !isCompleted;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary text-primary bg-primary/10",
                    isUpcoming && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id + 1
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs text-center max-w-[80px]",
                    isCurrent && "font-medium text-foreground",
                    !isCurrent && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < ONBOARDING_STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 mt-[-20px]",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Simple progress indicator */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {ONBOARDING_STEPS[currentStep]?.title}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
