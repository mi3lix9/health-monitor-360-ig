"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/ui/status-badge"
import { useHealthStats } from "@/lib/react-query-hooks"

type StatusCardProps = {
  title: string
  status: "normal" | "warning" | "alert" | "none"
}

export function StatusCard({ title, status }: StatusCardProps) {
  const { data: stats, isLoading } = useHealthStats()

  if (isLoading) {
    return <Skeleton className="h-[120px]" />
  }

  let count = 0
  if (stats) {
    if (status === "normal") count = stats.normalCount || 0
    else if (status === "warning") count = stats.warningCount || 0
    else if (status === "alert") count = stats.alertCount || 0
    else if (status === "none") {
      // Count players without readings
      count =
        stats.totalCount === 0 ? 0 : stats.totalCount - (stats.normalCount + stats.warningCount + stats.alertCount)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {status !== "none" && <StatusBadge status={status} />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground">
          {status === "normal" && "Players with normal health readings"}
          {status === "warning" && "Players requiring attention"}
          {status === "alert" && "Players requiring immediate attention"}
          {status === "none" && "Players without health readings"}
        </p>
      </CardContent>
    </Card>
  )
}
