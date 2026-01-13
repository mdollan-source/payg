import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; domainId: string }> }
) {
  const { tenantId, domainId } = await params;
  const session = await auth();

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  const domain = await db.tenantDomain.findFirst({
    where: { id: domainId, tenantId },
  });

  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  // Must be verified to be primary
  if (domain.verificationStatus !== "verified") {
    return NextResponse.json(
      { error: "Domain must be verified to set as primary" },
      { status: 400 }
    );
  }

  // Unset current primary
  await db.tenantDomain.updateMany({
    where: { tenantId, isPrimary: true },
    data: { isPrimary: false },
  });

  // Set new primary
  await db.tenantDomain.update({
    where: { id: domainId },
    data: { isPrimary: true },
  });

  return NextResponse.json({ success: true });
}
