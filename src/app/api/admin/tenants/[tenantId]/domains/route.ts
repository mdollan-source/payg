import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

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
  const body = await request.json();
  const { domain } = body;

  if (!domain) {
    return NextResponse.json({ error: "Domain is required" }, { status: 400 });
  }

  // Check tenant exists
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Check domain doesn't already exist
  const existingDomain = await db.tenantDomain.findUnique({
    where: { domain },
  });

  if (existingDomain) {
    return NextResponse.json(
      { error: "Domain already in use" },
      { status: 400 }
    );
  }

  // Create the domain
  const newDomain = await db.tenantDomain.create({
    data: {
      tenantId,
      domain,
      domainType: "custom",
      isPrimary: false,
      verificationStatus: "pending",
      expectedDnsRecord: {
        type: "CNAME",
        value: `${tenant.businessSlug}.paygsite.co.uk`,
      },
    },
  });

  return NextResponse.json({ success: true, domain: newDomain });
}
