import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { createJob } from "@/lib/jobs/queue";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await auth();

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Update tenant status to building
  await db.tenant.update({
    where: { id: tenantId },
    data: { status: "building" },
  });

  // Create a new build job
  await createJob(db, {
    jobType: "ai_generate_spec",
    tenantId,
    payload: { tenantId, rebuild: true },
  });

  return NextResponse.json({ success: true });
}
