"use client"

import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { HealthReading } from "@/types"

type PlayerHealthChartProps = {
  readings: HealthReading[]
}

export function PlayerHealthChart({ readings }: PlayerHealthChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>("heart_rate")

  const metrics = [
    { id: "heart_rate", name: "Heart Rate", color: "#ef4444", unit: "BPM" },
    { id: "temperature", name: "Temperature", color: "#f59e0b", unit: "°C" },
    { id: "blood_oxygen", name: "Blood Oxygen", color: "#3b82f6", unit: "%" },
    { id: "hydration", name: "Hydration", color: "#10b981", unit: "%" },
    { id: "respiration", name: "Respiration", color: "#8b5cf6", unit: "breaths/min" },
    { id: "fatigue", name: "Fatigue", color: "#6b7280", unit: "" },
  ]

  if (!readings || readings.length === 0) {
    return <div className="flex items-center justify-center h-full">No data available</div>
  }

  // Sort readings by timestamp (oldest to newest)
  const sortedReadings = [...readings].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // Format data for chart
  const chartData = sortedReadings.map((reading) => ({
    time: reading.timestamp,
    heart_rate: reading.heart_rate,
    temperature: reading.temperature,
    blood_oxygen: reading.blood_oxygen,
    hydration: reading.hydration,
    respiration: reading.respiration,
    fatigue: reading.fatigue,
    state: reading.state,
  }))

  const selectedMetricInfo = metrics.find((m) => m.id === selectedMetric)

  // Format time for display
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap gap-2 mb-4">
        {metrics.map((metric) => (
          <button
            key={metric.id}
            onClick={() => setSelectedMetric(metric.id)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedMetric === metric.id
                ? `bg-${metric.color.replace("#", "")} text-white`
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
            style={{
              backgroundColor: selectedMetric === metric.id ? metric.color : undefined,
              color: selectedMetric === metric.id ? "white" : undefined,
            }}
          >
            {metric.name}
          </button>
        ))}
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke="var(--chart-grid-color, #e5e7eb)" />
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              tick={{ fontSize: 12 }}
              stroke="var(--chart-axis-color, currentColor)"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              domain={["auto", "auto"]}
              label={{
                value: selectedMetricInfo?.unit,
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "var(--chart-text-color, currentColor)" },
              }}
              stroke="var(--chart-axis-color, currentColor)"
            />
            <Tooltip
              formatter={(value) => [`${value} ${selectedMetricInfo?.unit}`, selectedMetricInfo?.name]}
              labelFormatter={(label) => new Date(label).toLocaleString()}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                backgroundColor: "var(--chart-tooltip-bg, white)",
                color: "var(--chart-tooltip-color, black)",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke={selectedMetricInfo?.color}
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props
                const state = payload.state

                return (
                  <svg x={cx - 6} y={cy - 6} width={12} height={12} fill="white" viewBox="0 0 12 12">
                    <circle
                      cx="6"
                      cy="6"
                      r="5"
                      stroke={state === "alert" ? "#ef4444" : state === "warning" ? "#f59e0b" : "#10b981"}
                      strokeWidth="2"
                      fill="var(--chart-dot-fill, white)"
                    />
                  </svg>
                )
              }}
              activeDot={{ r: 6 }}
              name={selectedMetricInfo?.name}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
