import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// Admin emails - in production, this should come from a database or env var
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

/**
 * Check if the current user is an admin
 * Redirects to login if not authenticated, or home if not an admin
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const isAdmin = ADMIN_EMAILS.includes(session.user.email.toLowerCase());

  if (!isAdmin) {
    redirect("/");
  }

  return session;
}

/**
 * Check if an email is an admin
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
