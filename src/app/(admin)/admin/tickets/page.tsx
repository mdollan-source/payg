import Link from "next/link";
import { getDb } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Clock, Loader2, CheckCircle } from "lucide-react";
import { TicketFilters } from "@/components/admin/TicketFilters";

interface TicketsPageProps {
  searchParams: Promise<{
    status?: string;
    tenant?: string;
    category?: string;
  }>;
}

export default async function AdminTicketsPage({ searchParams }: TicketsPageProps) {
  const params = await searchParams;
  const db = getDb();

  // Build where clause
  const where: Record<string, unknown> = {};

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }

  if (params.tenant) {
    where.tenantId = params.tenant;
  }

  if (params.category && params.category !== "all") {
    where.category = params.category;
  }

  const tickets = await db.changeTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      tenant: true,
      timeLogs: true,
    },
  });

  // Get counts for stats
  const [newCount, inProgressCount, doneCount] = await Promise.all([
    db.changeTicket.count({ where: { status: "new" } }),
    db.changeTicket.count({ where: { status: "in_progress" } }),
    db.changeTicket.count({ where: { status: "done" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tickets</h1>
        <p className="text-gray-500">Manage all change requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{newCount}</p>
              <p className="text-sm text-gray-500">New</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inProgressCount}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{doneCount}</p>
              <p className="text-sm text-gray-500">Done</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TicketFilters
        currentStatus={params.status || "all"}
        currentCategory={params.category || "all"}
      />

      {/* Ticket List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tickets ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">No tickets found</p>
              {(params.status || params.category) && (
                <Button asChild variant="link" className="mt-2">
                  <Link href="/admin/tickets">Clear filters</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-gray-500">Ticket</th>
                    <th className="pb-3 font-medium text-gray-500">Tenant</th>
                    <th className="pb-3 font-medium text-gray-500">Category</th>
                    <th className="pb-3 font-medium text-gray-500">Status</th>
                    <th className="pb-3 font-medium text-gray-500">Time</th>
                    <th className="pb-3 font-medium text-gray-500">Created</th>
                    <th className="pb-3 font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tickets.map((ticket) => {
                    const totalMinutes = ticket.timeLogs.reduce((acc, log) => acc + log.minutes, 0);
                    return (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="py-4">
                          <Link href={`/admin/tickets/${ticket.id}`} className="hover:underline">
                            <p className="font-medium truncate max-w-xs">{ticket.title}</p>
                          </Link>
                        </td>
                        <td className="py-4">
                          <Link href={`/admin/tenants/${ticket.tenant.id}`} className="text-sm text-blue-600 hover:underline">
                            {ticket.tenant.businessName}
                          </Link>
                        </td>
                        <td className="py-4">
                          <span className="text-sm">{ticket.category}</span>
                        </td>
                        <td className="py-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            ticket.status === "done"
                              ? "bg-green-100 text-green-700"
                              : ticket.status === "in_progress"
                              ? "bg-blue-100 text-blue-700"
                              : ticket.status === "needs_info"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {ticket.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-4 text-sm">
                          {totalMinutes > 0 ? `${totalMinutes} min` : "-"}
                        </td>
                        <td className="py-4 text-sm text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString("en-GB")}
                        </td>
                        <td className="py-4">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/tickets/${ticket.id}`}>
                              Manage
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
