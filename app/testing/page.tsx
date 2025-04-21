import { TestingPanel } from "@/components/testing/testing-panel"
import { TestingProvider } from "@/lib/testing/testing-context"

export const metadata = {
  title: "Testing Environment - Health Monitor 360",
  description: "Configure and control the testing environment for Health Monitor 360",
}

export default function TestingPage() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Testing Environment</h1>
        <p className="text-muted-foreground">Configure and control the testing environment for Health Monitor 360</p>
      </div>

      <TestingProvider>
        <TestingPanel />
      </TestingProvider>
    </div>
  )
}
