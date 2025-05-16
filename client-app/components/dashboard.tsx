"use client"

import { useState, useEffect } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import AssetOverview from "@/components/asset-overview"
import PriceChart from "@/components/price-chart"
import DepositForm from "@/components/deposit-form"
import RedeemForm from "@/components/redeem-form"
import WalletConnect from "@/components/wallet-connect"
import { useSyntheticAssets } from "@/hooks/use-synthetic-assets"

export default function Dashboard() {
  const { connection } = useConnection()
  const { publicKey, connected } = useWallet()
  const { toast } = useToast()
  const [solBalance, setSolBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { usdcBalance, sTslaBalance, tslaPrice, fetchBalances, isLoading: assetsLoading } = useSyntheticAssets()

  useEffect(() => {
    if (!connected || !publicKey) {
      setSolBalance(null)
      setIsLoading(false)
      return
    }

    const fetchSolBalance = async () => {
      try {
        setIsLoading(true)
        const balance = await connection.getBalance(publicKey)
        setSolBalance(balance / LAMPORTS_PER_SOL)
        await fetchBalances()
      } catch (error) {
        console.error("Error fetching SOL balance:", error)
        toast({
          title: "Error",
          description: "Failed to fetch wallet balance",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSolBalance()
    // Set up an interval to refresh balances
    const intervalId = setInterval(fetchSolBalance, 30000) // every 30 seconds

    return () => clearInterval(intervalId)
  }, [connection, publicKey, connected, toast, fetchBalances])

  if (!connected) {
    return <WalletConnect />
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Synthetic Portfolio</h1>

      <div className="grid gap-6">
        <AssetOverview
          solBalance={solBalance}
          usdcBalance={usdcBalance}
          sTslaBalance={sTslaBalance}
          tslaPrice={tslaPrice}
          isLoading={isLoading || assetsLoading}
        />

        <PriceChart currentPrice={tslaPrice} />

        <Tabs defaultValue="deposit" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Deposit Collateral</TabsTrigger>
            <TabsTrigger value="redeem">Redeem sTSLA</TabsTrigger>
          </TabsList>
          <TabsContent value="deposit">
            <Card>
              <CardHeader>
                <CardTitle>Deposit USDC Collateral</CardTitle>
              </CardHeader>
              <CardContent>
                <DepositForm usdcBalance={usdcBalance} tslaPrice={tslaPrice} onSuccess={fetchBalances} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="redeem">
            <Card>
              <CardHeader>
                <CardTitle>Redeem sTSLA for USDC</CardTitle>
              </CardHeader>
              <CardContent>
                <RedeemForm sTslaBalance={sTslaBalance} tslaPrice={tslaPrice} onSuccess={fetchBalances} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
