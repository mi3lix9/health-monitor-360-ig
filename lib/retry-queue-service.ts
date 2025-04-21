import { getServerClient } from "@/lib/supabase"
import { analyzePlayerHealth } from "@/lib/ai-analysis"
import type { RetryQueueStats } from "@/types"

// Add a failed analysis to the retry queue
export async function addToRetryQueue(readingId: string, playerId: string, error: Error | string) {
  try {
    const supabase = getServerClient()
    const errorMessage = error instanceof Error ? error.message : error

    // Check if this reading is already in the queue
    try {
      const { data: existing, error: existingError } = await supabase
        .from("analysis_retry_queue")
        .select("id")
        .eq("reading_id", readingId)
        .single()

      if (existingError && existingError.code !== "PGRST116") {
        // Log error but continue - we'll try to insert a new entry
        console.error("Error checking for existing retry queue entry:", existingError)
      }

      if (existing) {
        // Update the existing entry
        try {
          await supabase
            .from("analysis_retry_queue")
            .update({
              last_error: errorMessage,
              next_retry_at: calculateNextRetryTime(0), // Reset retry time
              status: "pending",
            })
            .eq("id", existing.id)

          return existing.id
        } catch (updateError) {
          console.error("Error updating retry queue entry:", updateError)
          // Continue to try inserting a new entry as fallback
        }
      }
    } catch (checkError) {
      console.error("Error checking for existing retry queue entry:", checkError)
      // Continue to try inserting a new entry
    }

    // Create a new entry
    try {
      const { data, error: insertError } = await supabase
        .from("analysis_retry_queue")
        .insert([
          {
            reading_id: readingId,
            player_id: playerId,
            last_error: errorMessage,
            next_retry_at: calculateNextRetryTime(0),
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error("Error adding to retry queue:", insertError)
        return null
      }

      return data.id
    } catch (insertError) {
      console.error("Error inserting retry queue entry:", insertError)
      return null
    }
  } catch (error) {
    console.error("Error in addToRetryQueue:", error)
    return null
  }
}

// Process the next batch of retry items
export async function processRetryQueue(batchSize = 5) {
  try {
    const supabase = getServerClient()
    const now = new Date().toISOString()

    // Get the next batch of items to process
    let items
    try {
      const { data, error: fetchError } = await supabase
        .from("analysis_retry_queue")
        .select("*")
        .eq("status", "pending")
        .lte("next_retry_at", now)
        .order("next_retry_at", { ascending: true })
        .limit(batchSize)

      if (fetchError) {
        console.error("Error fetching retry queue items:", fetchError)
        return { processed: 0, succeeded: 0, failed: 0 }
      }

      items = data || []
    } catch (fetchError) {
      console.error("Error fetching retry queue items:", fetchError)
      return { processed: 0, succeeded: 0, failed: 0 }
    }

    if (!items || items.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0 }
    }

    let succeeded = 0
    let failed = 0

    // Process each item
    for (const item of items) {
      // Mark as processing
      try {
        await supabase.from("analysis_retry_queue").update({ status: "processing" }).eq("id", item.id)
      } catch (updateError) {
        console.error(`Error updating retry queue item ${item.id} to processing:`, updateError)
        // Continue with processing anyway
      }

      try {
        // Get the reading data
        let reading
        try {
          const { data, error: readingError } = await supabase
            .from("health_readings")
            .select("*")
            .eq("id", item.reading_id)
            .single()

          if (readingError) {
            throw new Error(`Reading not found: ${readingError.message}`)
          }

          reading = data
        } catch (readingError) {
          throw new Error(
            `Failed to fetch reading: ${readingError instanceof Error ? readingError.message : String(readingError)}`,
          )
        }

        // Get the player data
        let player
        try {
          const { data, error: playerError } = await supabase
            .from("players")
            .select("name, position")
            .eq("id", item.player_id)
            .single()

          if (playerError) {
            throw new Error(`Player not found: ${playerError.message}`)
          }

          player = data
        } catch (playerError) {
          // If we can't get player data, use a default
          console.error(`Failed to fetch player data for retry item ${item.id}:`, playerError)
          player = { name: "Unknown Player", position: "Unknown Position" }
        }

        // Perform the analysis with a longer timeout since this is a background process
        const analysis = await analyzePlayerHealth(reading, player)

        // Update the reading with the analysis
        try {
          const { error: updateError } = await supabase
            .from("health_readings")
            .update({ ai_analysis: analysis })
            .eq("id", item.reading_id)

          if (updateError) {
            throw new Error(`Failed to update reading: ${updateError.message}`)
          }
        } catch (updateError) {
          throw new Error(
            `Failed to update reading: ${updateError instanceof Error ? updateError.message : String(updateError)}`,
          )
        }

        // Mark as completed
        try {
          await supabase.from("analysis_retry_queue").update({ status: "completed" }).eq("id", item.id)
        } catch (updateError) {
          console.error(`Error updating retry queue item ${item.id} to completed:`, updateError)
          // Continue anyway since the analysis was successful
        }

        succeeded++
      } catch (error) {
        // Increment attempts and update next retry time
        const newAttempts = item.attempts + 1
        const errorMessage = error instanceof Error ? error.message : String(error)

        try {
          // Check if we've reached max attempts
          if (newAttempts >= item.max_attempts) {
            await supabase
              .from("analysis_retry_queue")
              .update({
                attempts: newAttempts,
                last_error: errorMessage,
                status: "failed",
              })
              .eq("id", item.id)
          } else {
            // Schedule next retry
            await supabase
              .from("analysis_retry_queue")
              .update({
                attempts: newAttempts,
                last_error: errorMessage,
                status: "pending",
                next_retry_at: calculateNextRetryTime(newAttempts),
              })
              .eq("id", item.id)
          }
        } catch (updateError) {
          console.error(`Error updating retry queue item ${item.id} after failure:`, updateError)
          // Continue to next item
        }

        failed++
        console.error(`Retry failed for item ${item.id}:`, error)
      }
    }

    return { processed: items.length, succeeded, failed }
  } catch (error) {
    console.error("Error in processRetryQueue:", error)
    return { processed: 0, succeeded: 0, failed: 0 }
  }
}

// Get retry queue statistics
export async function getRetryQueueStats(): Promise<RetryQueueStats> {
  try {
    const supabase = getServerClient()

    // Get counts for each status
    const { data: pendingData, error: pendingError } = await supabase
      .from("analysis_retry_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")

    if (pendingError) {
      console.error("Error fetching pending count:", pendingError)
    }

    const { data: processingData, error: processingError } = await supabase
      .from("analysis_retry_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "processing")

    if (processingError) {
      console.error("Error fetching processing count:", processingError)
    }

    const { data: completedData, error: completedError } = await supabase
      .from("analysis_retry_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")

    if (completedError) {
      console.error("Error fetching completed count:", completedError)
    }

    const { data: failedData, error: failedError } = await supabase
      .from("analysis_retry_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")

    if (failedError) {
      console.error("Error fetching failed count:", failedError)
    }

    const { data: totalData, error: totalError } = await supabase
      .from("analysis_retry_queue")
      .select("id", { count: "exact", head: true })

    if (totalError) {
      console.error("Error fetching total count:", totalError)
    }

    return {
      pending: pendingData?.count || 0,
      processing: processingData?.count || 0,
      completed: completedData?.count || 0,
      failed: failedData?.count || 0,
      total: totalData?.count || 0,
    }
  } catch (error) {
    console.error("Error in getRetryQueueStats:", error)
    return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 }
  }
}

// Get retry queue items with pagination
export async function getRetryQueueItems(
  status: "pending" | "processing" | "completed" | "failed" | "all" = "all",
  page = 1,
  pageSize = 10,
) {
  try {
    const supabase = getServerClient()
    let query = supabase.from("analysis_retry_queue").select("*", { count: "exact" })

    // Apply status filter if not "all"
    if (status !== "all") {
      query = query.eq("status", status)
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, count, error } = await query.order("updated_at", { ascending: false }).range(from, to)

    if (error) {
      console.error("Error fetching retry queue items:", error)
      return { items: [], count: 0 }
    }

    return { items: data || [], count: count || 0 }
  } catch (error) {
    console.error("Error in getRetryQueueItems:", error)
    return { items: [], count: 0 }
  }
}

// Reset a failed item to pending
export async function resetRetryQueueItem(id: number) {
  try {
    const supabase = getServerClient()

    const { error } = await supabase
      .from("analysis_retry_queue")
      .update({
        attempts: 0,
        status: "pending",
        next_retry_at: calculateNextRetryTime(0),
      })
      .eq("id", id)

    if (error) {
      console.error("Error resetting retry queue item:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in resetRetryQueueItem:", error)
    return false
  }
}

// Delete a retry queue item
export async function deleteRetryQueueItem(id: number) {
  try {
    const supabase = getServerClient()

    const { error } = await supabase.from("analysis_retry_queue").delete().eq("id", id)

    if (error) {
      console.error("Error deleting retry queue item:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteRetryQueueItem:", error)
    return false
  }
}

// Calculate exponential backoff for retries
function calculateNextRetryTime(attempts: number): string {
  // Exponential backoff: 15s, 1m, 4m, 16m, etc. (reduced from 30s base)
  const delayInSeconds = Math.pow(4, attempts) * 15
  const maxDelayInSeconds = 24 * 60 * 60 // Max 24 hours
  const actualDelayInSeconds = Math.min(delayInSeconds, maxDelayInSeconds)

  const date = new Date()
  date.setSeconds(date.getSeconds() + actualDelayInSeconds)

  return date.toISOString()
}
