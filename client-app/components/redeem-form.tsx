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
import { redeemSTSLA } from "@/lib/contract-interactions"
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

interface RedeemFormProps {
  sTslaBalance: number | null
  tslaPrice: number | null
  onSuccess: () => Promise<void>
}

export default function RedeemForm({ sTslaBalance, tslaPrice, onSuccess }: RedeemFormProps) {
  const { publicKey, sendTransaction } = useWallet()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [estimatedReturn, setEstimatedReturn] = useState<number | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
    },
  })

  // Calculate estimated USDC return
  const watchAmount = form.watch("amount")

  useEffect(() => {
    if (!watchAmount || !tslaPrice) {
      setEstimatedReturn(null)
      return
    }

    const amount = Number.parseFloat(watchAmount)
    if (isNaN(amount) || amount <= 0) {
      setEstimatedReturn(null)
      return
    }

    // Calculate USDC return (assuming 1:1 redemption at current price)
    const usdcReturn = amount * tslaPrice
    setEstimatedReturn(usdcReturn)
  }, [watchAmount, tslaPrice])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to redeem sTSLA",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(values.amount)

    if (sTslaBalance !== null && amount > sTslaBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough sTSLA tokens to redeem this amount",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Call the contract interaction function
      await redeemSTSLA(amount, publicKey, sendTransaction)

      toast({
        title: "Redemption successful",
        description: `Successfully redeemed ${amount} sTSLA tokens`,
      })

      form.reset()
      await onSuccess()
    } catch (error) {
      console.error("Redemption error:", error)
      toast({
        title: "Redemption failed",
        description: "There was an error redeeming your sTSLA tokens. Please try again.",
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
              <FormLabel>sTSLA Amount to Redeem</FormLabel>
              <FormControl>
                <Input placeholder="0.00" {...field} type="number" step="0.01" min="0" disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                Available balance: {sTslaBalance !== null ? sTslaBalance.toFixed(4) : "0.0000"} sTSLA
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {estimatedReturn !== null && (
          <Alert>
            <AlertDescription>Estimated USDC return: {formatCurrency(estimatedReturn)} USDC</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Current TSLA Price: ${tslaPrice ? formatCurrency(tslaPrice) : "Loading..."}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Redeem sTSLA"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
