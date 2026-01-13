import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const session = await auth();

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  const job = await db.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "failed" && job.status !== "dead") {
    return NextResponse.json(
      { error: "Can only retry failed or dead jobs" },
      { status: 400 }
    );
  }

  // Reset job for retry
  await db.job.update({
    where: { id: jobId },
    data: {
      status: "pending",
      attempts: 0,
      lastError: null,
      runAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
