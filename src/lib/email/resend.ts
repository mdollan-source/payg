import { Resend } from "resend";

// Initialize Resend client
function createResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey.includes("placeholder")) {
    console.warn(
      "⚠️ Resend is not configured. Set RESEND_API_KEY in your .env file."
    );
    return null;
  }

  return new Resend(apiKey);
}

export const resend = createResendClient();

// Default sender
export const EMAIL_FROM = process.env.EMAIL_FROM || "PAYGSite <noreply@paygsite.co.uk>";

/**
 * Check if Resend is configured
 */
export function isResendConfigured(): boolean {
  return resend !== null;
}

/**
 * Send an email using Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<{ id: string } | null> {
  if (!resend) {
    console.warn("[Email] Resend not configured, email not sent:", { to, subject });
    return null;
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    console.log(`[Email] Sent "${subject}" to ${to}`);
    return { id: result.data?.id || "unknown" };
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    throw error;
  }
}
