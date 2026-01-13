import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { createPortalSession } from "@/lib/stripe";

export async function POST() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  // Find the user's tenant
  const tenantUser = await db.tenantUser.findFirst({
    where: { email: session.user.email },
    include: { tenant: true },
  });

  if (!tenantUser) {
    return NextResponse.json({ error: "No tenant found" }, { status: 404 });
  }

  // stripeCustomerId is on the Tenant model
  if (!tenantUser.tenant.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer found" },
      { status: 404 }
    );
  }

  try {
    // Create Stripe Customer Portal session
    const url = await createPortalSession({
      customerId: tenantUser.tenant.stripeCustomerId,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/billing`,
    });

    if (!url) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 503 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
