import { processRetryQueue } from "@/lib/retry-queue-service"

// Process interval in milliseconds (default: 30 seconds - reduced from 1 minute)
const PROCESS_INTERVAL = 30 * 1000

// Batch size for processing
const BATCH_SIZE = 3 // Reduced from 5 to process fewer items at once but more frequently

// Flag to prevent overlapping executions
let isProcessing = false

// Start the background worker
export function startBackgroundWorker() {
  console.log("Starting background worker for AI analysis retry queue")

  // Process immediately on startup
  processQueue()

  // Set up interval for regular processing
  const intervalId = setInterval(processQueue, PROCESS_INTERVAL)

  // Return a function to stop the worker
  return () => {
    console.log("Stopping background worker")
    clearInterval(intervalId)
  }
}

// Process the queue
async function processQueue() {
  // Prevent overlapping executions
  if (isProcessing) {
    return
  }

  try {
    isProcessing = true

    // Process the queue
    const result = await processRetryQueue(BATCH_SIZE)

    // Log results if any items were processed
    if (result.processed > 0) {
      console.log(
        `Processed ${result.processed} retry queue items: ${result.succeeded} succeeded, ${result.failed} failed`,
      )
    }
  } catch (error) {
    console.error("Error processing retry queue:", error)
  } finally {
    isProcessing = false
  }
}
