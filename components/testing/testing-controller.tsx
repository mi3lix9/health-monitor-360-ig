"use client"

import { Skeleton } from "@/components/ui/skeleton"

import { useState, useEffect } from "react"
import { useTesting, type DataGenerationOptions } from "@/lib/testing/testing-context"
import { startAutomaticDataGeneration } from "@/lib/testing/data-injection-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Activity, Zap, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { usePlayers } from "@/lib/react-query-hooks"
import { useQueryClient } from "@tanstack/react-query"

export function TestingController() {
  const {
    mode,
    setMode,
    isGeneratingData,
    startDataGeneration,
    stopDataGeneration,
    dataGenerationOptions,
    setDataGenerationOptions,
  } = useTesting()
  const { data: players, isLoading: isPlayersLoading } = usePlayers()
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [interval, setInterval] = useState(dataGenerationOptions.interval / 1000) // Convert to seconds for UI
  const [anomalyFrequency, setAnomalyFrequency] = useState(dataGenerationOptions.anomalyFrequency * 100) // Convert to percentage for UI
  const [anomalySeverity, setAnomalySeverity] = useState<"low" | "medium" | "high">(
    dataGenerationOptions.anomalySeverity,
  )
  const [generationInterval, setGenerationInterval] = useState<NodeJS.Timeout | null>(null)
  const [isClearingReadings, setIsClearingReadings] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Handle mode toggle
  const handleModeToggle = (checked: boolean) => {
    const newMode = checked ? "testing" : "production"
    setMode(newMode)

    // Stop data generation when switching to production mode
    if (newMode === "production" && isGeneratingData) {
      stopDataGeneration()
    }

    toast({
      title: `Switched to ${newMode} mode`,
      description: newMode === "testing" ? "Test data can now be generated" : "Application is now in production mode",
    })
  }

  // Handle player selection
  const handlePlayerSelection = (playerId: string) => {
    setSelectedPlayers((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId)
      } else {
        return [...prev, playerId]
      }
    })
  }

  // Handle select all players
  const handleSelectAllPlayers = () => {
    if (players) {
      if (selectedPlayers.length === players.length) {
        setSelectedPlayers([])
      } else {
        setSelectedPlayers(players.map((player) => player.id))
      }
    }
  }

  // Set interval to 1 second
  const handleSetOneSecondInterval = () => {
    setInterval(1)
  }

  // Handle start data generation
  const handleStartDataGeneration = () => {
    if (selectedPlayers.length === 0) {
      toast({
        title: "No players selected",
        description: "Please select at least one player to generate data for",
        variant: "destructive",
      })
      return
    }

    try {
      const options: DataGenerationOptions = {
        interval: interval * 1000, // Convert back to milliseconds
        playerIds: selectedPlayers,
        anomalyFrequency: anomalyFrequency / 100, // Convert back to decimal
        anomalySeverity,
      }

      // Update context options
      setDataGenerationOptions(options)

      // Start data generation
      const intervalId = startAutomaticDataGeneration(
        options,
        (results) => {
          console.log(`Generated ${results.length} mock readings`)
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["healthStats"] })
          queryClient.invalidateQueries({ queryKey: ["recentReadings"] })
          queryClient.invalidateQueries({ queryKey: ["playersWithReadings"] })
        },
        (error) => {
          console.error("Error generating mock data:", error)
          toast({
            title: "Error generating mock data",
            description: error.message,
            variant: "destructive",
          })
        },
      )

      setGenerationInterval(intervalId)
      startDataGeneration(options)
    } catch (error) {
      console.error("Error starting data generation:", error)
      toast({
        title: "Error starting data generation",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  // Handle stop data generation
  const handleStopDataGeneration = () => {
    try {
      if (generationInterval) {
        clearInterval(generationInterval)
        setGenerationInterval(null)
      }
      stopDataGeneration()
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["healthStats"] })
      queryClient.invalidateQueries({ queryKey: ["recentReadings"] })
      queryClient.invalidateQueries({ queryKey: ["playersWithReadings"] })
    } catch (error) {
      console.error("Error stopping data generation:", error)
    }
  }

  // Handle clear all readings (New Match)
  const handleClearAllReadings = async () => {
    if (isGeneratingData) {
      // Stop data generation first
      handleStopDataGeneration()
    }

    setIsClearingReadings(true)
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

      // Invalidate all relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["healthStats"] })
      queryClient.invalidateQueries({ queryKey: ["recentReadings"] })
      queryClient.invalidateQueries({ queryKey: ["playersWithReadings"] })
      queryClient.invalidateQueries({ queryKey: ["playerReadings"] })

      toast({
        title: "New Match Started",
        description: "All player readings have been cleared. You can now generate new data.",
        duration: 5000,
      })
    } catch (error) {
      console.error("Error clearing readings:", error)
      toast({
        title: "Error Starting New Match",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsClearingReadings(false)
    }
  }

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (generationInterval) {
        clearInterval(generationInterval)
      }
    }
  }, [generationInterval])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Testing Environment</CardTitle>
            <CardDescription>Configure and control the testing environment</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Production</span>
            <Switch checked={mode === "testing"} onCheckedChange={handleModeToggle} aria-label="Toggle testing mode" />
            <span className="text-sm font-medium">Testing</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {mode === "testing" && (
          <>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <Button
                variant="outline"
                onClick={handleClearAllReadings}
                disabled={isClearingReadings}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isClearingReadings ? "animate-spin" : ""}`} />
                {isClearingReadings ? "Starting New Match..." : "Start New Match"}
              </Button>
              <div className="text-sm text-muted-foreground">This will clear all player readings to start fresh</div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <Label htmlFor="interval">Data Generation Interval (seconds)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSetOneSecondInterval}
                      disabled={isGeneratingData}
                      className="flex items-center gap-1"
                    >
                      <Zap className="h-3 w-3" />
                      Every Second
                    </Button>
                    <span className="text-sm font-medium">{interval}s</span>
                  </div>
                </div>
                <Slider
                  id="interval"
                  min={1}
                  max={60}
                  step={1}
                  value={[interval]}
                  onValueChange={(value) => setInterval(value[0])}
                  disabled={isGeneratingData}
                />
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <Label htmlFor="anomaly-frequency">Anomaly Frequency (%)</Label>
                  <span className="text-sm font-medium">{anomalyFrequency}%</span>
                </div>
                <Slider
                  id="anomaly-frequency"
                  min={0}
                  max={100}
                  step={5}
                  value={[anomalyFrequency]}
                  onValueChange={(value) => setAnomalyFrequency(value[0])}
                  disabled={isGeneratingData}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="anomaly-severity">Anomaly Severity</Label>
                <Select
                  value={anomalySeverity}
                  onValueChange={(value: "low" | "medium" | "high") => setAnomalySeverity(value)}
                  disabled={isGeneratingData}
                >
                  <SelectTrigger id="anomaly-severity">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        <span>Low - Mostly warnings</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center">
                        <Activity className="mr-2 h-4 w-4 text-yellow-500" />
                        <span>Medium - Mix of warnings and alerts</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                        <span>High - Mostly alerts</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Players</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllPlayers}
                    disabled={isGeneratingData || isPlayersLoading}
                  >
                    {players && selectedPlayers.length === players.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                {isPlayersLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                    {Array(6)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton key={i} className="h-6 w-full" />
                      ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                    {players?.map((player) => (
                      <div key={player.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`player-${player.id}`}
                          checked={selectedPlayers.includes(player.id)}
                          onChange={() => handlePlayerSelection(player.id)}
                          disabled={isGeneratingData}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor={`player-${player.id}`} className="text-sm cursor-pointer">
                          {player.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  {selectedPlayers.length} of {players?.length || 0} players selected
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">Data Generation Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Interval:</span> Every {interval} second{interval !== 1 ? "s" : ""}
                </div>
                <div>
                  <span className="font-medium">Players:</span> {selectedPlayers.length} selected
                </div>
                <div>
                  <span className="font-medium">Anomalies:</span> {anomalyFrequency}% of readings
                </div>
                <div>
                  <span className="font-medium">Severity:</span>{" "}
                  {anomalySeverity.charAt(0).toUpperCase() + anomalySeverity.slice(1)}
                </div>
                <div className="sm:col-span-2">
                  <span className="font-medium">Estimated:</span> ~
                  {Math.round((selectedPlayers.length * 60) / interval)} readings per minute
                </div>
              </div>
            </div>
          </>
        )}

        {mode === "production" && (
          <div className="flex items-center justify-center p-6">
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                Production Mode
              </Badge>
              <p className="text-muted-foreground">
                Switch to testing mode to generate mock data and test the application.
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {mode === "testing" && (
          <>
            {isGeneratingData ? (
              <Button variant="destructive" onClick={handleStopDataGeneration}>
                Stop Data Generation
              </Button>
            ) : (
              <Button onClick={handleStartDataGeneration} disabled={selectedPlayers.length === 0}>
                Start Data Generation
              </Button>
            )}
            <div className="flex items-center">
              {isGeneratingData && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <div className="mr-1 h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  Generating Data
                </Badge>
              )}
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
