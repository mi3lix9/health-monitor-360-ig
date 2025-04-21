"use client"

import { useMatchWithHalves, useMatchStatistics } from "@/lib/react-query-hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, FileText } from "lucide-react"
import { format } from "date-fns"

type MatchDetailsProps = {
  matchId: string
}

export function MatchDetails({ matchId }: MatchDetailsProps) {
  const { data: match, isLoading } = useMatchWithHalves(matchId)
  const { data: statistics, isLoading: isLoadingStats } = useMatchStatistics(matchId)

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />
  }

  if (!match) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Match Not Found</CardTitle>
          <CardDescription>The match you are looking for does not exist.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{match.name}</CardTitle>
          <Badge
            variant={
              match.status === "completed" ? "outline" : match.status === "in_progress" ? "default" : "secondary"
            }
          >
            {match.status === "in_progress"
              ? "In Progress"
              : match.status === "completed"
                ? "Completed"
                : match.status === "cancelled"
                  ? "Cancelled"
                  : "Upcoming"}
          </Badge>
        </div>
        <CardDescription>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(match.match_date), "PPP")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{format(new Date(match.match_date), "p")}</span>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {match.notes && (
          <div className="mb-6">
            <div className="flex items-center gap-1 text-sm font-medium mb-2">
              <FileText className="h-4 w-4" />
              <span>Notes</span>
            </div>
            <p className="text-muted-foreground">{match.notes}</p>
          </div>
        )}

        {isLoadingStats ? (
          <Skeleton className="h-[100px] w-full" />
        ) : statistics && statistics.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Readings"
              value={statistics.reduce((sum, stat) => sum + (stat.reading_count || 0), 0)}
            />
            <StatCard
              title="Players Monitored"
              value={statistics.reduce((sum, stat) => sum + (stat.player_count || 0), 0)}
            />
            <StatCard
              title="Alerts"
              value={statistics.reduce((sum, stat) => sum + (stat.alert_count || 0), 0)}
              alert={true}
            />
            <StatCard
              title="Warnings"
              value={statistics.reduce((sum, stat) => sum + (stat.warning_count || 0), 0)}
              warning={true}
            />
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No health readings have been recorded for this match yet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatCard({
  title,
  value,
  alert,
  warning,
}: { title: string; value: number; alert?: boolean; warning?: boolean }) {
  return (
    <div
      className={`p-4 rounded-lg border ${alert ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20" : warning ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20" : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20"}`}
    >
      <div className="text-sm font-medium mb-1">{title}</div>
      <div
        className={`text-2xl font-bold ${alert ? "text-red-600 dark:text-red-400" : warning ? "text-yellow-600 dark:text-yellow-400" : ""}`}
      >
        {value}
      </div>
    </div>
  )
}
