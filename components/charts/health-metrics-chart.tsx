"use client"

import { useRecentReadings } from "@/lib/react-query-hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { format, parseISO } from "date-fns"

export function HealthMetricsChart() {
  const { data: readings, isLoading } = useRecentReadings(50)

  if (isLoading) {
    return <Skeleton className="h-full w-full" />
  }

  if (!readings || readings.length === 0) {
    return <div className="flex h-full items-center justify-center">No data available</div>
  }

  // Sort readings by timestamp
  const sortedReadings = [...readings].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // Format data for the chart
  const data = sortedReadings.map((reading) => ({
    timestamp: reading.timestamp,
    heart_rate: reading.heart_rate,
    hydration: reading.hydration,
    fatigue: reading.fatigue,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(timestamp) => format(parseISO(timestamp), "HH:mm")}
          label={{ value: "Time", position: "insideBottomRight", offset: -5 }}
        />
        <YAxis />
        <Tooltip
          labelFormatter={(timestamp) => format(parseISO(timestamp), "PPpp")}
          formatter={(value, name) => {
            if (name === "heart_rate") return [`${value} BPM`, "Heart Rate"]
            if (name === "hydration") return [`${value}%`, "Hydration"]
            if (name === "fatigue") return [`${value}%`, "Fatigue"]
            return [value, name]
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="heart_rate" stroke="#ef4444" activeDot={{ r: 8 }} name="Heart Rate" />
        <Line type="monotone" dataKey="hydration" stroke="#3b82f6" name="Hydration" />
        <Line type="monotone" dataKey="fatigue" stroke="#f59e0b" name="Fatigue" />
      </LineChart>
    </ResponsiveContainer>
  )
}
