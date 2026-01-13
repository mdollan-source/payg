import Stripe from "stripe";

// Initialize Stripe client
// Will throw if STRIPE_SECRET_KEY is not set
function createStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || secretKey.includes("placeholder")) {
    console.warn(
      "⚠️ Stripe is not configured. Set STRIPE_SECRET_KEY in your .env file."
    );
    // Return a mock client for development without Stripe
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: "2025-12-15.clover",
    typescript: true,
  });
}

export const stripe = createStripeClient();

// Price IDs for each plan (set these in Stripe Dashboard)
export const PLAN_PRICES = {
  1: process.env.STRIPE_PRICE_1PAGE || "",
  5: process.env.STRIPE_PRICE_5PAGE || "",
  10: process.env.STRIPE_PRICE_10PAGE || "",
} as const;

// Minutes included per plan
export const PLAN_MINUTES = {
  1: 30,
  5: 60,
  10: 120,
} as const;

// Plan display names
export const PLAN_NAMES = {
  1: "PAYGSite 1 Page",
  5: "PAYGSite 5 Pages",
  10: "PAYGSite 10 Pages",
} as const;

/**
 * Create a Stripe Checkout session for a new subscription
 */
export async function createCheckoutSession({
  tenantId,
  planPages,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  tenantId: string;
  planPages: 1 | 5 | 10;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string | null; sessionId: string } | null> {
  if (!stripe) {
    console.warn("Stripe not configured, skipping checkout session creation");
    return null;
  }

  const priceId = PLAN_PRICES[planPages];

  if (!priceId || priceId.includes("placeholder")) {
    throw new Error(`Price ID not configured for ${planPages}-page plan`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: customerEmail,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tenantId,
      planPages: planPages.toString(),
    },
    subscription_data: {
      metadata: {
        tenantId,
        planPages: planPages.toString(),
      },
    },
  });

  return {
    url: session.url,
    sessionId: session.id,
  };
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}): Promise<string | null> {
  if (!stripe) {
    console.warn("Stripe not configured, skipping portal session creation");
    return null;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Verify and construct a Stripe webhook event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!stripe) {
    console.warn("Stripe not configured, skipping webhook verification");
    return null;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret.includes("placeholder")) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Retrieve a subscription by ID
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  if (!stripe) return null;
  return stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  if (!stripe) return null;
  return stripe.subscriptions.cancel(subscriptionId);
}
