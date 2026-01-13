import { NextResponse } from "next/server";
import { generateUniqueSlug } from "@/lib/tenant/slug";
import { createCheckoutSession, stripe } from "@/lib/stripe";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import type { OnboardingData } from "@/types/onboarding";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Rate limit check
  const clientIp = getClientIp(request.headers);
  const rateLimitResult = checkRateLimit(
    `onboarding:${clientIp}`,
    RATE_LIMITS.onboarding
  );

  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult);
  }

  // Lazy import to avoid build-time evaluation
  const { db } = await import("@/lib/db");

  try {
    const data: Partial<OnboardingData> = await request.json();

    // Validate required fields
    if (!data.step0 || !data.step1) {
      return NextResponse.json(
        { error: "Missing required onboarding data" },
        { status: 400 }
      );
    }

    // Generate unique slug
    const existingSlugs = await db.tenant.findMany({
      select: { businessSlug: true },
    });
    const businessSlug = generateUniqueSlug(
      data.step1.businessName,
      existingSlugs.map((t) => t.businessSlug)
    );

    // Create tenant with pending_payment status
    const tenant = await db.tenant.create({
      data: {
        businessName: data.step1.businessName,
        businessSlug,
        planPages: data.step0.planPages,
        status: "pending_payment",
      },
    });

    // Create subdomain record
    await db.tenantDomain.create({
      data: {
        tenantId: tenant.id,
        domain: `${businessSlug}.paygsite.co.uk`,
        domainType: "subdomain",
        isPrimary: true,
        verificationStatus: "verified",
        verifiedAt: new Date(),
      },
    });

    // Store onboarding submission
    await db.onboardingSubmission.create({
      data: {
        tenantId: tenant.id,
        rawAnswers: data as object,
      },
    });

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create Stripe Checkout session if Stripe is configured
    if (stripe) {
      const checkoutResult = await createCheckoutSession({
        tenantId: tenant.id,
        planPages: data.step0.planPages,
        customerEmail: data.step1.email,
        successUrl: `${baseUrl}/signup/success?tenant=${tenant.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/signup/domain?cancelled=true`,
      });

      if (checkoutResult?.url) {
        return NextResponse.json({
          checkoutUrl: checkoutResult.url,
          tenantId: tenant.id,
        });
      }
    }

    // Stripe not configured - skip payment for development
    // Directly set tenant to "building" and queue AI job
    console.warn("⚠️ Stripe not configured - skipping payment step");

    await db.tenant.update({
      where: { id: tenant.id },
      data: { status: "building" },
    });

    // Create subscription record without Stripe
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { PLAN_MINUTES } = await import("@/lib/stripe");

    await db.subscription.create({
      data: {
        tenantId: tenant.id,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        includedMinutesPerMonth: PLAN_MINUTES[data.step0.planPages],
      },
    });

    // Create initial minutes ledger
    await db.minutesLedger.create({
      data: {
        tenantId: tenant.id,
        periodStart: now,
        periodEnd: periodEnd,
        includedMinutes: PLAN_MINUTES[data.step0.planPages],
        usedMinutes: 0,
        purchasedMinutes: 0,
      },
    });

    // Queue AI generation job
    await db.job.create({
      data: {
        tenantId: tenant.id,
        jobType: "ai_generate_spec",
        status: "pending",
        payload: { tenantId: tenant.id, planPages: data.step0.planPages },
      },
    });

    // Redirect to success page (dev mode without payment)
    return NextResponse.json({
      checkoutUrl: `/signup/success?tenant=${tenant.id}`,
      tenantId: tenant.id,
    });
  } catch (error) {
    console.error("Onboarding submission error:", error);
    return NextResponse.json(
      { error: "Failed to process onboarding" },
      { status: 500 }
    );
  }
}
