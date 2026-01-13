import Link from "next/link";
import { getDb } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ExternalLink, Search } from "lucide-react";
import { TenantFilters } from "@/components/admin/TenantFilters";

interface TenantsPageProps {
  searchParams: Promise<{
    status?: string;
    plan?: string;
    search?: string;
  }>;
}

export default async function TenantsPage({ searchParams }: TenantsPageProps) {
  const params = await searchParams;
  const db = getDb();

  // Build where clause based on filters
  const where: Record<string, unknown> = {};

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }

  if (params.plan && params.plan !== "all") {
    where.planPages = parseInt(params.plan);
  }

  if (params.search) {
    where.OR = [
      { businessName: { contains: params.search, mode: "insensitive" } },
      { businessSlug: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const tenants = await db.tenant.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      subscription: true,
      _count: {
        select: {
          pages: true,
          tickets: true,
        },
      },
    },
  });

  // Get counts for filter badges
  const statusCounts = await db.tenant.groupBy({
    by: ["status"],
    _count: true,
  });

  const planCounts = await db.tenant.groupBy({
    by: ["planPages"],
    _count: true,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          <p className="text-gray-500">Manage all customer websites</p>
        </div>
      </div>

      {/* Filters */}
      <TenantFilters
        currentStatus={params.status || "all"}
        currentPlan={params.plan || "all"}
        currentSearch={params.search || ""}
        statusCounts={statusCounts.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {} as Record<string, number>)}
        planCounts={planCounts.reduce((acc, p) => ({ ...acc, [p.planPages]: p._count }), {} as Record<number, number>)}
      />

      {/* Tenant List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tenants ({tenants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">No tenants found</p>
              {(params.status || params.plan || params.search) && (
                <Button asChild variant="link" className="mt-2">
                  <Link href="/admin/tenants">Clear filters</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-gray-500">Business</th>
                    <th className="pb-3 font-medium text-gray-500">Plan</th>
                    <th className="pb-3 font-medium text-gray-500">Status</th>
                    <th className="pb-3 font-medium text-gray-500">Pages</th>
                    <th className="pb-3 font-medium text-gray-500">Tickets</th>
                    <th className="pb-3 font-medium text-gray-500">Created</th>
                    <th className="pb-3 font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="py-4">
                        <Link href={`/admin/tenants/${tenant.id}`} className="hover:underline">
                          <p className="font-medium">{tenant.businessName}</p>
                          <p className="text-sm text-gray-500">{tenant.businessSlug}.paygsite.co.uk</p>
                        </Link>
                      </td>
                      <td className="py-4">
                        <span className="text-sm">{tenant.planPages} page{tenant.planPages > 1 ? "s" : ""}</span>
                      </td>
                      <td className="py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          tenant.status === "active"
                            ? "bg-green-100 text-green-700"
                            : tenant.status === "building"
                            ? "bg-blue-100 text-blue-700"
                            : tenant.status === "generation_failed"
                            ? "bg-red-100 text-red-700"
                            : tenant.status === "pending_payment"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {tenant.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-4 text-sm">{tenant._count.pages}</td>
                      <td className="py-4 text-sm">{tenant._count.tickets}</td>
                      <td className="py-4 text-sm text-gray-500">
                        {new Date(tenant.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/tenants/${tenant.id}`}>
                              View
                            </Link>
                          </Button>
                          {tenant.status === "active" && (
                            <Button asChild variant="ghost" size="sm">
                              <a
                                href={`https://${tenant.businessSlug}.paygsite.co.uk`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
