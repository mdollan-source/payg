import { StepProgress } from "@/components/onboarding/StepProgress";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">PAYGSite</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Need help? <a href="mailto:support@paygsite.co.uk" className="text-primary hover:underline">Contact us</a>
            </span>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="container mx-auto px-4 py-6">
        <StepProgress />
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 pb-12">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
