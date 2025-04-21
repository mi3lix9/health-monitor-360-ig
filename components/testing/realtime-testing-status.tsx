"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTesting } from "@/lib/testing/testing-context"
import { Badge } from "@/components/ui/badge"
import { useHealthStats } from "@/lib/react-query-hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, CheckCircle, Activity } from "lucide-react"

export function RealtimeTestingStatus() {
  const { mode, isGeneratingData, dataGenerationOptions } = useTesting()
  const { data: healthStats, isLoading } = useHealthStats()
  const [elapsedTime, setElapsedTime] = useState(0)
  const [readingsPerMinute, setReadingsPerMinute] = useState(0)
  const [lastReadingCount, setLastReadingCount] = useState(0)
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now())

  // Calculate readings per minute
  useEffect(() => {
    if (healthStats && healthStats.total_readings !== undefined) {
      const now = Date.now()
      const timeDiff = (now - lastUpdateTime) / 1000 // in seconds

      if (timeDiff > 0 && healthStats.total_readings !== lastReadingCount) {
        const newReadingsCount = healthStats.total_readings - lastReadingCount
        const newReadingsPerMinute = Math.round((newReadingsCount / timeDiff) * 60)

        // Update only if we have new readings
        if (newReadingsCount > 0) {
          setReadingsPerMinute(newReadingsPerMinute)
          setLastReadingCount(healthStats.total_readings)
          setLastUpdateTime(now)
        }
      }
    }
  }, [healthStats, lastReadingCount, lastUpdateTime])

  // Update elapsed time
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isGeneratingData) {
      // Reset elapsed time when starting
      setElapsedTime(0)

      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isGeneratingData])

  // Format elapsed time
  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (mode !== "testing") {
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Testing Status</CardTitle>
          <CardDescription>Real-time testing metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Testing Status</CardTitle>
            <CardDescription>Real-time testing metrics</CardDescription>
          </div>
          {isGeneratingData && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="mr-1 h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isGeneratingData ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Elapsed Time</p>
                  <p className="text-2xl font-bold">{formatElapsedTime(elapsedTime)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Readings/min</p>
                  <p className="text-2xl font-bold">{readingsPerMinute}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Generation Settings</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm">
                    {dataGenerationOptions.playerIds.length} Players
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200 text-xs sm:text-sm"
                  >
                    {dataGenerationOptions.interval / 1000}s Interval
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-orange-50 text-orange-700 border-orange-200 text-xs sm:text-sm"
                  >
                    {dataGenerationOptions.anomalyFrequency * 100}% Anomalies
                  </Badge>

                  {dataGenerationOptions.anomalySeverity === "low" && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs sm:text-sm">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Low Severity
                    </Badge>
                  )}

                  {dataGenerationOptions.anomalySeverity === "medium" && (
                    <Badge
                      variant="outline"
                      className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs sm:text-sm"
                    >
                      <Activity className="mr-1 h-3 w-3" />
                      Medium Severity
                    </Badge>
                  )}

                  {dataGenerationOptions.anomalySeverity === "high" && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs sm:text-sm">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      High Severity
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Generated Data</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">{healthStats?.total_readings || 0}</p>
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="text-xs text-muted-foreground">Warnings</p>
                    <p className="text-lg font-bold text-yellow-600">{healthStats?.warning_count || 0}</p>
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="text-xs text-muted-foreground">Alerts</p>
                    <p className="text-lg font-bold text-red-600">{healthStats?.alert_count || 0}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Testing data generation is not active.
              <br />
              Start data generation to see real-time metrics.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
