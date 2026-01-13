import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { cancelSubscription } from "@/lib/stripe";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await auth();

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: { subscription: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Cancel Stripe subscription if exists
  if (tenant.stripeSubscriptionId) {
    try {
      await cancelSubscription(tenant.stripeSubscriptionId);
    } catch (error) {
      console.error("Failed to cancel Stripe subscription:", error);
      // Continue anyway - might already be cancelled
    }
  }

  // Update tenant status
  await db.tenant.update({
    where: { id: tenantId },
    data: { status: "cancelled" },
  });

  // Update subscription status if exists
  if (tenant.subscription) {
    await db.subscription.update({
      where: { id: tenant.subscription.id },
      data: { status: "cancelled" },
    });
  }

  return NextResponse.json({ success: true });
}
