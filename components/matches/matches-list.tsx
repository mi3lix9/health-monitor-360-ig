"use client"

import { useMatches } from "@/lib/react-query-hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronRight, Clock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export function MatchesList() {
  const { data: matches, isLoading } = useMatches()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full" />
          ))}
      </div>
    )
  }

  if (!matches || matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Matches Found</CardTitle>
          <CardDescription>Get started by adding your first match</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/matches/add">Add Match</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <Card key={match.id} className="overflow-hidden">
          <Link href={`/matches/${match.id}`} className="block hover:bg-muted/50 transition-colors">
            <div className="p-6 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold">{match.name}</h3>
                  <Badge
                    variant={
                      match.status === "completed"
                        ? "outline"
                        : match.status === "in_progress"
                          ? "default"
                          : "secondary"
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
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(match.match_date), "PPP")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(match.match_date), "p")}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </Card>
      ))}
    </div>
  )
}
