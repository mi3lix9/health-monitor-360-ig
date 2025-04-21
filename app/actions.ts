"use server"

import { getServerClient } from "@/lib/supabase"
import { analyzePlayerHealth } from "@/lib/ai-analysis"
import type { Player, HealthReading, PlayerWithLatestReading } from "@/types"
import { revalidatePath } from "next/cache"

// Get all players with their latest health reading
export async function getAllPlayersWithLatestReadings(): Promise<PlayerWithLatestReading[]> {
  try {
    const supabase = getServerClient()

    // Get all players with improved error handling
    const { data: players, error: playersError } = await supabase.from("players").select("*").order("name")

    if (playersError) {
      console.error("Error fetching players:", playersError)
      return []
    }

    if (!players || !Array.isArray(players)) {
      console.error("Invalid players data returned:", players)
      return []
    }

    // For each player, get their latest health reading
    const playersWithReadings: PlayerWithLatestReading[] = await Promise.all(
      players.map(async (player) => {
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
            return { ...player }
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

    return playersWithReadings
  } catch (error) {
    console.error("Unexpected error in getAllPlayersWithLatestReadings:", error)
    return []
  }
}

// Get a single player by ID with all their health readings
export async function getPlayerWithReadings(playerId: string) {
  const supabase = getServerClient()

  // Get the player
  const { data: player, error: playerError } = await supabase.from("players").select("*").eq("id", playerId).single()

  if (playerError) {
    console.error("Error fetching player:", playerError)
    return null
  }

  // Get all readings for the player
  const { data: readings, error: readingsError } = await supabase
    .from("health_readings")
    .select("*")
    .eq("player_id", playerId)
    .order("timestamp", { ascending: false })

  if (readingsError) {
    console.error("Error fetching readings:", readingsError)
    return { player, readings: [] }
  }

  return { player, readings }
}

// Add a new health reading for a player
export async function addHealthReading(
  playerId: string,
  reading: Omit<HealthReading, "id" | "player_id" | "timestamp" | "created_at" | "ai_analysis" | "state">,
) {
  const supabase = getServerClient()

  // Get player info for analysis
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("name, position")
    .eq("id", playerId)
    .single()

  if (playerError) {
    console.error("Error fetching player for analysis:", playerError)
    return { success: false, error: "Player not found" }
  }

  // Determine the state based on readings
  let state: "normal" | "warning" | "alert" = "normal"

  // Simple rules for state determination
  if (
    reading.temperature < 36 ||
    reading.temperature > 38 ||
    reading.heart_rate < 50 ||
    reading.heart_rate > 120 ||
    reading.blood_oxygen < 90 ||
    reading.hydration < 60 ||
    reading.respiration < 10 ||
    reading.respiration > 25 ||
    reading.fatigue > 50
  ) {
    state = "alert"
  } else if (
    reading.temperature < 36.5 ||
    reading.temperature > 37.5 ||
    reading.heart_rate < 60 ||
    reading.heart_rate > 100 ||
    reading.blood_oxygen < 95 ||
    reading.hydration < 70 ||
    reading.respiration < 12 ||
    reading.respiration > 20 ||
    reading.fatigue > 30
  ) {
    state = "warning"
  }

  // Prepare the reading with state
  const readingWithState = {
    ...reading,
    player_id: playerId,
    state,
  }

  // Insert the reading - this is the most important part and should happen regardless of AI analysis
  const { data, error } = await supabase.from("health_readings").insert([readingWithState]).select().single()

  if (error) {
    console.error("Error adding health reading:", error)
    return { success: false, error: error.message }
  }

  // Revalidate paths to update the UI - do this early to ensure UI updates even if analysis fails
  revalidatePath("/")
  revalidatePath(`/players`)
  revalidatePath(`/players/${playerId}`)

  // Try to perform AI analysis in a non-blocking way
  let aiAnalysis = null
  try {
    // Run AI analysis with a timeout to prevent long-running requests
    const analysisPromise = analyzePlayerHealth(data, player)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("AI analysis timeout")), 5000) // 5 second timeout
    })

    aiAnalysis = (await Promise.race([analysisPromise, timeoutPromise])) as any

    // If we got analysis, update the reading - but don't let this block the response
    if (aiAnalysis) {
      try {
        const { error: updateError } = await supabase
          .from("health_readings")
          .update({ ai_analysis: aiAnalysis })
          .eq("id", data.id)

        if (updateError) {
          console.error("Error updating reading with analysis:", updateError)
        }
      } catch (updateError) {
        console.error("Error updating reading with analysis:", updateError)
        // Continue even if update fails
      }
    }
  } catch (analysisError) {
    console.error("Error in analysis:", analysisError)
    // Continue without analysis if it fails
  }

  // Return the reading data regardless of whether analysis succeeded
  return { success: true, data: { ...data, ai_analysis: aiAnalysis } }
}

// Add a new player
export async function addPlayer(player: Omit<Player, "id" | "created_at" | "updated_at">) {
  const supabase = getServerClient()

  const { data, error } = await supabase.from("players").insert([player]).select()

  if (error) {
    console.error("Error adding player:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/")
  revalidatePath("/players")

  return { success: true, data }
}
