"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import Link from "next/link"
import { getRetryQueueStats } from "@/lib/retry-queue-service"

export function RetryQueueIndicator() {
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true)
        const stats = await getRetryQueueStats()
        setPendingCount(stats.pending)
        setFailedCount(stats.failed)
      } catch (error) {
        console.error("Error loading retry queue stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()

    // Refresh every minute
    const interval = setInterval(loadStats, 60000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading || (pendingCount === 0 && failedCount === 0)) {
    return null
  }

  return (
    <Card
      className={
        failedCount > 0
          ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
          : "border-yellow-300 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20"
      }
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            <div className="text-sm font-medium">Retry Queue</div>
          </div>

          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge
                variant="outline"
                className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
              >
                {pendingCount} pending
              </Badge>
            )}
            {failedCount > 0 && (
              <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                {failedCount} failed
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-2">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/admin/retry-queue">Manage Queue</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
