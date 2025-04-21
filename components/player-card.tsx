"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import type { PlayerWithLatestReading } from "@/types"

type PlayerCardProps = {
  player: PlayerWithLatestReading
}

export function PlayerCard({ player }: PlayerCardProps) {
  const hasReading = !!player.latest_reading
  const status = hasReading ? player.latest_reading.state : "normal"
  const [isNew, setIsNew] = useState(false)
  const [prevReadingId, setPrevReadingId] = useState(player.latest_reading?.id)

  // Check if this is a new reading
  useEffect(() => {
    if (player.latest_reading?.id !== prevReadingId) {
      setIsNew(true)
      setPrevReadingId(player.latest_reading?.id)

      // Reset the new indicator after 5 seconds
      const timer = setTimeout(() => {
        setIsNew(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [player.latest_reading?.id, prevReadingId])

  return (
    <Link href={`/players/${player.id}`}>
      <Card
        className={`h-full transition-all hover:shadow-md ${isNew ? "animate-pulse border-2 border-primary" : ""} ${
          status === "alert"
            ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
            : status === "warning"
              ? "border-yellow-300 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20"
              : ""
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={player.image_url || ""} alt={player.name} />
              <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium truncate">{player.name}</div>
                <div className="text-base font-bold">#{player.jersey_number}</div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="text-sm text-muted-foreground">{player.position}</div>
                <StatusBadge status={status} />
                {isNew && (
                  <Badge variant="outline" className="bg-primary/10 text-primary text-xs">
                    New
                  </Badge>
                )}
              </div>

              {hasReading ? (
                <div className="grid grid-cols-3 gap-y-2 gap-x-4 text-sm">
                  <MetricItem
                    label="Temp"
                    value={`${player.latest_reading.temperature}°C`}
                    isAlert={player.latest_reading.temperature < 36 || player.latest_reading.temperature > 38}
                    isWarning={player.latest_reading.temperature < 36.5 || player.latest_reading.temperature > 37.5}
                  />
                  <MetricItem
                    label="Heart"
                    value={`${player.latest_reading.heart_rate} BPM`}
                    isAlert={player.latest_reading.heart_rate < 50 || player.latest_reading.heart_rate > 120}
                    isWarning={player.latest_reading.heart_rate < 60 || player.latest_reading.heart_rate > 100}
                  />
                  <MetricItem
                    label="Oxygen"
                    value={`${player.latest_reading.blood_oxygen}%`}
                    isAlert={player.latest_reading.blood_oxygen < 90}
                    isWarning={player.latest_reading.blood_oxygen < 95}
                  />
                  <MetricItem
                    label="Hydration"
                    value={`${player.latest_reading.hydration}%`}
                    isAlert={player.latest_reading.hydration < 60}
                    isWarning={player.latest_reading.hydration < 70}
                  />
                  <MetricItem
                    label="Resp"
                    value={`${player.latest_reading.respiration}`}
                    isAlert={player.latest_reading.respiration < 10 || player.latest_reading.respiration > 25}
                    isWarning={player.latest_reading.respiration < 12 || player.latest_reading.respiration > 20}
                  />
                  <MetricItem
                    label="Fatigue"
                    value={`${player.latest_reading.fatigue}`}
                    isAlert={player.latest_reading.fatigue > 50}
                    isWarning={player.latest_reading.fatigue > 30}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 mr-2 opacity-70" />
                  No health readings available
                </div>
              )}

              {hasReading && player.latest_reading.ai_analysis?.priority_action && status === "alert" && (
                <div className="mt-3 text-xs text-red-600 font-medium truncate border-t border-red-200 pt-2">
                  {player.latest_reading.ai_analysis.priority_action}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function MetricItem({
  label,
  value,
  isAlert,
  isWarning,
}: {
  label: string
  value: string
  isAlert?: boolean
  isWarning?: boolean
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`font-medium ${
          isAlert ? "text-red-600 dark:text-red-400" : isWarning ? "text-yellow-600 dark:text-yellow-400" : ""
        }`}
      >
        {value}
      </span>
    </div>
  )
}
