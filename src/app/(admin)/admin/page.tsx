import { getDb } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Ticket, Clock, AlertTriangle, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const db = getDb();

  // Get stats
  const [
    totalTenants,
    activeTenants,
    buildingTenants,
    failedTenants,
    openTickets,
    inProgressTickets,
    failedJobs,
    recentTenants,
    recentTickets,
  ] = await Promise.all([
    db.tenant.count(),
    db.tenant.count({ where: { status: "active" } }),
    db.tenant.count({ where: { status: "building" } }),
    db.tenant.count({ where: { status: "generation_failed" } }),
    db.changeTicket.count({ where: { status: "new" } }),
    db.changeTicket.count({ where: { status: "in_progress" } }),
    db.job.count({ where: { status: "dead" } }),
    db.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { subscription: true },
    }),
    db.changeTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { tenant: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Overview of your PAYGSite platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tenants</p>
                <p className="text-3xl font-bold">{totalTenants}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm">
              <span className="text-green-600">{activeTenants} active</span>
              <span className="text-yellow-600">{buildingTenants} building</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Open Tickets</p>
                <p className="text-3xl font-bold">{openTickets}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 text-sm">
              <span className="text-blue-600">{inProgressTickets} in progress</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Failed Builds</p>
                <p className="text-3xl font-bold">{failedTenants}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 text-sm">
              <span className="text-red-600">{failedJobs} dead jobs</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Rate</p>
                <p className="text-3xl font-bold">
                  {totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              of all tenants
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tenants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Tenants</CardTitle>
                <CardDescription>Latest signups</CardDescription>
              </div>
              <Link href="/admin/tenants" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTenants.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tenants yet</p>
            ) : (
              <div className="space-y-4">
                {recentTenants.map((tenant) => (
                  <Link
                    key={tenant.id}
                    href={`/admin/tenants/${tenant.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{tenant.businessName}</p>
                      <p className="text-sm text-gray-500">{tenant.businessSlug}.paygsite.co.uk</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      tenant.status === "active"
                        ? "bg-green-100 text-green-700"
                        : tenant.status === "building"
                        ? "bg-blue-100 text-blue-700"
                        : tenant.status === "generation_failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {tenant.status.replace("_", " ")}
                    </span>
                  </Link>
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
                <CardDescription>Latest change requests</CardDescription>
              </div>
              <Link href="/admin/tickets" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTickets.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tickets yet</p>
            ) : (
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/admin/tickets/${ticket.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{ticket.title}</p>
                      <p className="text-sm text-gray-500">{ticket.tenant.businessName}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ml-2 ${
                      ticket.status === "done"
                        ? "bg-green-100 text-green-700"
                        : ticket.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
