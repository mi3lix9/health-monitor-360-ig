"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTesting } from "@/lib/testing/testing-context"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useQueryClient } from "@tanstack/react-query"
import { AlertCircle } from "lucide-react"

export function TestingMetrics() {
  const { isGeneratingData, dataGenerationOptions } = useTesting()
  const [metrics, setMetrics] = useState({
    totalGenerated: 0,
    successRate: 100,
    anomalyRate: 0,
    alertCount: 0,
    warningCount: 0,
    normalCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Throttle updates for high-frequency data generation
  const updateInterval = dataGenerationOptions.interval <= 1000 ? 1000 : dataGenerationOptions.interval

  useEffect(() => {
    if (!isGeneratingData) {
      return
    }

    setIsLoading(true)
    setError(null)

    const fetchMetrics = async () => {
      try {
        // Fetch metrics from API or calculate them
        const response = await fetch("/api/testing/metrics")

        // Check if the response is ok
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`)
        }

        // Check if the response is empty
        const text = await response.text()
        if (!text || text.trim() === "") {
          console.warn("Empty response from /api/testing/metrics")
          throw new Error("Empty response from metrics API")
        }

        // Try to parse the response as JSON
        let data
        try {
          data = JSON.parse(text)
        } catch (parseError) {
          console.error("Error parsing metrics JSON:", parseError, "Response text:", text)
          throw new Error(`Failed to parse metrics data: ${parseError.message}`)
        }

        // Validate the data structure
        if (!data || typeof data !== "object") {
          throw new Error("Invalid metrics data format")
        }

        setMetrics({
          totalGenerated: data.totalGenerated || 0,
          successRate: data.successRate || 100,
          anomalyRate: data.anomalyRate || 0,
          alertCount: data.alertCount || 0,
          warningCount: data.warningCount || 0,
          normalCount: data.normalCount || 0,
        })

        setError(null)
      } catch (error) {
        console.error("Error fetching testing metrics:", error)
        setError(`Failed to fetch metrics: ${error.message}`)
        // Keep the previous metrics if there's an error
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchMetrics()

    // Set up interval for updates
    const intervalId = setInterval(() => {
      fetchMetrics().catch((err) => {
        console.error("Error in metrics update interval:", err)
      })

      // Also refresh the main data queries
      try {
        queryClient.invalidateQueries({ queryKey: ["healthStats"] })
        queryClient.invalidateQueries({ queryKey: ["recentReadings"] })
      } catch (err) {
        console.error("Error invalidating queries:", err)
      }
    }, updateInterval)

    return () => {
      clearInterval(intervalId)
    }
  }, [isGeneratingData, queryClient, updateInterval])

  // Create a function to check if the API endpoint exists
  useEffect(() => {
    const checkApiEndpoint = async () => {
      if (!isGeneratingData) return

      try {
        const response = await fetch("/api/testing/metrics", { method: "HEAD" })
        if (!response.ok) {
          console.warn(`Metrics API endpoint check failed: ${response.status}`)
          setError(`API endpoint not available (${response.status})`)
        }
      } catch (err) {
        console.error("Error checking metrics API endpoint:", err)
      }
    }

    checkApiEndpoint()
  }, [isGeneratingData])

  if (!isGeneratingData) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Testing Metrics</span>
          {isGeneratingData && !error && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="mr-1 h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              Live
            </Badge>
          )}
          {error && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              Error
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Real-time metrics for generated test data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 p-3 rounded-md text-red-700 text-sm mb-4 flex items-start">
                <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error loading metrics</p>
                  <p className="text-xs mt-1">{error}</p>
                  <p className="text-xs mt-1">Using cached or default values</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Generated</span>
                <span className="text-sm font-medium">{metrics.totalGenerated}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-sm font-medium">{metrics.successRate}%</span>
              </div>
              <Progress value={metrics.successRate} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Anomaly Rate</span>
                <span className="text-sm font-medium">{metrics.anomalyRate}%</span>
              </div>
              <Progress value={metrics.anomalyRate} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-50 p-2 rounded-md text-center">
                <div className="text-xs text-muted-foreground">Normal</div>
                <div className="text-lg font-bold text-green-600">{metrics.normalCount}</div>
              </div>
              <div className="bg-yellow-50 p-2 rounded-md text-center">
                <div className="text-xs text-muted-foreground">Warning</div>
                <div className="text-lg font-bold text-yellow-600">{metrics.warningCount}</div>
              </div>
              <div className="bg-red-50 p-2 rounded-md text-center">
                <div className="text-xs text-muted-foreground">Alert</div>
                <div className="text-lg font-bold text-red-600">{metrics.alertCount}</div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center mt-2">
              {dataGenerationOptions.interval <= 1000
                ? "High-frequency mode: Metrics update every second"
                : `Metrics update every ${dataGenerationOptions.interval / 1000} seconds`}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
