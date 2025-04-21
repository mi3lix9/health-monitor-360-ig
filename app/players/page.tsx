import { SidebarLayout } from "@/components/layouts/sidebar-layout"
import { Button } from "@/components/ui/button"
import { RealtimePlayers } from "@/components/realtime-players"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function PlayersPage() {
  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Players</h1>
            <p className="text-muted-foreground">Manage and monitor all players in the system</p>
          </div>
          <Button asChild>
            <Link href="/players/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Player
            </Link>
          </Button>
        </div>

        <RealtimePlayers />
      </div>
    </SidebarLayout>
  )
}
