import { SidebarLayout } from "@/components/layouts/sidebar-layout"
import { RetryQueueDashboard } from "@/components/admin/retry-queue-dashboard"

export default function RetryQueuePage() {
  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Analysis Retry Queue</h1>
          <p className="text-muted-foreground">Manage and monitor failed AI analyses</p>
        </div>

        <RetryQueueDashboard />
      </div>
    </SidebarLayout>
  )
}
