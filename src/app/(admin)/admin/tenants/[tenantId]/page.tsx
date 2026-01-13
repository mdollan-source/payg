import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ExternalLink,
  Building2,
  Mail,
  Calendar,
  CreditCard,
  Clock,
  FileText,
  RefreshCw,
} from "lucide-react";
import { TenantActions } from "@/components/admin/TenantActions";

interface TenantDetailPageProps {
  params: Promise<{ tenantId: string }>;
}

export default async function TenantDetailPage({ params }: TenantDetailPageProps) {
  const { tenantId } = await params;
  const db = getDb();

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: {
      subscription: true,
      siteSettings: true,
      domains: true,
      pages: { orderBy: { sortOrder: "asc" } },
      tickets: { orderBy: { createdAt: "desc" }, take: 5 },
      users: true,
      onboarding: true,
      minutesLedger: { orderBy: { periodStart: "desc" }, take: 3 },
      buildSpecs: { orderBy: { createdAt: "desc" }, take: 1 },
      jobs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!tenant) {
    notFound();
  }

  const primaryDomain = tenant.domains.find((d) => d.isPrimary);
  const currentMinutes = tenant.minutesLedger[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/tenants">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{tenant.businessName}</h1>
            <p className="text-gray-500">{tenant.businessSlug}.paygsite.co.uk</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm px-3 py-1 rounded-full ${
            tenant.status === "active"
              ? "bg-green-100 text-green-700"
              : tenant.status === "building"
              ? "bg-blue-100 text-blue-700"
              : tenant.status === "generation_failed"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700"
          }`}>
            {tenant.status.replace(/_/g, " ")}
          </span>
          {tenant.status === "active" && (
            <Button asChild variant="outline" size="sm">
              <a
                href={`https://${tenant.businessSlug}.paygsite.co.uk`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Site
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Actions Card */}
      <TenantActions tenant={tenant} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Plan</p>
                  <p className="font-medium">{tenant.planPages} page{tenant.planPages > 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">
                    {new Date(tenant.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Subscription</p>
                  <p className="font-medium">
                    {tenant.subscription?.status || "None"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Minutes</p>
                  <p className="font-medium">
                    {currentMinutes
                      ? `${currentMinutes.includedMinutes + currentMinutes.purchasedMinutes - currentMinutes.usedMinutes} remaining`
                      : "No allocation"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users */}
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Portal access</CardDescription>
            </CardHeader>
            <CardContent>
              {tenant.users.length === 0 ? (
                <p className="text-gray-500 text-sm">No users</p>
              ) : (
                <div className="space-y-3">
                  {tenant.users.map((user) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium">{user.name || user.email}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Pages ({tenant.pages.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {tenant.pages.length === 0 ? (
                <p className="text-gray-500 text-sm">No pages generated</p>
              ) : (
                <div className="space-y-2">
                  {tenant.pages.map((page) => (
                    <div key={page.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{page.title}</p>
                        <p className="text-sm text-gray-500">/{page.slug}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        page.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {page.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Tickets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Tickets</CardTitle>
                  <CardDescription>Change requests</CardDescription>
                </div>
                <Link href={`/admin/tickets?tenant=${tenant.id}`} className="text-sm text-blue-600 hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {tenant.tickets.length === 0 ? (
                <p className="text-gray-500 text-sm">No tickets</p>
              ) : (
                <div className="space-y-3">
                  {tenant.tickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/admin/tickets/${ticket.id}`}
                      className="block p-2 rounded hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{ticket.title}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          ticket.status === "done"
                            ? "bg-green-100 text-green-700"
                            : ticket.status === "in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {ticket.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(ticket.createdAt).toLocaleDateString("en-GB")}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Domains */}
          <Card>
            <CardHeader>
              <CardTitle>Domains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tenant.domains.map((domain) => (
                  <div key={domain.id} className="p-2 bg-gray-50 rounded">
                    <p className="font-medium text-sm">{domain.domain}</p>
                    <p className="text-xs text-gray-500">
                      {domain.domainType === "subdomain" ? "Subdomain" : "Custom"}
                      {domain.isPrimary && " (primary)"}
                      {domain.domainType === "custom" && (
                        <> - {domain.verificationStatus}</>
                      )}
                    </p>
                  </div>
                ))}
                {tenant.domains.length === 0 && (
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="font-medium text-sm">{tenant.businessSlug}.paygsite.co.uk</p>
                    <p className="text-xs text-gray-500">Subdomain (default)</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {tenant.jobs.length === 0 ? (
                <p className="text-gray-500 text-sm">No jobs</p>
              ) : (
                <div className="space-y-2">
                  {tenant.jobs.map((job) => (
                    <div key={job.id} className="p-2 rounded bg-gray-50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{job.jobType}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          job.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : job.status === "failed" || job.status === "dead"
                            ? "bg-red-100 text-red-700"
                            : job.status === "running"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(job.createdAt).toLocaleString("en-GB")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stripe Info */}
          {tenant.stripeCustomerId && (
            <Card>
              <CardHeader>
                <CardTitle>Stripe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-500">Customer ID</p>
                  <p className="font-mono text-xs">{tenant.stripeCustomerId}</p>
                </div>
                {tenant.stripeSubscriptionId && (
                  <div>
                    <p className="text-gray-500">Subscription ID</p>
                    <p className="font-mono text-xs">{tenant.stripeSubscriptionId}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
