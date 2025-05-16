import { Suspense } from "react"
import Dashboard from "@/components/dashboard"
import LoadingDashboard from "@/components/loading-dashboard"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<LoadingDashboard />}>
        <Dashboard />
      </Suspense>
    </main>
  )
}
