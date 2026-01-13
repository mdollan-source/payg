import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { getDb } from "@/lib/db";
import { resolveTenant } from "@/lib/tenant/resolver";

export const dynamic = "force-dynamic";

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  // Spam prevention fields
  _honeypot?: string;
  _timestamp?: number;
}

export async function POST(request: Request) {
  // Rate limit check
  const clientIp = getClientIp(request.headers);
  const rateLimitResult = checkRateLimit(
    `contact:${clientIp}`,
    RATE_LIMITS.contactForm
  );

  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const data: ContactFormData = await request.json();

    // Spam prevention: honeypot check
    if (data._honeypot) {
      // Silently reject - don't tell bots they failed
      return NextResponse.json({ success: true });
    }

    // Spam prevention: timing check (form must take at least 3 seconds)
    if (data._timestamp) {
      const elapsed = Date.now() - data._timestamp;
      if (elapsed < 3000) {
        // Too fast - likely a bot
        return NextResponse.json({ success: true });
      }
    }

    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Resolve tenant from request
    const headersList = await headers();
    const hostname = headersList.get("x-tenant-host") || headersList.get("host") || "";

    const db = getDb();
    const resolved = await resolveTenant(db, hostname);

    if (!resolved) {
      return NextResponse.json(
        { error: "Invalid site" },
        { status: 400 }
      );
    }

    // Store contact submission
    await db.contactSubmission.create({
      data: {
        tenantId: resolved.tenant.id,
        formData: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          message: data.message,
        },
        ipAddress: clientIp,
        status: "pending",
      },
    });

    // TODO: Send notification email to tenant
    // await sendContactNotification(resolved.tenant, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
