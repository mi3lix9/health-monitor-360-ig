import { generateMockReadingsBatch } from "./mock-data-generator"
import type { DataGenerationOptions } from "./testing-context"

// Send a single mock reading to the API
export async function sendMockReading(reading: any): Promise<Response> {
  try {
    const response = await fetch("/api/readings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Testing-Mode": "true", // Add a header to identify test requests
      },
      body: JSON.stringify(reading),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error("API error:", errorData)
    }

    return response
  } catch (error) {
    console.error("Error sending mock reading:", error)
    throw error
  }
}

// Send a batch of mock readings to the API
export async function sendMockReadingsBatch(options: DataGenerationOptions): Promise<Response[]> {
  try {
    const mockReadings = generateMockReadingsBatch(options)

    // For 1-second intervals, reduce the delay between requests to avoid backing up
    const delayBetweenRequests = options.interval <= 1000 ? 50 : 200

    // Send each reading with a small delay to avoid overwhelming the API
    const promises = mockReadings.map((reading, index) => {
      return new Promise<Response>((resolve, reject) => {
        setTimeout(async () => {
          try {
            const response = await sendMockReading(reading)
            resolve(response)
          } catch (error) {
            console.error(`Error sending reading for batch item ${index}:`, error)
            // Create a mock response to avoid breaking the batch
            const mockResponse = new Response(JSON.stringify({ error: "Failed to send reading" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            })
            resolve(mockResponse)
          }
        }, index * delayBetweenRequests) // Reduced delay for faster intervals
      })
    })

    return await Promise.all(promises)
  } catch (error) {
    console.error("Error sending mock readings batch:", error)
    return [] // Return empty array instead of throwing
  }
}

// Start automatic data generation
export function startAutomaticDataGeneration(
  options: DataGenerationOptions,
  onSuccess?: (results: Response[]) => void,
  onError?: (error: Error) => void,
): NodeJS.Timeout {
  // Send initial batch immediately
  sendMockReadingsBatch(options)
    .then((results) => {
      if (onSuccess && results.length > 0) onSuccess(results)
    })
    .catch((error) => {
      console.error("Error in initial batch:", error)
      if (onError) onError(error instanceof Error ? error : new Error(String(error)))
    })

  // Set up interval for subsequent batches
  return setInterval(() => {
    sendMockReadingsBatch(options)
      .then((results) => {
        if (onSuccess && results.length > 0) onSuccess(results)
      })
      .catch((error) => {
        console.error("Error in interval batch:", error)
        if (onError) onError(error instanceof Error ? error : new Error(String(error)))
      })
  }, options.interval)
}
