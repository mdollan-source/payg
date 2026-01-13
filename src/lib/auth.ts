import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { db } from "./db";
import { magicLinkEmail } from "./email/templates";

// Auth.js configuration
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || "PAYGSite <noreply@paygsite.co.uk>",
      // Custom email content
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const { Resend: ResendClient } = await import("resend");
        const resend = new ResendClient(provider.apiKey);

        const template = magicLinkEmail({ magicLink: url });

        try {
          await resend.emails.send({
            from: provider.from || "PAYGSite <noreply@paygsite.co.uk>",
            to: identifier,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });
        } catch (error) {
          console.error("Failed to send magic link email:", error);
          throw new Error("Failed to send verification email");
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
    error: "/login/error",
  },
  callbacks: {
    async session({ session, user }) {
      // Add user ID to session
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user }) {
      // Allow sign in
      return true;
    },
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Enable debug in development
  debug: process.env.NODE_ENV === "development",
});
