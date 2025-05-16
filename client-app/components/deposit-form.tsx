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
import { depositCollateral } from "@/lib/contract-interactions"
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

interface DepositFormProps {
  usdcBalance: number | null
  tslaPrice: number | null
  onSuccess: () => Promise<void>
}

export default function DepositForm({ usdcBalance, tslaPrice, onSuccess }: DepositFormProps) {
  const { publicKey, sendTransaction } = useWallet()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [estimatedSTSLA, setEstimatedSTSLA] = useState<number | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
    },
  })

  // Calculate estimated sTSLA tokens to be received
  const watchAmount = form.watch("amount")

  useEffect(() => {
    if (!watchAmount || !tslaPrice) {
      setEstimatedSTSLA(null)
      return
    }

    const amount = Number.parseFloat(watchAmount)
    if (isNaN(amount) || amount <= 0) {
      setEstimatedSTSLA(null)
      return
    }

    // Calculate estimated sTSLA (USDC amount / TSLA price / 1.5 collateralization ratio)
    const estimatedTokens = amount / tslaPrice / 1.5
    setEstimatedSTSLA(estimatedTokens)
  }, [watchAmount, tslaPrice])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to deposit collateral",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(values.amount)

    if (usdcBalance !== null && amount > usdcBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough USDC to deposit this amount",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Call the contract interaction function
      await depositCollateral(amount, publicKey, sendTransaction)

      toast({
        title: "Deposit successful",
        description: `Successfully deposited ${amount} USDC as collateral`,
      })

      form.reset()
      await onSuccess()
    } catch (error) {
      console.error("Deposit error:", error)
      toast({
        title: "Deposit failed",
        description: "There was an error depositing your collateral. Please try again.",
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
              <FormLabel>USDC Amount</FormLabel>
              <FormControl>
                <Input placeholder="0.00" {...field} type="number" step="0.01" min="0" disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                Available balance: {usdcBalance !== null ? usdcBalance.toFixed(2) : "0.00"} USDC
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {estimatedSTSLA !== null && (
          <Alert>
            <AlertDescription>
              Estimated sTSLA to receive: {estimatedSTSLA.toFixed(4)} sTSLA
              {tslaPrice && <> | Value: ${formatCurrency(estimatedSTSLA * tslaPrice)}</>}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">Minimum collateralization ratio: 150%</div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Deposit Collateral"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
