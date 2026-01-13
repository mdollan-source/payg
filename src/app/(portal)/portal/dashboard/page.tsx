import Link from "next/link";
import { getUserTenant, getTenantDashboardData, getMinutesUsage } from "@/lib/portal/get-user-tenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ExternalLink,
  FileText,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { PLAN_NAMES } from "@/lib/stripe";

export default async function DashboardPage() {
  const { user, tenant } = await getUserTenant();

  if (!tenant) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold mb-4">No Website Found</h1>
        <p className="text-gray-600 mb-6">
          You don&apos;t have a website yet. Get started by creating one.
        </p>
        <Button asChild>
          <Link href="/signup">Create Your Website</Link>
        </Button>
      </div>
    );
  }

  const tenantData = await getTenantDashboardData(tenant.id);
  const minutesUsage = await getMinutesUsage(tenant.id);

  if (!tenantData) {
    return <div>Error loading dashboard data</div>;
  }

  const primaryDomain = tenantData.domains.find((d) => d.isPrimary);
  const siteUrl = primaryDomain
    ? `https://${primaryDomain.domain}`
    : `https://${tenant.businessSlug}.paygsite.co.uk`;

  const minutesPercentUsed = minutesUsage.included > 0
    ? (minutesUsage.used / (minutesUsage.included + minutesUsage.purchased)) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{tenant.businessName}</h1>
          <p className="text-gray-500">
            {PLAN_NAMES[tenant.planPages as 1 | 5 | 10] || `${tenant.planPages} Page Plan`}
          </p>
        </div>
        {tenant.status === "active" && (
          <Button asChild>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Website
            </a>
          </Button>
        )}
      </div>

      {/* Status Banner */}
      {tenant.status !== "active" && (
        <Card className={
          tenant.status === "building" ? "border-blue-200 bg-blue-50" :
          tenant.status === "pending_review" ? "border-green-200 bg-green-50" :
          "border-yellow-200 bg-yellow-50"
        }>
          <CardContent className="flex items-center gap-3 py-4">
            {tenant.status === "building" ? (
              <>
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <p className="font-medium text-blue-900">Your website is being built</p>
                  <p className="text-sm text-blue-700">This usually takes a few minutes. We&apos;ll email you when it&apos;s ready.</p>
                </div>
              </>
            ) : tenant.status === "pending_review" ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Your website is ready for review</p>
                  <p className="text-sm text-green-700">We&apos;re doing a final check and will make it live shortly. You&apos;ll receive an email when it&apos;s live.</p>
                </div>
              </>
            ) : tenant.status === "payment_failed" ? (
              <>
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-900">Payment failed</p>
                  <p className="text-sm text-yellow-700">Please update your payment method to keep your site active.</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/portal/billing">Update Payment</Link>
                </Button>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="font-medium text-yellow-900">Status: {tenant.status}</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pages</CardTitle>
            <FileText className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenantData.pages.length}</div>
            <p className="text-xs text-gray-500">of {tenant.planPages} included</p>
            <Button asChild variant="link" className="px-0 mt-2">
              <Link href="/portal/pages">Manage pages</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Minutes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Change Minutes</CardTitle>
            <Clock className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{minutesUsage.remaining}</div>
            <p className="text-xs text-gray-500">minutes remaining this month</p>
            <Progress value={minutesPercentUsed} className="mt-2 h-2" />
            <p className="text-xs text-gray-400 mt-1">
              {minutesUsage.used} of {minutesUsage.included + minutesUsage.purchased} used
            </p>
          </CardContent>
        </Card>

        {/* Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Change Requests</CardTitle>
            <MessageSquare className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenantData.tickets.filter((t) => t.status === "open" || t.status === "in_progress").length}
            </div>
            <p className="text-xs text-gray-500">open requests</p>
            <Button asChild variant="link" className="px-0 mt-2">
              <Link href="/portal/tickets">View all</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Change Requests</CardTitle>
            <CardDescription>Your latest support tickets</CardDescription>
          </CardHeader>
          <CardContent>
            {tenantData.tickets.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No change requests yet</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/portal/tickets/new">Create your first request</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tenantData.tickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-start gap-3">
                    {ticket.status === "done" ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : ticket.status === "in_progress" ? (
                      <Loader2 className="w-5 h-5 text-blue-500 mt-0.5" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{ticket.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      ticket.status === "done"
                        ? "bg-green-100 text-green-700"
                        : ticket.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/portal/pages">
                <FileText className="w-4 h-4 mr-2" />
                Edit page content
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/portal/tickets/new">
                <MessageSquare className="w-4 h-4 mr-2" />
                Request a change
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview your website
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
