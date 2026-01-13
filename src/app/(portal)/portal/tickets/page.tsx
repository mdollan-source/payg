import Link from "next/link";
import { getUserTenant } from "@/lib/portal/get-user-tenant";
import { getDb } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, CheckCircle, Loader2, Plus } from "lucide-react";

export default async function TicketsPage() {
  const { tenant } = await getUserTenant();

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No website found.</p>
      </div>
    );
  }

  const db = getDb();
  const tickets = await db.changeTicket.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  const newTickets = tickets.filter((t) => t.status === "new" || t.status === "needs_info");
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress");
  const doneTickets = tickets.filter((t) => t.status === "done");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Change Requests</h1>
          <p className="text-gray-500">Request changes to your website</p>
        </div>
        <Button asChild>
          <Link href="/portal/tickets/new">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{newTickets.length}</p>
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
              <p className="text-2xl font-bold">{inProgressTickets.length}</p>
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
              <p className="text-2xl font-bold">{doneTickets.length}</p>
              <p className="text-sm text-gray-500">Done</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>
            Your change requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-4">No change requests yet</p>
              <p className="text-sm text-gray-500 mb-6">
                Submit a request when you need changes to your website that
                can&apos;t be made through self-service editing.
              </p>
              <Button asChild>
                <Link href="/portal/tickets/new">Create Your First Request</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/portal/tickets/${ticket.id}`}
                  className="flex items-start gap-4 py-4 hover:bg-gray-50 -mx-4 px-4 first:pt-0 last:pb-0"
                >
                  <div className="mt-1">
                    {ticket.status === "done" ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : ticket.status === "in_progress" ? (
                      <Loader2 className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{ticket.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        ticket.status === "done"
                          ? "bg-green-100 text-green-700"
                          : ticket.status === "in_progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {ticket.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
