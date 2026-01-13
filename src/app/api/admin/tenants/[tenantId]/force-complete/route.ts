import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";

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
    include: { pages: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  if (tenant.status !== "building") {
    return NextResponse.json(
      { error: "Tenant is not in building state" },
      { status: 400 }
    );
  }

  // Check if there are any pages
  if (tenant.pages.length === 0) {
    return NextResponse.json(
      { error: "No pages generated yet - cannot force complete" },
      { status: 400 }
    );
  }

  // Force to active status
  await db.tenant.update({
    where: { id: tenantId },
    data: { status: "active" },
  });

  // Mark any pending jobs as completed
  await db.job.updateMany({
    where: {
      tenantId,
      status: { in: ["pending", "running"] },
    },
    data: { status: "completed" },
  });

  return NextResponse.json({ success: true });
}
