"use client"

import { useState, useEffect, useCallback } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchUSDCBalance, fetchSTSLABalance } from "@/lib/contract-interactions"

export function useSyntheticAssets() {
  const { connection } = useConnection()
  const { publicKey, connected } = useWallet()
  const { toast } = useToast()

  const [usdcBalance, setUsdcBalance] = useState<number | null>(null)
  const [sTslaBalance, setSTslaBalance] = useState<number | null>(null)
  const [tslaPrice, setTslaPrice] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch TSLA price from mock API
  const fetchTslaPrice = useCallback(async () => {
    try {
      // In a real app, this would be fetched from an oracle or price feed
      // For demo purposes, we'll use a mock price with some randomness
      const basePrice = 250
      const randomVariation = Math.random() * 20 - 10 // -10 to +10
      setTslaPrice(basePrice + randomVariation)
    } catch (error) {
      console.error("Error fetching TSLA price:", error)
      toast({
        title: "Error",
        description: "Failed to fetch TSLA price",
        variant: "destructive",
      })
    }
  }, [toast])

  // Fetch all balances and data
  const fetchBalances = useCallback(async () => {
    if (!connected || !publicKey) {
      setUsdcBalance(null)
      setSTslaBalance(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      // Fetch USDC balance
      const usdc = await fetchUSDCBalance(publicKey)
      setUsdcBalance(usdc)

      // Fetch sTSLA balance
      const sTsla = await fetchSTSLABalance(publicKey)
      setSTslaBalance(sTsla)

      // Fetch TSLA price
      await fetchTslaPrice()
    } catch (error) {
      console.error("Error fetching balances:", error)
      toast({
        title: "Error",
        description: "Failed to fetch account data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [connection, publicKey, connected, toast, fetchTslaPrice])

  // Initial fetch
  useEffect(() => {
    fetchBalances()

    // Set up an interval to refresh data
    const intervalId = setInterval(fetchBalances, 30000) // every 30 seconds

    return () => clearInterval(intervalId)
  }, [fetchBalances])

  return {
    usdcBalance,
    sTslaBalance,
    tslaPrice,
    fetchBalances,
    isLoading,
  }
}
