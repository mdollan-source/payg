import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Clock, Calendar } from "lucide-react";
import { TicketStatusForm } from "@/components/admin/TicketStatusForm";
import { TimeLogForm } from "@/components/admin/TimeLogForm";

interface TicketDetailPageProps {
  params: Promise<{ ticketId: string }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  content: "Content Change",
  seo: "SEO Update",
  design: "Design Change",
  new_page: "New Page",
  other: "Other",
};

export default async function AdminTicketDetailPage({ params }: TicketDetailPageProps) {
  const { ticketId } = await params;
  const db = getDb();

  const ticket = await db.changeTicket.findUnique({
    where: { id: ticketId },
    include: {
      tenant: true,
      timeLogs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  const totalMinutes = ticket.timeLogs.reduce((acc, log) => acc + log.minutes, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/tickets">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ticket.title}</h1>
            <p className="text-gray-500">
              {CATEGORY_LABELS[ticket.category] || ticket.category} ticket
            </p>
          </div>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full ${
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
              <CardDescription>Change the ticket status</CardDescription>
            </CardHeader>
            <CardContent>
              <TicketStatusForm ticketId={ticket.id} currentStatus={ticket.status} />
            </CardContent>
          </Card>

          {/* Time Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Time Logs</CardTitle>
              <CardDescription>
                Total: {totalMinutes} minutes ({Math.round(totalMinutes / 60 * 10) / 10} hours)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TimeLogForm ticketId={ticket.id} tenantId={ticket.tenantId} />

              {ticket.timeLogs.length > 0 && (
                <div className="border-t pt-4 space-y-3">
                  {ticket.timeLogs.map((log) => (
                    <div key={log.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm">{log.note || "Work performed"}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleString("en-GB")}
                        </p>
                      </div>
                      <span className="font-medium text-sm">{log.minutes} min</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tenant Info */}
          <Card>
            <CardHeader>
              <CardTitle>Tenant</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/admin/tenants/${ticket.tenant.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
              >
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">{ticket.tenant.businessName}</p>
                  <p className="text-sm text-gray-500">{ticket.tenant.businessSlug}.paygsite.co.uk</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">
                    {new Date(ticket.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">
                    {new Date(ticket.updatedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <p className="font-medium capitalize">{ticket.priority}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
