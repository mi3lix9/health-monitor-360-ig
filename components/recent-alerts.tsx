"use client"

import { useRecentReadings } from "@/lib/react-query-hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/ui/status-badge"
import { format, parseISO } from "date-fns"
import Link from "next/link"

export function RecentAlerts() {
  const { data: readings, isLoading } = useRecentReadings(20)

  if (isLoading) {
    return <Skeleton className="h-full w-full" />
  }

  if (!readings || readings.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No health readings available</div>
  }

  // Filter for alerts and warnings
  const alertsAndWarnings = readings.filter((reading) => reading.state === "alert" || reading.state === "warning")

  if (alertsAndWarnings.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No alerts or warnings found</div>
  }

  return (
    <div className="space-y-4">
      {alertsAndWarnings.map((reading) => (
        <Link
          key={reading.id}
          href={`/players/${reading.player_id}`}
          className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="font-medium">Player ID: {reading.player_id.substring(0, 8)}...</div>
            <StatusBadge status={reading.state} />
          </div>
          <div className="text-sm text-muted-foreground mb-2">{format(parseISO(reading.timestamp), "PPpp")}</div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="font-medium">Heart Rate</div>
              <div
                className={reading.heart_rate > 100 || reading.heart_rate < 60 ? "text-red-600 dark:text-red-400" : ""}
              >
                {reading.heart_rate} BPM
              </div>
            </div>
            <div>
              <div className="font-medium">Hydration</div>
              <div className={reading.hydration < 70 ? "text-red-600 dark:text-red-400" : ""}>{reading.hydration}%</div>
            </div>
            <div>
              <div className="font-medium">Fatigue</div>
              <div className={reading.fatigue > 30 ? "text-red-600 dark:text-red-400" : ""}>{reading.fatigue}%</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
