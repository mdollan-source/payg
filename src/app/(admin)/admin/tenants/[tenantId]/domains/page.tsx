import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { AddDomainForm } from "@/components/admin/AddDomainForm";
import { DomainActions } from "@/components/admin/DomainActions";

interface DomainsPageProps {
  params: Promise<{ tenantId: string }>;
}

export default async function TenantDomainsPage({ params }: DomainsPageProps) {
  const { tenantId } = await params;
  const db = getDb();

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: {
      domains: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!tenant) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/admin/tenants/${tenantId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tenant
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Domain Management</h1>
          <p className="text-gray-500">{tenant.businessName}</p>
        </div>
      </div>

      {/* Add Domain */}
      <Card>
        <CardHeader>
          <CardTitle>Add Custom Domain</CardTitle>
          <CardDescription>
            Add a custom domain for this tenant. They&apos;ll need to configure DNS to point to our servers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddDomainForm tenantId={tenantId} />
        </CardContent>
      </Card>

      {/* Current Domains */}
      <Card>
        <CardHeader>
          <CardTitle>Current Domains</CardTitle>
          <CardDescription>
            All domains configured for this tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenant.domains.map((domain) => (
              <div
                key={domain.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    domain.verificationStatus === "verified"
                      ? "bg-green-100"
                      : domain.verificationStatus === "failed"
                      ? "bg-red-100"
                      : "bg-yellow-100"
                  }`}>
                    {domain.verificationStatus === "verified" ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : domain.verificationStatus === "failed" ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{domain.domain}</p>
                      {domain.isPrimary && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Primary
                        </span>
                      )}
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {domain.domainType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {domain.verificationStatus === "verified"
                        ? `Verified ${domain.verifiedAt ? new Date(domain.verifiedAt).toLocaleDateString() : ""}`
                        : domain.verificationStatus === "failed"
                        ? "Verification failed - check DNS"
                        : "Pending verification"}
                    </p>
                  </div>
                </div>
                <DomainActions domain={domain} tenantId={tenantId} />
              </div>
            ))}

            {tenant.domains.length === 0 && (
              <div className="text-center py-8">
                <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">No domains configured</p>
                <p className="text-sm text-gray-500">Add a custom domain above</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* DNS Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>DNS Configuration</CardTitle>
          <CardDescription>
            Instructions for setting up custom domains
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>To connect a custom domain, the tenant needs to add one of these DNS records:</p>

          <h4 className="font-medium mt-4">Option 1: CNAME Record (Recommended)</h4>
          <div className="bg-gray-50 p-3 rounded font-mono text-sm">
            <p>Type: CNAME</p>
            <p>Name: www (or @)</p>
            <p>Value: {tenant.businessSlug}.paygsite.co.uk</p>
          </div>

          <h4 className="font-medium mt-4">Option 2: A Record (Root domain)</h4>
          <div className="bg-gray-50 p-3 rounded font-mono text-sm">
            <p>Type: A</p>
            <p>Name: @</p>
            <p>Value: {process.env.PAYGSITE_IP || "YOUR_SERVER_IP"}</p>
          </div>

          <p className="mt-4 text-gray-600">
            DNS changes can take up to 48 hours to propagate, though usually complete within a few hours.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
