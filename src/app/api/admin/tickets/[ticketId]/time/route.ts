import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;
  const session = await auth();

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const body = await request.json();
  const { minutes, description, tenantId } = body;

  if (!minutes || minutes <= 0) {
    return NextResponse.json({ error: "Invalid minutes" }, { status: 400 });
  }

  // Verify ticket exists
  const ticket = await db.changeTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  // Create time log
  const timeLog = await db.ticketTimeLog.create({
    data: {
      ticketId,
      minutes,
      note: description || null,
    },
  });

  // Deduct minutes from tenant's balance
  // Find current period
  const currentPeriod = await db.minutesLedger.findFirst({
    where: {
      tenantId,
      periodStart: { lte: new Date() },
      periodEnd: { gte: new Date() },
    },
  });

  if (currentPeriod) {
    await db.minutesLedger.update({
      where: { id: currentPeriod.id },
      data: {
        usedMinutes: { increment: minutes },
      },
    });
  }

  return NextResponse.json({ success: true, timeLog });
}
