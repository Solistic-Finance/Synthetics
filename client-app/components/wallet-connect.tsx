import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"

export default function WalletConnect() {
  return (
    <div className="container flex items-center justify-center py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
          <CardDescription>Connect your Solana wallet to access the synthetic assets platform</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <WalletMultiButton className="wallet-adapter-button" />
        </CardContent>
      </Card>
    </div>
  )
}
