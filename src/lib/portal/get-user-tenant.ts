import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { redirect } from "next/navigation";

/**
 * Get the current user's tenant
 * Redirects to login if not authenticated
 * Returns null if user has no tenant
 */
export async function getUserTenant() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const db = getDb();

  // Find the user's tenant
  const tenantUser = await db.tenantUser.findFirst({
    where: { email: session.user.email },
    include: {
      tenant: {
        include: {
          siteSettings: true,
          subscription: true,
          domains: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
  });

  return {
    user: session.user,
    tenant: tenantUser?.tenant || null,
    tenantUser: tenantUser || null,
  };
}

/**
 * Get tenant with full data for dashboard
 */
export async function getTenantDashboardData(tenantId: string) {
  const db = getDb();

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: {
      siteSettings: true,
      subscription: true,
      domains: true,
      pages: {
        where: { status: "published" },
        orderBy: { sortOrder: "asc" },
      },
      tickets: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      minutesLedger: {
        orderBy: { periodStart: "desc" },
        take: 1,
      },
    },
  });

  return tenant;
}

/**
 * Get minutes usage for current period
 */
export async function getMinutesUsage(tenantId: string) {
  const db = getDb();

  const ledger = await db.minutesLedger.findFirst({
    where: { tenantId },
    orderBy: { periodStart: "desc" },
  });

  if (!ledger) {
    return {
      included: 0,
      used: 0,
      purchased: 0,
      remaining: 0,
      periodEnd: null,
    };
  }

  const remaining = ledger.includedMinutes + ledger.purchasedMinutes - ledger.usedMinutes;

  return {
    included: ledger.includedMinutes,
    used: ledger.usedMinutes,
    purchased: ledger.purchasedMinutes,
    remaining: Math.max(0, remaining),
    periodEnd: ledger.periodEnd,
  };
}
