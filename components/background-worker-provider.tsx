"use client"

import type React from "react"

import { useEffect } from "react"
import { startBackgroundWorker } from "@/lib/background-worker"

export function BackgroundWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Start the background worker
    const stopWorker = startBackgroundWorker()

    // Clean up on unmount
    return () => {
      stopWorker()
    }
  }, [])

  return <>{children}</>
}
