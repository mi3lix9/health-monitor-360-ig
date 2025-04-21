"use client"

import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Activity, AlertTriangle, CheckCircle, Info, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type LogEntry = {
  id: string
  timestamp: string
  message: string
  type: "info" | "success" | "warning" | "error" | "system"
}

export function TestingLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])

  // Load logs from localStorage on mount
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem("testingLogs")
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs))
      }
    } catch (error) {
      console.error("Error loading logs from localStorage:", error)
    }

    // Listen for the readings-cleared event
    const handleReadingsCleared = (event: CustomEvent) => {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        message: "All player readings cleared. New match started.",
        type: "system",
      }

      setLogs((prevLogs) => {
        const updatedLogs = [newLog, ...prevLogs].slice(0, 100) // Keep only the last 100 logs
        try {
          localStorage.setItem("testingLogs", JSON.stringify(updatedLogs))
        } catch (error) {
          console.error("Error saving logs to localStorage:", error)
        }
        return updatedLogs
      })
    }

    window.addEventListener("readings-cleared", handleReadingsCleared as EventListener)

    return () => {
      window.removeEventListener("readings-cleared", handleReadingsCleared as EventListener)
    }
  }, [])

  // Listen for new log entries from localStorage
  useEffect(() => {
    const checkForNewLogs = () => {
      try {
        const savedLogs = localStorage.getItem("testingLogs")
        if (savedLogs) {
          const parsedLogs = JSON.parse(savedLogs)
          if (JSON.stringify(parsedLogs) !== JSON.stringify(logs)) {
            setLogs(parsedLogs)
          }
        }
      } catch (error) {
        console.error("Error checking for new logs:", error)
      }
    }

    const interval = setInterval(checkForNewLogs, 1000)
    return () => clearInterval(interval)
  }, [logs])

  const getIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4" />
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "error":
        return <Activity className="h-4 w-4 text-red-500" />
      case "system":
        return <RefreshCw className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getAlertVariant = (type: LogEntry["type"]) => {
    switch (type) {
      case "info":
        return "default"
      case "success":
        return "default"
      case "warning":
        return "default"
      case "error":
        return "destructive"
      case "system":
        return "default"
      default:
        return "default"
    }
  }

  if (logs.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No logs yet. Start generating test data to see logs here.
      </div>
    )
  }

  return (
    <ScrollArea className="h-[400px] w-full rounded-md border">
      <div className="p-4 space-y-2">
        {logs.map((log) => (
          <Alert
            key={log.id}
            variant={getAlertVariant(log.type)}
            className={log.type === "system" ? "border-blue-500 bg-blue-50" : ""}
          >
            <div className="flex items-start">
              <div className="mr-2 mt-0.5">{getIcon(log.type)}</div>
              <AlertDescription className="flex-1">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{log.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </AlertDescription>
            </div>
          </Alert>
        ))}
      </div>
    </ScrollArea>
  )
}
