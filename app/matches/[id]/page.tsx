import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { HalvesManager } from "@/components/matches/halves-manager"
import { MatchDetails } from "@/components/matches/match-details"

type MatchDetailPageProps = {
  params: {
    id: string
  }
}

export function generateMetadata({ params }: MatchDetailPageProps): Metadata {
  return {
    title: `Match Details | Health Monitor 360`,
    description: "View and manage match details and player health readings",
  }
}

export default function MatchDetailPage({ params }: MatchDetailPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/matches">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Matches
          </Link>
        </Button>
      </div>

      <MatchDetails matchId={params.id} />

      <HalvesManager matchId={params.id} />
    </div>
  )
}
