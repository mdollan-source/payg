import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  // Find the user's tenant
  const tenantUser = await db.tenantUser.findFirst({
    where: { email: session.user.email },
    include: { tenant: true },
  });

  if (!tenantUser) {
    return NextResponse.json({ error: "No tenant found" }, { status: 404 });
  }

  const body = await request.json();
  const { type, title, description } = body;

  if (!title || !description) {
    return NextResponse.json(
      { error: "Title and description are required" },
      { status: 400 }
    );
  }

  // Create the ticket
  const ticket = await db.changeTicket.create({
    data: {
      tenantId: tenantUser.tenant.id,
      title,
      description,
      category: type || "other",
      status: "new",
      priority: "normal",
    },
  });

  return NextResponse.json({ success: true, ticket });
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  // Find the user's tenant
  const tenantUser = await db.tenantUser.findFirst({
    where: { email: session.user.email },
    include: { tenant: true },
  });

  if (!tenantUser) {
    return NextResponse.json({ error: "No tenant found" }, { status: 404 });
  }

  const tickets = await db.changeTicket.findMany({
    where: { tenantId: tenantUser.tenant.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tickets });
}
