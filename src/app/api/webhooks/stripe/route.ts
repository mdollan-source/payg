import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { constructWebhookEvent, PLAN_MINUTES } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Disable body parsing - we need raw body for signature verification
export const runtime = "nodejs";

export async function POST(request: Request) {
  // Lazy import to avoid build-time evaluation
  const { db } = await import("@/lib/db");

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event | null;

  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  if (!event) {
    // Stripe not configured
    return NextResponse.json({ received: true, skipped: true });
  }

  // Log event for debugging
  try {
    await db.stripeEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        payload: event as unknown as object,
      },
    });
  } catch (err) {
    // Event might already exist (idempotency)
    console.log("Event already processed or error logging:", event.id);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, db);
        break;
      }

      case "invoice.paid": {
        await handleInvoicePaid(event.data.object as Stripe.Invoice, db);
        break;
      }

      case "invoice.payment_failed": {
        await handlePaymentFailed(event.data.object as Stripe.Invoice, db);
        break;
      }

      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, db);
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, db);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await db.stripeEvent.update({
      where: { stripeEventId: event.id },
      data: { processedAt: new Date() },
    });
  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err);

    // Log error to event
    await db.stripeEvent.update({
      where: { stripeEventId: event.id },
      data: { error: String(err) },
    });

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

/**
 * Handle checkout.session.completed
 * - Activate tenant
 * - Store Stripe IDs
 * - Create subscription record
 * - Queue AI generation job
 * - Send welcome email with portal access
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  db: Awaited<ReturnType<typeof import("@/lib/db").getDb>>
) {
  const tenantId = session.metadata?.tenantId;
  const planPages = parseInt(session.metadata?.planPages || "5") as 1 | 5 | 10;

  if (!tenantId) {
    throw new Error("Missing tenantId in session metadata");
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Update tenant with Stripe IDs and set status to building
  await db.tenant.update({
    where: { id: tenantId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: "building",
    },
  });

  // Create subscription record
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await db.subscription.create({
    data: {
      tenantId,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      includedMinutesPerMonth: PLAN_MINUTES[planPages],
    },
  });

  // Create initial minutes ledger entry
  await db.minutesLedger.create({
    data: {
      tenantId,
      periodStart: now,
      periodEnd: periodEnd,
      includedMinutes: PLAN_MINUTES[planPages],
      usedMinutes: 0,
      purchasedMinutes: 0,
    },
  });

  // Queue AI generation job
  await db.job.create({
    data: {
      tenantId,
      jobType: "ai_generate_spec",
      status: "pending",
      payload: { tenantId, planPages },
    },
  });

  // Queue welcome email with portal access
  await db.job.create({
    data: {
      tenantId,
      jobType: "send_email",
      status: "pending",
      payload: {
        template: "welcome",
        tenantId,
        customerEmail: session.customer_email,
      },
    },
  });

  console.log(`Tenant ${tenantId} activated, AI generation job queued`);
}

/**
 * Handle invoice.paid
 * - Reset monthly minutes on subscription renewal
 */
async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  db: Awaited<ReturnType<typeof import("@/lib/db").getDb>>
) {
  // Extract subscription ID - handle both expanded and ID-only cases
  const subscriptionId =
    typeof invoice.parent?.subscription_details?.subscription === "string"
      ? invoice.parent.subscription_details.subscription
      : invoice.parent?.subscription_details?.subscription?.id;

  if (!subscriptionId) return;

  // Find tenant by subscription ID
  const tenant = await db.tenant.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    include: { subscription: true },
  });

  if (!tenant || !tenant.subscription) return;

  // Create new minutes ledger for this period
  const periodStart = new Date(invoice.period_start * 1000);
  const periodEnd = new Date(invoice.period_end * 1000);

  await db.minutesLedger.upsert({
    where: {
      tenantId_periodStart: {
        tenantId: tenant.id,
        periodStart,
      },
    },
    create: {
      tenantId: tenant.id,
      periodStart,
      periodEnd,
      includedMinutes: tenant.subscription.includedMinutesPerMonth,
      usedMinutes: 0,
      purchasedMinutes: 0,
    },
    update: {
      // Just update if already exists
      periodEnd,
    },
  });

  // Update subscription period
  await db.subscription.update({
    where: { tenantId: tenant.id },
    data: {
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
  });

  console.log(`Minutes ledger reset for tenant ${tenant.id}`);
}

/**
 * Handle invoice.payment_failed
 * - Mark tenant as payment_failed
 * - Queue email notification
 */
async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  db: Awaited<ReturnType<typeof import("@/lib/db").getDb>>
) {
  // Extract subscription ID - handle both expanded and ID-only cases
  const subscriptionId =
    typeof invoice.parent?.subscription_details?.subscription === "string"
      ? invoice.parent.subscription_details.subscription
      : invoice.parent?.subscription_details?.subscription?.id;

  if (!subscriptionId) return;

  const tenant = await db.tenant.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!tenant) return;

  // Update tenant status
  await db.tenant.update({
    where: { id: tenant.id },
    data: { status: "payment_failed" },
  });

  // Queue email notification
  await db.job.create({
    data: {
      tenantId: tenant.id,
      jobType: "send_email",
      status: "pending",
      payload: {
        template: "payment_failed",
        tenantId: tenant.id,
      },
    },
  });

  console.log(`Payment failed for tenant ${tenant.id}`);
}

/**
 * Handle customer.subscription.updated
 * - Sync plan changes (upgrade/downgrade)
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  db: Awaited<ReturnType<typeof import("@/lib/db").getDb>>
) {
  const tenant = await db.tenant.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!tenant) return;

  // Get plan from subscription metadata
  const planPages = parseInt(subscription.metadata?.planPages || "5") as 1 | 5 | 10;

  // Update tenant plan if changed
  if (tenant.planPages !== planPages) {
    await db.tenant.update({
      where: { id: tenant.id },
      data: { planPages },
    });

    // Update subscription minutes
    await db.subscription.update({
      where: { tenantId: tenant.id },
      data: {
        includedMinutesPerMonth: PLAN_MINUTES[planPages],
      },
    });

    console.log(`Tenant ${tenant.id} plan updated to ${planPages} pages`);
  }

  // Update subscription status
  const status = subscription.status === "active" ? "active" : "past_due";
  await db.subscription.update({
    where: { tenantId: tenant.id },
    data: { status },
  });
}

/**
 * Handle customer.subscription.deleted
 * - Mark tenant as cancelled
 * - Schedule site archival
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  db: Awaited<ReturnType<typeof import("@/lib/db").getDb>>
) {
  const tenant = await db.tenant.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!tenant) return;

  // Update tenant and subscription status
  await db.tenant.update({
    where: { id: tenant.id },
    data: { status: "cancelled" },
  });

  await db.subscription.update({
    where: { tenantId: tenant.id },
    data: { status: "cancelled" },
  });

  // Queue cancellation email
  await db.job.create({
    data: {
      tenantId: tenant.id,
      jobType: "send_email",
      status: "pending",
      payload: {
        template: "subscription_cancelled",
        tenantId: tenant.id,
      },
    },
  });

  console.log(`Subscription cancelled for tenant ${tenant.id}`);
}
