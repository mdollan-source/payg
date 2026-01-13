import Link from "next/link";
import { getDb } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  RefreshCw,
} from "lucide-react";
import { JobActions } from "@/components/admin/JobActions";

interface JobsPageProps {
  searchParams: Promise<{
    status?: string;
    type?: string;
  }>;
}

export default async function AdminJobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams;
  const db = getDb();

  // Build where clause
  const where: Record<string, unknown> = {};

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }

  if (params.type && params.type !== "all") {
    where.jobType = params.type;
  }

  const jobs = await db.job.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      tenant: true,
    },
  });

  // Get counts
  const [pendingCount, runningCount, completedCount, failedCount, deadCount] = await Promise.all([
    db.job.count({ where: { status: "pending" } }),
    db.job.count({ where: { status: "running" } }),
    db.job.count({ where: { status: "completed" } }),
    db.job.count({ where: { status: "failed" } }),
    db.job.count({ where: { status: "dead" } }),
  ]);

  // Get unique job types
  const jobTypes = await db.job.groupBy({
    by: ["jobType"],
    _count: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Job Queue</h1>
        <p className="text-gray-500">Monitor background jobs and retry failed tasks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-xl font-bold">{pendingCount}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Play className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xl font-bold">{runningCount}</p>
                <p className="text-xs text-gray-500">Running</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xl font-bold">{completedCount}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xl font-bold">{failedCount}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-xl font-bold">{deadCount}</p>
                <p className="text-xs text-gray-500">Dead</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          defaultValue={params.status || "all"}
          onChange={(e) => {
            const url = new URL(window.location.href);
            if (e.target.value === "all") {
              url.searchParams.delete("status");
            } else {
              url.searchParams.set("status", e.target.value);
            }
            window.location.href = url.toString();
          }}
          className="px-3 py-2 border rounded-md text-sm bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="dead">Dead</option>
        </select>

        <select
          defaultValue={params.type || "all"}
          onChange={(e) => {
            const url = new URL(window.location.href);
            if (e.target.value === "all") {
              url.searchParams.delete("type");
            } else {
              url.searchParams.set("type", e.target.value);
            }
            window.location.href = url.toString();
          }}
          className="px-3 py-2 border rounded-md text-sm bg-white"
        >
          <option value="all">All Types</option>
          {jobTypes.map((t) => (
            <option key={t.jobType} value={t.jobType}>
              {t.jobType} ({t._count})
            </option>
          ))}
        </select>
      </div>

      {/* Job List */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">No jobs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-gray-500">Type</th>
                    <th className="pb-3 font-medium text-gray-500">Tenant</th>
                    <th className="pb-3 font-medium text-gray-500">Status</th>
                    <th className="pb-3 font-medium text-gray-500">Attempts</th>
                    <th className="pb-3 font-medium text-gray-500">Created</th>
                    <th className="pb-3 font-medium text-gray-500">Error</th>
                    <th className="pb-3 font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="py-4">
                        <span className="font-mono text-sm">{job.jobType}</span>
                      </td>
                      <td className="py-4">
                        {job.tenant ? (
                          <Link
                            href={`/admin/tenants/${job.tenant.id}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {job.tenant.businessName}
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          job.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : job.status === "running"
                            ? "bg-blue-100 text-blue-700"
                            : job.status === "failed"
                            ? "bg-orange-100 text-orange-700"
                            : job.status === "dead"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm">{job.attempts}</td>
                      <td className="py-4 text-sm text-gray-500">
                        {new Date(job.createdAt).toLocaleString("en-GB")}
                      </td>
                      <td className="py-4">
                        {job.lastError && (
                          <span className="text-xs text-red-600 truncate max-w-xs block" title={job.lastError}>
                            {job.lastError.slice(0, 50)}...
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <JobActions job={job} />
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
