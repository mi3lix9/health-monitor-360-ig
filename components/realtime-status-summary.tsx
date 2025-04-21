"use client"

import { usePlayersWithReadings } from "@/lib/react-query-hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Skeleton } from "@/components/ui/skeleton"

export function RealtimeStatusSummary() {
  const { data: players, isLoading } = usePlayersWithReadings()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-8 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  const normalCount = (players || []).filter((p) => p.latest_reading?.state === "normal").length
  const warningCount = (players || []).filter((p) => p.latest_reading?.state === "warning").length
  const alertCount = (players || []).filter((p) => p.latest_reading?.state === "alert").length
  const noReadingCount = (players || []).filter((p) => !p.latest_reading).length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Normal</CardTitle>
          <StatusBadge status="normal" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{normalCount}</div>
          <p className="text-xs text-muted-foreground">Players with normal health readings</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Warning</CardTitle>
          <StatusBadge status="warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{warningCount}</div>
          <p className="text-xs text-muted-foreground">Players requiring attention</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alert</CardTitle>
          <StatusBadge status="alert" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{alertCount}</div>
          <p className="text-xs text-muted-foreground">Players requiring immediate attention</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">No Readings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{noReadingCount}</div>
          <p className="text-xs text-muted-foreground">Players without health readings</p>
        </CardContent>
      </Card>
    </div>
  )
}
