import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a magic link to sign in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Click the link in your email to complete sign in. The link will expire in 24 hours.
          </p>
          <p className="text-sm text-gray-500">
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <Link href="/login" className="text-primary hover:underline">
              try again
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
