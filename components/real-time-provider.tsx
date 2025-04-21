"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { getBrowserClient } from "@/lib/supabase"
import type { HealthReading, Player, PlayerWithLatestReading } from "@/types"
import { useToast } from "@/components/ui/use-toast"
import { useTesting } from "@/lib/testing/testing-context"

type RealtimeContextType = {
  players: PlayerWithLatestReading[]
  playerReadings: Record<string, HealthReading[]>
  playerDetails: Record<string, Player>
  loading: boolean
  refreshData: () => Promise<void>
}

const RealtimeContext = createContext<RealtimeContextType>({
  players: [],
  playerReadings: {},
  playerDetails: {},
  loading: true,
  refreshData: async () => {},
})

export const useRealtime = () => useContext(RealtimeContext)

export function RealtimeProvider({
  children,
  initialPlayers,
}: {
  children: React.ReactNode
  initialPlayers: PlayerWithLatestReading[]
}) {
  const [players, setPlayers] = useState<PlayerWithLatestReading[]>(initialPlayers)
  const [playerReadings, setPlayerReadings] = useState<Record<string, HealthReading[]>>({})
  const [playerDetails, setPlayerDetails] = useState<Record<string, Player>>({})
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { mode } = useTesting()

  // Function to refresh all data
  const refreshData = async () => {
    try {
      const supabase = getBrowserClient()

      // Fetch all players
      const { data: playersData, error: playersError } = await supabase.from("players").select("*").order("name")

      if (playersError) {
        console.error("Error fetching players:", playersError)
        return
      }

      if (!playersData || !Array.isArray(playersData)) {
        console.error("Invalid players data returned:", playersData)
        return
      }

      // Store player details
      const playerDetailsMap: Record<string, Player> = {}
      playersData.forEach((player) => {
        playerDetailsMap[player.id] = player
      })
      setPlayerDetails(playerDetailsMap)

      // For each player, get their latest health reading
      const playersWithReadings: PlayerWithLatestReading[] = await Promise.all(
        playersData.map(async (player) => {
          try {
            const { data: readings, error: readingsError } = await supabase
              .from("health_readings")
              .select("*")
              .eq("player_id", player.id)
              .order("timestamp", { ascending: false })
              .limit(1)

            if (readingsError) {
              console.error(`Error fetching readings for player ${player.id}:`, readingsError)
              return { ...player }
            }

            if (!readings || !Array.isArray(readings) || readings.length === 0) {
              // Also store empty readings for this player
              setPlayerReadings((prev) => ({
                ...prev,
                [player.id]: [],
              }))
              return { ...player }
            }

            // Also store all readings for this player
            try {
              const { data: allReadings, error: allReadingsError } = await supabase
                .from("health_readings")
                .select("*")
                .eq("player_id", player.id)
                .order("timestamp", { ascending: false })
                .limit(10)

              if (!allReadingsError && allReadings && Array.isArray(allReadings)) {
                setPlayerReadings((prev) => ({
                  ...prev,
                  [player.id]: allReadings,
                }))
              }
            } catch (readingsError) {
              console.error(`Error fetching all readings for player ${player.id}:`, readingsError)
              // Continue with just the latest reading
            }

            return {
              ...player,
              latest_reading: readings[0],
            }
          } catch (readingError) {
            console.error(`Error processing readings for player ${player.id}:`, readingError)
            return { ...player }
          }
        }),
      )

      setPlayers(playersWithReadings)
      setLoading(false)
    } catch (error) {
      console.error("Error refreshing data:", error)
      setLoading(false)
    }
  }

  // Initial data load
  useEffect(() => {
    refreshData()
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    const supabase = getBrowserClient()

    // Subscribe to changes in the health_readings table
    const healthReadingsSubscription = supabase
      .channel("health_readings_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "health_readings",
        },
        async (payload) => {
          const newReading = payload.new as HealthReading

          // Find the player this reading belongs to
          const playerIndex = players.findIndex((p) => p.id === newReading.player_id)

          if (playerIndex !== -1) {
            // Update the player's latest reading
            const updatedPlayers = [...players]
            updatedPlayers[playerIndex] = {
              ...updatedPlayers[playerIndex],
              latest_reading: newReading,
            }
            setPlayers(updatedPlayers)

            // Update the player's readings list
            setPlayerReadings((prev) => {
              const currentReadings = prev[newReading.player_id] || []
              return {
                ...prev,
                [newReading.player_id]: [newReading, ...currentReadings].slice(0, 10),
              }
            })

            // Show a toast notification for alert states
            if (newReading.state === "alert") {
              toast({
                title: "Alert: Player Health Issue",
                description: `${updatedPlayers[playerIndex].name} has a health reading in ALERT state!`,
                variant: "destructive",
              })
            } else if (newReading.state === "warning") {
              toast({
                title: "Warning: Player Health Issue",
                description: `${updatedPlayers[playerIndex].name} has a health reading in WARNING state.`,
                variant: "default",
              })
            }
          } else {
            // If we don't have this player in our state, refresh all data
            refreshData()
          }
        },
      )
      .subscribe()

    // Subscribe to changes in the players table
    const playersSubscription = supabase
      .channel("players_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
        },
        (payload) => {
          // Refresh all data when there's a change to players
          refreshData()
        },
      )
      .subscribe()

    // Set up a periodic refresh for testing mode
    let refreshInterval: NodeJS.Timeout | null = null
    if (mode === "testing") {
      refreshInterval = setInterval(() => {
        refreshData()
      }, 10000) // Refresh every 10 seconds in testing mode
    }

    return () => {
      supabase.removeChannel(healthReadingsSubscription)
      supabase.removeChannel(playersSubscription)
      if (refreshInterval) clearInterval(refreshInterval)
    }
  }, [toast, players, mode])

  return (
    <RealtimeContext.Provider value={{ players, playerReadings, playerDetails, loading, refreshData }}>
      {children}
    </RealtimeContext.Provider>
  )
}
