"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TestingController } from "./testing-controller"
import { TestingLogs } from "./testing-logs"
import { RealtimeTestingStatus } from "./realtime-testing-status"
import { TestingMetrics } from "./testing-metrics"
import { NewMatchButton } from "./new-match-button"

export function TestingPanel() {
  const [activeTab, setActiveTab] = useState("controls")

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Testing Panel</CardTitle>
        <CardDescription>Generate test data and monitor system performance</CardDescription>

        {/* Add the New Match button at the top of the panel */}
        <div className="mt-4 mb-2">
          <NewMatchButton
            onSuccess={() => {
              // Switch to logs tab to show the clearing operation
              setActiveTab("logs")
            }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>
          <TabsContent value="controls" className="space-y-4">
            <TestingController />
            <RealtimeTestingStatus />
          </TabsContent>
          <TabsContent value="logs">
            <TestingLogs />
          </TabsContent>
          <TabsContent value="metrics">
            <TestingMetrics />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
