"use client"

import { useState, useEffect } from "react"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from "recharts"
import { getBrowserClient } from "@/lib/supabase"

export function TeamPerformanceChart() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const supabase = getBrowserClient()

        // Fetch the latest reading for each player
        const { data: readings, error } = await supabase
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
            players (
              position
            )
          `)
          .order("timestamp", { ascending: false })

        if (error) {
          console.error("Error fetching health data:", error)
          return
        }

        // Group by player and take the latest reading
        const latestReadingsByPlayer = new Map()
        readings.forEach((reading) => {
          if (!latestReadingsByPlayer.has(reading.player_id)) {
            latestReadingsByPlayer.set(reading.player_id, reading)
          }
        })

        // Group by position
        const positionData: Record<string, any> = {}

        latestReadingsByPlayer.forEach((reading) => {
          const position = reading.players?.position || "Unknown"

          if (!positionData[position]) {
            positionData[position] = {
              position,
              temperature: 0,
              heart_rate: 0,
              blood_oxygen: 0,
              hydration: 0,
              respiration: 0,
              fatigue: 0,
              count: 0,
            }
          }

          // Sum values for averaging later
          positionData[position].temperature += reading.temperature
          positionData[position].heart_rate += reading.heart_rate
          positionData[position].blood_oxygen += reading.blood_oxygen
          positionData[position].hydration += reading.hydration
          positionData[position].respiration += reading.respiration
          positionData[position].fatigue += reading.fatigue
          positionData[position].count++
        })

        // Calculate averages and normalize values to 0-100 scale
        const chartData = Object.values(positionData).map((posData) => {
          const count = posData.count

          // Normalize values to 0-100 scale
          const normalizedTemp = normalizeValue(posData.temperature / count, 35, 40, 100, 0)
          const normalizedHR = normalizeValue(posData.heart_rate / count, 40, 150, 100, 0)
          const normalizedO2 = posData.blood_oxygen / count // Already 0-100
          const normalizedHydration = posData.hydration / count // Already 0-100
          const normalizedResp = normalizeValue(posData.respiration / count, 8, 30, 100, 0)
          const normalizedFatigue = 100 - posData.fatigue / count // Invert so higher is better

          return {
            position: posData.position,
            Temperature: normalizedTemp,
            "Heart Rate": normalizedHR,
            "Blood Oxygen": normalizedO2,
            Hydration: normalizedHydration,
            Respiration: normalizedResp,
            Energy: normalizedFatigue,
          }
        })

        setData(chartData)
      } catch (error) {
        console.error("Error in TeamPerformanceChart:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Normalize a value to a 0-100 scale
  function normalizeValue(value: number, min: number, max: number, targetMax: number, targetMin: number) {
    return Math.round(((value - min) / (max - min)) * (targetMax - targetMin) + targetMin)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading data...</div>
  }

  if (!data.length) {
    return <div className="flex items-center justify-center h-full">No data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart outerRadius={90} data={data}>
        <PolarGrid stroke="var(--chart-grid-color, #e5e7eb)" />
        <PolarAngleAxis dataKey="position" tick={{ fill: "var(--chart-text-color, currentColor)" }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "var(--chart-text-color, currentColor)" }} />
        <Radar name="Temperature" dataKey="Temperature" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
        <Radar name="Heart Rate" dataKey="Heart Rate" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
        <Radar name="Blood Oxygen" dataKey="Blood Oxygen" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
        <Radar name="Hydration" dataKey="Hydration" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
        <Radar name="Respiration" dataKey="Respiration" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
        <Radar name="Energy" dataKey="Energy" stroke="#6b7280" fill="#6b7280" fillOpacity={0.2} />
        <Legend
          formatter={(value) => <span style={{ color: "var(--chart-text-color, currentColor)" }}>{value}</span>}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
