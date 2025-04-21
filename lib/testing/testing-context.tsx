"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from "react"

// Define the types for our context
export type TestingMode = "production" | "testing"

export type DataGenerationOptions = {
  interval: number // in milliseconds
  playerIds: string[]
  anomalyFrequency: number // 0-1
  anomalySeverity: "low" | "medium" | "high"
}

type LogEntry = {
  id: string
  timestamp: Date
  message: string
  type: "info" | "success" | "warning" | "error" | "system"
  data?: any
}

type TestingContextType = {
  mode: TestingMode
  setMode: (mode: TestingMode) => void
  isGeneratingData: boolean
  startDataGeneration: (options: DataGenerationOptions) => void
  stopDataGeneration: () => void
  dataGenerationOptions: DataGenerationOptions
  setDataGenerationOptions: (options: DataGenerationOptions) => void
  testingLogs: LogEntry[]
  addTestingLog: (log: LogEntry) => void
  clearTestingLogs: () => void
  clearAllReadings: () => Promise<boolean>
}

// Create the context
const TestingContext = createContext<TestingContextType | undefined>(undefined)

// Default options for data generation
const defaultDataGenerationOptions: DataGenerationOptions = {
  interval: 5000, // 5 seconds
  playerIds: [],
  anomalyFrequency: 0.2, // 20%
  anomalySeverity: "medium",
}

// Provider component
export function TestingProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TestingMode>("production")
  const [isGeneratingData, setIsGeneratingData] = useState(false)
  const [dataGenerationOptions, setDataGenerationOptions] =
    useState<DataGenerationOptions>(defaultDataGenerationOptions)
  const [testingLogs, setTestingLogs] = useState<LogEntry[]>([])

  // Start data generation
  const startDataGeneration = useCallback((options: DataGenerationOptions) => {
    setIsGeneratingData(true)
    setDataGenerationOptions(options)
    addTestingLog({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      message: "Started data generation",
      type: "info",
      data: { options },
    })
  }, [])

  // Stop data generation
  const stopDataGeneration = useCallback(() => {
    setIsGeneratingData(false)
    addTestingLog({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      message: "Stopped data generation",
      type: "info",
    })
  }, [])

  // Add a log entry
  const addTestingLog = useCallback((log: LogEntry) => {
    setTestingLogs((prev) => [...prev, log])
  }, [])

  // Clear all logs
  const clearTestingLogs = useCallback(() => {
    setTestingLogs([])
    addTestingLog({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      message: "Cleared all logs",
      type: "system",
    })
  }, [addTestingLog])

  // Clear all readings (New Match)
  const clearAllReadings = useCallback(async () => {
    try {
      const response = await fetch("/api/testing/clear-readings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to clear readings")
      }

      // Trigger a localStorage event to notify other components
      localStorage.setItem("clearReadings", Date.now().toString())

      addTestingLog({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        message: "New match started - All readings cleared",
        type: "system",
        data: { action: "clear-readings" },
      })

      return true
    } catch (error) {
      console.error("Error clearing readings:", error)
      addTestingLog({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        message: `Error clearing readings: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: "error",
      })
      return false
    }
  }, [addTestingLog])

  // Reset to production mode when component unmounts
  useEffect(() => {
    return () => {
      if (isGeneratingData) {
        stopDataGeneration()
      }
      setMode("production")
    }
  }, [isGeneratingData, stopDataGeneration])

  return (
    <TestingContext.Provider
      value={{
        mode,
        setMode,
        isGeneratingData,
        startDataGeneration,
        stopDataGeneration,
        dataGenerationOptions,
        setDataGenerationOptions,
        testingLogs,
        addTestingLog,
        clearTestingLogs,
        clearAllReadings,
      }}
    >
      {children}
    </TestingContext.Provider>
  )
}

// Custom hook to use the testing context
export function useTesting() {
  const context = useContext(TestingContext)
  if (context === undefined) {
    throw new Error("useTesting must be used within a TestingProvider")
  }
  return context
}
