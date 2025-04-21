import { Suspense } from "react"
import { SidebarLayout } from "@/components/layouts/sidebar-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RealtimePlayers } from "@/components/realtime-players"
import { HealthMetricsChart } from "@/components/charts/health-metrics-chart"
import { AlertsOverTimeChart } from "@/components/charts/alerts-over-time-chart"
import { PlayerStatusDistribution } from "@/components/charts/player-status-distribution"
import { RecentAlerts } from "@/components/recent-alerts"
import { StatusCard } from "@/components/dashboard/status-card"
import Link from "next/link"
import { ArrowRight, Plus } from "lucide-react"

export default function DashboardPage() {
  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Monitor player health status and alerts in real-time</p>
          </div>
          <Button asChild>
            <Link href="/players/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Player
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatusCard title="Normal" status="normal" />
          <StatusCard title="Warning" status="warning" />
          <StatusCard title="Alert" status="alert" />
          <StatusCard title="No Readings" status="none" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle>Player Status Distribution</CardTitle>
              <CardDescription>Current health status across all players</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Suspense fallback={<Skeleton className="h-full w-full" />}>
                  <PlayerStatusDistribution />
                </Suspense>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle>Alerts Over Time</CardTitle>
              <CardDescription>Number of alerts in the past 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Suspense fallback={<Skeleton className="h-full w-full" />}>
                  <AlertsOverTimeChart />
                </Suspense>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Health Metrics Trends</CardTitle>
              <CardDescription>Average metrics across all players</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Suspense fallback={<Skeleton className="h-full w-full" />}>
                  <HealthMetricsChart />
                </Suspense>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Alerts</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/alerts">
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <CardDescription>Players requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] overflow-auto">
                <Suspense fallback={<Skeleton className="h-full w-full" />}>
                  <RecentAlerts />
                </Suspense>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Players</TabsTrigger>
              <TabsTrigger value="alert">Alert</TabsTrigger>
              <TabsTrigger value="warning">Warning</TabsTrigger>
              <TabsTrigger value="normal">Normal</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" asChild>
              <Link href="/players">View All Players</Link>
            </Button>
          </div>

          <TabsContent value="all">
            <RealtimePlayers limit={6} />
          </TabsContent>

          <TabsContent value="alert">
            <RealtimePlayers filterState="alert" limit={6} />
          </TabsContent>

          <TabsContent value="warning">
            <RealtimePlayers filterState="warning" limit={6} />
          </TabsContent>

          <TabsContent value="normal">
            <RealtimePlayers filterState="normal" limit={6} />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  )
}
