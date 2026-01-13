import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
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

  // Don't allow deleting subdomain
  if (domain.domainType === "subdomain") {
    return NextResponse.json(
      { error: "Cannot delete subdomain" },
      { status: 400 }
    );
  }

  // Don't allow deleting primary domain if it's the only one
  if (domain.isPrimary) {
    const domainCount = await db.tenantDomain.count({
      where: { tenantId },
    });
    if (domainCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete only domain" },
        { status: 400 }
      );
    }
  }

  await db.tenantDomain.delete({
    where: { id: domainId },
  });

  // If we deleted the primary, make the subdomain primary
  if (domain.isPrimary) {
    const subdomain = await db.tenantDomain.findFirst({
      where: { tenantId, domainType: "subdomain" },
    });
    if (subdomain) {
      await db.tenantDomain.update({
        where: { id: subdomain.id },
        data: { isPrimary: true },
      });
    }
  }

  return NextResponse.json({ success: true });
}
