import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserTenant } from "@/lib/portal/get-user-tenant";
import { getDb } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const STATUS_CONFIG = {
  new: {
    label: "New",
    description: "We've received your request and will review it soon.",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  in_progress: {
    label: "In Progress",
    description: "We're actively working on your request.",
    icon: Loader2,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  needs_info: {
    label: "Needs Info",
    description: "We need more information to proceed.",
    icon: AlertCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  done: {
    label: "Done",
    description: "Your request has been completed.",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  cancelled: {
    label: "Cancelled",
    description: "This request has been cancelled.",
    icon: AlertCircle,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  content: "Content Change",
  seo: "SEO Update",
  design: "Design Change",
  new_page: "New Page",
  other: "Other",
};

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const { tenant } = await getUserTenant();

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No website found.</p>
      </div>
    );
  }

  const db = getDb();
  const ticket = await db.changeTicket.findFirst({
    where: {
      id: ticketId,
      tenantId: tenant.id,
    },
  });

  if (!ticket) {
    notFound();
  }

  const status = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.new;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/portal/tickets">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Link>
        </Button>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-lg ${status.bgColor}`}>
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-6 h-6 ${status.color}`} />
          <div>
            <p className={`font-medium ${status.color}`}>{status.label}</p>
            <p className="text-sm text-gray-600">{status.description}</p>
          </div>
        </div>
      </div>

      {/* Ticket Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{ticket.title}</CardTitle>
              <CardDescription>
                {CATEGORY_LABELS[ticket.category] || ticket.category} •{" "}
                Created {new Date(ticket.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </CardDescription>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${
              ticket.status === "done"
                ? "bg-green-100 text-green-700"
                : ticket.status === "in_progress"
                ? "bg-blue-100 text-blue-700"
                : ticket.status === "cancelled"
                ? "bg-gray-100 text-gray-700"
                : ticket.status === "needs_info"
                ? "bg-orange-100 text-orange-700"
                : "bg-yellow-100 text-yellow-700"
            }`}>
              {ticket.status.replace("_", " ")}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-gray-700">{ticket.description}</p>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Created event */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Request submitted</p>
                <p className="text-xs text-gray-500">
                  {new Date(ticket.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Status change events would go here - for now just show current status if changed */}
            {ticket.status !== "new" && (
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full ${status.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <StatusIcon className={`w-4 h-4 ${status.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">Status changed to {status.label}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(ticket.updatedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      {(ticket.status === "new" || ticket.status === "needs_info") && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-600">
              Need to add more details?{" "}
              <a href="mailto:support@paygsite.co.uk" className="text-blue-600 hover:underline">
                Contact us
              </a>{" "}
              and reference ticket #{ticket.id.slice(0, 8)}.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
