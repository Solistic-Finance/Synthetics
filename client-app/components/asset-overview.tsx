import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"

interface AssetOverviewProps {
  solBalance: number | null
  usdcBalance: number | null
  sTslaBalance: number | null
  tslaPrice: number | null
  isLoading: boolean
}

export default function AssetOverview({
  solBalance,
  usdcBalance,
  sTslaBalance,
  tslaPrice,
  isLoading,
}: AssetOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">SOL Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <div className="text-2xl font-bold">{solBalance !== null ? solBalance.toFixed(4) : "0"} SOL</div>
          )}
          {isLoading ? (
            <Skeleton className="mt-2 h-4 w-16" />
          ) : (
            <p className="text-xs text-muted-foreground">
              {solBalance !== null && tslaPrice ? `$${formatCurrency(solBalance * 20)}` : "$0.00"}
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">USDC Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <div className="text-2xl font-bold">{usdcBalance !== null ? formatCurrency(usdcBalance) : "0"} USDC</div>
          )}
          {isLoading ? (
            <Skeleton className="mt-2 h-4 w-16" />
          ) : (
            <p className="text-xs text-muted-foreground">Available for collateral</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">sTSLA Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <div className="text-2xl font-bold">{sTslaBalance !== null ? sTslaBalance.toFixed(4) : "0"} sTSLA</div>
          )}
          {isLoading ? (
            <Skeleton className="mt-2 h-4 w-16" />
          ) : (
            <p className="text-xs text-muted-foreground">
              {sTslaBalance !== null && tslaPrice ? `$${formatCurrency(sTslaBalance * (tslaPrice || 0))}` : "$0.00"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
