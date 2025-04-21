"use client"

import { usePlayersWithReadings } from "@/lib/react-query-hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

export function PlayerStatusDistribution() {
  const { data: players, isLoading } = usePlayersWithReadings()

  if (isLoading) {
    return <Skeleton className="h-full w-full" />
  }

  if (!players || players.length === 0) {
    return <div className="flex h-full items-center justify-center">No data available</div>
  }

  // Count players by status
  const normalCount = players.filter((p) => p.latest_reading?.state === "normal").length
  const warningCount = players.filter((p) => p.latest_reading?.state === "warning").length
  const alertCount = players.filter((p) => p.latest_reading?.state === "alert").length
  const noReadingCount = players.filter((p) => !p.latest_reading).length

  const data = [
    { name: "Normal", value: normalCount, color: "#10b981" },
    { name: "Warning", value: warningCount, color: "#f59e0b" },
    { name: "Alert", value: alertCount, color: "#ef4444" },
    { name: "No Readings", value: noReadingCount, color: "#6b7280" },
  ]

  // Filter out zero values
  const filteredData = data.filter((item) => item.value > 0)

  if (filteredData.length === 0) {
    return <div className="flex h-full items-center justify-center">No health readings available</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {filteredData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} players`, ""]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
