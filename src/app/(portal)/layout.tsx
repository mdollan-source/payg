import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { PortalHeader } from "@/components/portal/PortalHeader";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader user={session.user} />
      <div className="flex">
        <PortalSidebar />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
