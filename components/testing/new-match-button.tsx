"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/use-toast"

export function NewMatchButton({ onSuccess }: { onSuccess?: () => void }) {
  const [isClearing, setIsClearing] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const clearAllReadings = async () => {
    if (isClearing) return

    try {
      setIsClearing(true)

      const response = await fetch("/api/testing/clear-readings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to clear readings")
      }

      // Invalidate all queries to refresh data
      await queryClient.invalidateQueries()

      toast({
        title: "Success",
        description: "All player readings have been cleared. Ready for a new match!",
        variant: "default",
      })

      // Dispatch a custom event that other components can listen for
      const event = new CustomEvent("readings-cleared", {
        detail: { timestamp: new Date().toISOString() },
      })
      window.dispatchEvent(event)

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error clearing readings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clear readings",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <Button
      onClick={clearAllReadings}
      disabled={isClearing}
      variant="default"
      className="w-full bg-green-600 hover:bg-green-700 text-white"
    >
      {isClearing ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Clearing...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Start New Match
        </>
      )}
    </Button>
  )
}
