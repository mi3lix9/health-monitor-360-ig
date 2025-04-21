import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { AddMatchForm } from "@/components/matches/add-match-form"

export const metadata: Metadata = {
  title: "Add Match | Health Monitor 360",
  description: "Add a new match to track player health during games",
}

export default function AddMatchPage() {
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

      <div className="max-w-2xl mx-auto">
        <AddMatchForm />
      </div>
    </div>
  )
}
