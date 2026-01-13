import Link from "next/link";
import { getUserTenant } from "@/lib/portal/get-user-tenant";
import { getDb } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Clock, Calendar, ExternalLink, AlertTriangle } from "lucide-react";
import { BillingPortalButton } from "@/components/portal/BillingPortalButton";

// Map planPages to plan details
function getPlanDetails(planPages: number) {
  switch (planPages) {
    case 1:
      return { name: "Starter (1 Page)", price: 49, key: "starter_1" };
    case 5:
      return { name: "Growth (5 Pages)", price: 79, key: "growth_5" };
    case 10:
      return { name: "Pro (10 Pages)", price: 129, key: "pro_10" };
    default:
      return { name: `Custom (${planPages} Pages)`, price: 0, key: "custom" };
  }
}

export default async function BillingPage() {
  const { tenant } = await getUserTenant();

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No website found.</p>
      </div>
    );
  }

  const db = getDb();

  // Get subscription info
  const subscription = await db.subscription.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  // Get current period's minutes balance
  const currentPeriod = await db.minutesLedger.findFirst({
    where: {
      tenantId: tenant.id,
      periodStart: { lte: new Date() },
      periodEnd: { gte: new Date() },
    },
  });

  // Calculate remaining minutes for current period
  const includedMinutes = currentPeriod?.includedMinutes || 0;
  const usedMinutes = currentPeriod?.usedMinutes || 0;
  const purchasedMinutes = currentPeriod?.purchasedMinutes || 0;
  const totalMinutes = includedMinutes + purchasedMinutes - usedMinutes;

  // Get recent periods
  const recentPeriods = await db.minutesLedger.findMany({
    where: { tenantId: tenant.id },
    orderBy: { periodStart: "desc" },
    take: 6,
  });

  const planDetails = getPlanDetails(tenant.planPages);
  const planName = planDetails.name;
  const planPrice = planDetails.price;

  const isActive = subscription?.status === "active";
  const nextBillingDate = subscription?.currentPeriodEnd;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-gray-500">Manage your plan and payment details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-2xl font-bold">{planName}</p>
              <p className="text-gray-500">£{planPrice}/month</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-yellow-500"}`} />
              <span className="text-sm">
                {isActive ? "Active" : subscription?.status || "Pending"}
              </span>
            </div>
            {nextBillingDate && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                Next billing: {new Date(nextBillingDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Minutes Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Minutes Balance
            </CardTitle>
            <CardDescription>
              Use minutes for change requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold">{totalMinutes}</p>
              <p className="text-gray-500">minutes available</p>
            </div>
            {totalMinutes < 30 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Running low on minutes. Top up to continue making change requests.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manage Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Subscription</CardTitle>
          <CardDescription>
            Update your payment method, change your plan, or view invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <BillingPortalButton />
            <Button variant="outline" asChild>
              <Link href="/portal/tickets/new?type=feature">
                Request Plan Change
              </Link>
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            You&apos;ll be redirected to our secure payment portal powered by Stripe.
          </p>
        </CardContent>
      </Card>

      {/* Minutes History */}
      <Card>
        <CardHeader>
          <CardTitle>Minutes History</CardTitle>
          <CardDescription>
            Monthly minutes allocation and usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentPeriods.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No billing periods yet</p>
          ) : (
            <div className="divide-y">
              {recentPeriods.map((period) => {
                const remaining = period.includedMinutes + period.purchasedMinutes - period.usedMinutes;
                const isCurrentPeriod = new Date() >= period.periodStart && new Date() <= period.periodEnd;
                return (
                  <div key={period.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm flex items-center gap-2">
                        {new Date(period.periodStart).toLocaleDateString("en-GB", {
                          month: "short",
                          year: "numeric",
                        })}
                        {isCurrentPeriod && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {period.usedMinutes} of {period.includedMinutes + period.purchasedMinutes} used
                      </p>
                    </div>
                    <span className={`font-medium ${remaining > 0 ? "text-green-600" : "text-gray-500"}`}>
                      {remaining} min left
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Compare plans and request an upgrade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Starter", pages: 1, price: 49, minutes: 30 },
              { name: "Growth", pages: 5, price: 79, minutes: 60 },
              { name: "Pro", pages: 10, price: 129, minutes: 120 },
            ].map((plan) => {
              const isCurrentPlan = tenant.planPages === plan.pages;
              return (
                <div
                  key={plan.pages}
                  className={`p-4 rounded-lg border-2 ${
                    isCurrentPlan
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <h3 className="font-bold">{plan.name}</h3>
                  <p className="text-2xl font-bold mt-2">£{plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600">
                    <li>• Up to {plan.pages} page{plan.pages > 1 ? "s" : ""}</li>
                    <li>• {plan.minutes} minutes/month</li>
                    <li>• SSL included</li>
                    <li>• Email support</li>
                  </ul>
                  {isCurrentPlan ? (
                    <p className="mt-4 text-sm text-blue-600 font-medium">Current Plan</p>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      asChild
                    >
                      <Link href={`/portal/tickets/new?type=feature&subject=Upgrade to ${plan.name} plan`}>
                        {planPrice < plan.price ? "Upgrade" : "Downgrade"}
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
