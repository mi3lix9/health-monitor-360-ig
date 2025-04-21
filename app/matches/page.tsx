import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { MatchesList } from "@/components/matches/matches-list"

export const metadata: Metadata = {
  title: "Matches | Health Monitor 360",
  description: "Manage football matches and track player health during games",
}

export default function MatchesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
          <p className="text-muted-foreground">Manage football matches and track player health during games</p>
        </div>
        <Button asChild>
          <Link href="/matches/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Match
          </Link>
        </Button>
      </div>

      <MatchesList />
    </div>
  )
}
