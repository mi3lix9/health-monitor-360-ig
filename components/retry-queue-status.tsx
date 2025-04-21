"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import Link from "next/link"
import { getRetryQueueStats } from "@/lib/retry-queue-service"

export function RetryQueueStatus() {
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const stats = await getRetryQueueStats()
        setPendingCount(stats.pending)
        setFailedCount(stats.failed)
      } catch (err) {
        console.error("Error loading retry queue stats:", err)
        setError(err instanceof Error ? err : new Error("Failed to load retry queue stats"))
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()

    // Refresh every minute
    const interval = setInterval(loadStats, 60000)

    return () => clearInterval(interval)
  }, [])

  // If there's an error, show a minimal error state
  if (error) {
    return (
      <Card className="border-red-300 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <RotateCcw className="h-4 w-4 mr-2" />
            AI Analysis Retry Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">Failed to load retry queue stats</div>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || (pendingCount === 0 && failedCount === 0)) {
    return null
  }

  return (
    <Card className={failedCount > 0 ? "border-red-300 bg-red-50" : "border-yellow-300 bg-yellow-50"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <RotateCcw className="h-4 w-4 mr-2" />
          AI Analysis Retry Queue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {pendingCount > 0 && (
              <div className="flex items-center">
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 mr-2">
                  {pendingCount}
                </Badge>
                <span className="text-sm">pending retries</span>
              </div>
            )}
            {failedCount > 0 && (
              <div className="flex items-center">
                <Badge variant="outline" className="bg-red-100 text-red-800 mr-2">
                  {failedCount}
                </Badge>
                <span className="text-sm">failed analyses</span>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/retry-queue">Manage Queue</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
