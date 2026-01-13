import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import dns from "dns";
import { promisify } from "util";

const resolveCname = promisify(dns.resolveCname);
const resolve4 = promisify(dns.resolve4);

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
    include: { tenant: true },
  });

  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const expectedCname = `${domain.tenant.businessSlug}.paygsite.co.uk`;
  const expectedIp = process.env.PAYGSITE_IP || "";

  let verified = false;
  let verificationMethod = "";

  try {
    // Try CNAME first
    const cnameRecords = await resolveCname(domain.domain);
    if (cnameRecords.some((record) => record.toLowerCase() === expectedCname.toLowerCase())) {
      verified = true;
      verificationMethod = "CNAME";
    }
  } catch {
    // CNAME lookup failed, try A record
    try {
      if (expectedIp) {
        const aRecords = await resolve4(domain.domain);
        if (aRecords.includes(expectedIp)) {
          verified = true;
          verificationMethod = "A";
        }
      }
    } catch {
      // A record lookup also failed
    }
  }

  // Update domain status
  await db.tenantDomain.update({
    where: { id: domainId },
    data: {
      verificationStatus: verified ? "verified" : "failed",
      verifiedAt: verified ? new Date() : null,
      expectedDnsRecord: {
        type: "CNAME",
        value: expectedCname,
        verificationMethod: verified ? verificationMethod : null,
      } as object,
    },
  });

  return NextResponse.json({
    success: true,
    verified,
    verificationMethod: verified ? verificationMethod : null,
  });
}
