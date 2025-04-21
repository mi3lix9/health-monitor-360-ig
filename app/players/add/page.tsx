import { SidebarLayout } from "@/components/layouts/sidebar-layout"
import { AddPlayerForm } from "@/components/add-player-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function AddPlayerPage() {
  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/players">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Players
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Add New Player</h1>
          <p className="text-muted-foreground mb-6">Enter the details of the player you want to add to the system</p>
        </div>

        <div className="max-w-2xl">
          <AddPlayerForm />
        </div>
      </div>
    </SidebarLayout>
  )
}
