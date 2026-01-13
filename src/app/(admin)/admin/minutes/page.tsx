import Link from "next/link";
import { getDb } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingDown, TrendingUp } from "lucide-react";

export default async function AdminMinutesPage() {
  const db = getDb();

  // Get all current period ledgers
  const now = new Date();
  const currentLedgers = await db.minutesLedger.findMany({
    where: {
      periodStart: { lte: now },
      periodEnd: { gte: now },
    },
    include: {
      tenant: true,
    },
    orderBy: { usedMinutes: "desc" },
  });

  // Calculate totals
  const totalIncluded = currentLedgers.reduce((acc, l) => acc + l.includedMinutes, 0);
  const totalUsed = currentLedgers.reduce((acc, l) => acc + l.usedMinutes, 0);
  const totalPurchased = currentLedgers.reduce((acc, l) => acc + l.purchasedMinutes, 0);

  // Get tenants with low balance
  const lowBalanceTenants = currentLedgers.filter((l) => {
    const remaining = l.includedMinutes + l.purchasedMinutes - l.usedMinutes;
    return remaining < 15 && remaining >= 0;
  });

  // Get tenants over their limit
  const overLimitTenants = currentLedgers.filter((l) => {
    const remaining = l.includedMinutes + l.purchasedMinutes - l.usedMinutes;
    return remaining < 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minutes Overview</h1>
        <p className="text-gray-500">Track minutes usage across all tenants</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xl font-bold">{totalIncluded}</p>
                <p className="text-xs text-gray-500">Total Included</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xl font-bold">{totalUsed}</p>
                <p className="text-xs text-gray-500">Total Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xl font-bold">{totalPurchased}</p>
                <p className="text-xs text-gray-500">Purchased</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xl font-bold">
                  {Math.round((totalUsed / (totalIncluded + totalPurchased || 1)) * 100)}%
                </p>
                <p className="text-xs text-gray-500">Utilization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        {(lowBalanceTenants.length > 0 || overLimitTenants.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Attention Needed</CardTitle>
              <CardDescription>Tenants with low or negative balance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overLimitTenants.map((ledger) => (
                <Link
                  key={ledger.id}
                  href={`/admin/tenants/${ledger.tenant.id}`}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100"
                >
                  <div>
                    <p className="font-medium">{ledger.tenant.businessName}</p>
                    <p className="text-sm text-red-600">Over limit</p>
                  </div>
                  <span className="font-bold text-red-600">
                    {ledger.includedMinutes + ledger.purchasedMinutes - ledger.usedMinutes} min
                  </span>
                </Link>
              ))}
              {lowBalanceTenants.map((ledger) => (
                <Link
                  key={ledger.id}
                  href={`/admin/tenants/${ledger.tenant.id}`}
                  className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100"
                >
                  <div>
                    <p className="font-medium">{ledger.tenant.businessName}</p>
                    <p className="text-sm text-yellow-600">Low balance</p>
                  </div>
                  <span className="font-bold text-yellow-600">
                    {ledger.includedMinutes + ledger.purchasedMinutes - ledger.usedMinutes} min
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* All Tenants */}
        <Card className={lowBalanceTenants.length === 0 && overLimitTenants.length === 0 ? "lg:col-span-2" : ""}>
          <CardHeader>
            <CardTitle>All Tenants - Current Period</CardTitle>
            <CardDescription>Minutes usage for {now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentLedgers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No minutes data</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-gray-500">Tenant</th>
                      <th className="pb-3 font-medium text-gray-500">Included</th>
                      <th className="pb-3 font-medium text-gray-500">Used</th>
                      <th className="pb-3 font-medium text-gray-500">Purchased</th>
                      <th className="pb-3 font-medium text-gray-500">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentLedgers.map((ledger) => {
                      const remaining = ledger.includedMinutes + ledger.purchasedMinutes - ledger.usedMinutes;
                      return (
                        <tr key={ledger.id} className="hover:bg-gray-50">
                          <td className="py-3">
                            <Link href={`/admin/tenants/${ledger.tenant.id}`} className="hover:underline">
                              {ledger.tenant.businessName}
                            </Link>
                          </td>
                          <td className="py-3 text-sm">{ledger.includedMinutes}</td>
                          <td className="py-3 text-sm">{ledger.usedMinutes}</td>
                          <td className="py-3 text-sm">{ledger.purchasedMinutes}</td>
                          <td className="py-3">
                            <span className={`font-medium ${
                              remaining < 0
                                ? "text-red-600"
                                : remaining < 15
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}>
                              {remaining}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
