import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const session = await auth();

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenantId } = await params;
  const db = getDb();

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  if (tenant.status !== "pending_review") {
    return NextResponse.json(
      { error: "Tenant is not pending review" },
      { status: 400 }
    );
  }

  // Approve the tenant - set status to active
  await db.tenant.update({
    where: { id: tenantId },
    data: { status: "active" },
  });

  // Queue site ready email
  await db.job.create({
    data: {
      tenantId,
      jobType: "send_email",
      status: "pending",
      payload: {
        tenantId,
        template: "site_ready",
      },
    },
  });

  return NextResponse.json({ success: true, status: "active" });
}
