"use client"

import { useRecentReadings } from "@/lib/react-query-hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format, subDays, startOfDay, endOfDay } from "date-fns"

export function AlertsOverTimeChart() {
  const { data: readings, isLoading } = useRecentReadings(100)

  if (isLoading) {
    return <Skeleton className="h-full w-full" />
  }

  if (!readings || readings.length === 0) {
    return <div className="flex h-full items-center justify-center">No data available</div>
  }

  // Get the last 7 days
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, i)
    return {
      date,
      day: format(date, "EEE"),
      alerts: 0,
      warnings: 0,
    }
  }).reverse()

  // Count alerts and warnings for each day
  readings.forEach((reading) => {
    const readingDate = new Date(reading.timestamp)
    days.forEach((day) => {
      if (readingDate >= startOfDay(day.date) && readingDate <= endOfDay(day.date)) {
        if (reading.state === "alert") {
          day.alerts++
        } else if (reading.state === "warning") {
          day.warnings++
        }
      }
    })
  })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={days} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis allowDecimals={false} />
        <Tooltip
          formatter={(value, name) => [value, name === "alerts" ? "Alerts" : "Warnings"]}
          labelFormatter={(label) => `Day: ${label}`}
        />
        <Bar dataKey="warnings" stackId="a" fill="#f59e0b" name="Warnings" />
        <Bar dataKey="alerts" stackId="a" fill="#ef4444" name="Alerts" />
      </BarChart>
    </ResponsiveContainer>
  )
}
