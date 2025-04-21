"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/ui/status-badge"
import { getBrowserClient } from "@/lib/supabase"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AlertsTimeline() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 10

  useEffect(() => {
    async function fetchAlerts() {
      try {
        setIsLoading(true)
        const supabase = getBrowserClient()

        // Fetch alert readings with player info
        const { data, error } = await supabase
          .from("health_readings")
          .select(`
            id,
            player_id,
            temperature,
            heart_rate,
            blood_oxygen,
            hydration,
            respiration,
            fatigue,
            state,
            timestamp,
            ai_analysis,
            players (
              id,
              name,
              position,
              jersey_number,
              image_url
            )
          `)
          .eq("state", "alert")
          .order("timestamp", { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1)

        if (error) {
          console.error("Error fetching alerts:", error)
          return
        }

        // Check if we have more pages
        setHasMore(data.length === pageSize)

        if (page === 1) {
          setAlerts(data || [])
        } else {
          setAlerts((prev) => [...prev, ...(data || [])])
        }
      } catch (error) {
        console.error("Error in AlertsTimeline:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAlerts()
  }, [page, pageSize])

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage((prev) => prev + 1)
    }
  }

  if (isLoading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
          <p>Loading alerts...</p>
        </div>
      </div>
    )
  }

  if (!alerts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No alerts found</p>
        <p className="text-xs text-muted-foreground mt-2">All players are currently in normal or warning state</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {alerts.map((alert) => (
          <div key={alert.id} className="border rounded-lg overflow-hidden dark:border-red-800">
            <div className="bg-red-50 border-b border-red-200 p-4 dark:bg-red-950/20 dark:border-red-800">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={alert.players?.image_url || ""} alt={alert.players?.name} />
                  <AvatarFallback>{alert.players?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <Link href={`/players/${alert.player_id}`} className="font-medium hover:underline">
                      {alert.players?.name}
                    </Link>
                    <StatusBadge status={alert.state} />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div>{alert.players?.position}</div>
                    <div>•</div>
                    <div>#{alert.players?.jersey_number}</div>
                    <div>•</div>
                    <div>{new Date(alert.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <MetricItem
                  label="Temperature"
                  value={`${alert.temperature}°C`}
                  isAlert={alert.temperature < 36 || alert.temperature > 38}
                />
                <MetricItem
                  label="Heart Rate"
                  value={`${alert.heart_rate} BPM`}
                  isAlert={alert.heart_rate < 50 || alert.heart_rate > 120}
                />
                <MetricItem label="Blood Oxygen" value={`${alert.blood_oxygen}%`} isAlert={alert.blood_oxygen < 90} />
                <MetricItem label="Hydration" value={`${alert.hydration}%`} isAlert={alert.hydration < 60} />
                <MetricItem
                  label="Respiration"
                  value={`${alert.respiration} breaths/min`}
                  isAlert={alert.respiration < 10 || alert.respiration > 25}
                />
                <MetricItem label="Fatigue" value={`${alert.fatigue}/100`} isAlert={alert.fatigue > 50} />
              </div>

              {alert.ai_analysis && alert.ai_analysis.priority_action && (
                <div className="bg-red-100 border border-red-200 rounded-lg p-3 dark:bg-red-950/40 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
                    <div className="font-medium text-red-700 dark:text-red-400">Priority Action</div>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{alert.ai_analysis.priority_action}</p>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/players/${alert.player_id}`}>View Player Details</Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button onClick={loadMore} variant="outline" disabled={isLoading}>
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  )
}

function MetricItem({
  label,
  value,
  isAlert,
}: {
  label: string
  value: string
  isAlert?: boolean
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`font-medium ${isAlert ? "text-red-600 dark:text-red-400" : ""}`}>{value}</span>
    </div>
  )
}
