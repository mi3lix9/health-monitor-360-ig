"use client"

import { StatusBadge } from "@/components/ui/status-badge"
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import type { HealthReading } from "@/types"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

type HealthReadingTimelineProps = {
  readings: HealthReading[]
  showAll?: boolean
}

export function HealthReadingTimeline({ readings, showAll = false }: HealthReadingTimelineProps) {
  const [expandedReadings, setExpandedReadings] = useState<Record<string, boolean>>({})

  const toggleReading = (id: string) => {
    setExpandedReadings((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  if (!readings || readings.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <AlertCircle className="h-4 w-4 mr-2" />
        No health readings available
      </div>
    )
  }

  // If not showing all, limit to 5 readings
  const displayReadings = showAll ? readings : readings.slice(0, 5)

  return (
    <div className="space-y-4">
      {displayReadings.map((reading) => (
        <Collapsible
          key={reading.id}
          open={expandedReadings[reading.id]}
          onOpenChange={() => toggleReading(reading.id)}
          className={`border rounded-lg overflow-hidden ${
            reading.state === "alert"
              ? "border-red-200 dark:border-red-800"
              : reading.state === "warning"
                ? "border-yellow-200 dark:border-yellow-800"
                : "border-gray-200 dark:border-gray-700"
          }`}
        >
          <div
            className={`p-4 ${
              reading.state === "alert"
                ? "bg-red-50 dark:bg-red-950/20"
                : reading.state === "warning"
                  ? "bg-yellow-50 dark:bg-yellow-950/20"
                  : "bg-gray-50 dark:bg-gray-800/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusBadge status={reading.state} />
                <div className="text-sm font-medium">{new Date(reading.timestamp).toLocaleString()}</div>
              </div>

              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {expandedReadings[reading.id] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle details</span>
                </Button>
              </CollapsibleTrigger>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2">
              <MetricItem
                label="Temperature"
                value={`${reading.temperature}°C`}
                isAlert={reading.temperature < 36 || reading.temperature > 38}
                isWarning={reading.temperature < 36.5 || reading.temperature > 37.5}
              />
              <MetricItem
                label="Heart Rate"
                value={`${reading.heart_rate} BPM`}
                isAlert={reading.heart_rate < 50 || reading.heart_rate > 120}
                isWarning={reading.heart_rate < 60 || reading.heart_rate > 100}
              />
              <MetricItem
                label="Blood Oxygen"
                value={`${reading.blood_oxygen}%`}
                isAlert={reading.blood_oxygen < 90}
                isWarning={reading.blood_oxygen < 95}
              />
            </div>
          </div>

          <CollapsibleContent>
            <div className="p-4 border-t">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <MetricItem
                  label="Hydration"
                  value={`${reading.hydration}%`}
                  isAlert={reading.hydration < 60}
                  isWarning={reading.hydration < 70}
                />
                <MetricItem
                  label="Respiration"
                  value={`${reading.respiration} breaths/min`}
                  isAlert={reading.respiration < 10 || reading.respiration > 25}
                  isWarning={reading.respiration < 12 || reading.respiration > 20}
                />
                <MetricItem
                  label="Fatigue"
                  value={`${reading.fatigue}/100`}
                  isAlert={reading.fatigue > 50}
                  isWarning={reading.fatigue > 30}
                />
              </div>

              {reading.ai_analysis && (
                <div>
                  <div className="font-medium mb-2">AI Analysis</div>
                  {reading.ai_analysis.summary && (
                    <p className="text-sm text-muted-foreground mb-2">{reading.ai_analysis.summary}</p>
                  )}

                  {reading.ai_analysis.potential_issues && reading.ai_analysis.potential_issues.length > 0 && (
                    <div className="mb-2">
                      <div className="text-sm font-medium">Potential Issues:</div>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {reading.ai_analysis.potential_issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {reading.ai_analysis.priority_action && (
                    <div
                      className={`mt-2 text-sm font-medium ${
                        reading.state === "alert"
                          ? "text-red-600"
                          : reading.state === "warning"
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}
                    >
                      Priority Action: {reading.ai_analysis.priority_action}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
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
