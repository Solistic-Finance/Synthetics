"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useWallet } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { mintSTSLA } from "@/lib/contract-interactions"
import { formatCurrency } from "@/lib/utils"

const formSchema = z.object({
  amount: z.string().refine(
    (val) => {
      const num = Number.parseFloat(val)
      return !isNaN(num) && num > 0
    },
    { message: "Please enter a valid amount greater than 0" },
  ),
})

interface MintFormProps {
  usdcBalance: number | null
  tslaPrice: number | null
  collateralizationRatio: number | null
  onSuccess: () => Promise<void>
}

export default function MintForm({ usdcBalance, tslaPrice, collateralizationRatio, onSuccess }: MintFormProps) {
  const { publicKey, sendTransaction } = useWallet()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [estimatedCollateral, setEstimatedCollateral] = useState<number | null>(null)
  const [newCollateralizationRatio, setNewCollateralizationRatio] = useState<number | null>(null)
  const [maxMintable, setMaxMintable] = useState<number | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
    },
  })

  // Calculate max mintable sTSLA based on available USDC
  useEffect(() => {
    if (usdcBalance !== null && tslaPrice !== null) {
      // With 150% collateralization, each sTSLA requires 1.5 * price in collateral
      const maxAmount = usdcBalance / (tslaPrice * 1.5)
      setMaxMintable(maxAmount)
    }
  }, [usdcBalance, tslaPrice])

  // Calculate estimated collateral needed and new collateralization ratio
  const watchAmount = form.watch("amount")

  useEffect(() => {
    if (!watchAmount || !tslaPrice) {
      setEstimatedCollateral(null)
      setNewCollateralizationRatio(null)
      return
    }

    const amount = Number.parseFloat(watchAmount)
    if (isNaN(amount) || amount <= 0) {
      setEstimatedCollateral(null)
      setNewCollateralizationRatio(null)
      return
    }

    // Calculate required collateral (150% of the value)
    const requiredCollateral = amount * tslaPrice * 1.5
    setEstimatedCollateral(requiredCollateral)

    // Calculate new collateralization ratio if we have existing position
    if (collateralizationRatio !== null) {
      // This is a simplified calculation - in a real app you'd need to account for
      // existing positions and total collateral
      setNewCollateralizationRatio(150) // Simplified for demo
    }
  }, [watchAmount, tslaPrice, collateralizationRatio])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to mint sTSLA",
        variant: "destructive",
      })
      return
    }

    if (!tslaPrice) {
      toast({
        title: "Price feed unavailable",
        description: "Unable to fetch TSLA price. Please try again later.",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(values.amount)
    const requiredCollateral = amount * tslaPrice * 1.5

    if (usdcBalance !== null && requiredCollateral > usdcBalance) {
      toast({
        title: "Insufficient collateral",
        description: `You need at least ${formatCurrency(requiredCollateral)} USDC to mint this amount of sTSLA`,
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Call the contract interaction function
      await mintSTSLA(amount, publicKey, sendTransaction)

      toast({
        title: "Mint successful",
        description: `Successfully minted ${amount} sTSLA tokens`,
      })

      form.reset()
      await onSuccess()
    } catch (error) {
      console.error("Mint error:", error)
      toast({
        title: "Mint failed",
        description: "There was an error minting your sTSLA tokens. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>sTSLA Amount to Mint</FormLabel>
              <FormControl>
                <Input placeholder="0.00" {...field} type="number" step="0.01" min="0" disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                Current TSLA Price: ${tslaPrice ? formatCurrency(tslaPrice) : "Loading..."}
                {maxMintable !== null && <> | Max mintable: {maxMintable.toFixed(4)} sTSLA</>}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {estimatedCollateral !== null && (
          <Alert>
            <AlertDescription>
              Required collateral: {formatCurrency(estimatedCollateral)} USDC
              {newCollateralizationRatio !== null && (
                <> | New collateralization ratio: {newCollateralizationRatio.toFixed(0)}%</>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">Minimum collateralization ratio: 150%</div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Mint sTSLA"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
