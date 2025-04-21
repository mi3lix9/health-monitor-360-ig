import { SidebarLayout } from "@/components/layouts/sidebar-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HealthMetricsChart } from "@/components/charts/health-metrics-chart"
import { AlertsOverTimeChart } from "@/components/charts/alerts-over-time-chart"
import { PlayerStatusDistribution } from "@/components/charts/player-status-distribution"
import { TeamPerformanceChart } from "@/components/charts/team-performance-chart"

export default function AnalyticsPage() {
  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Visualize and analyze player health data</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Player Status Distribution</CardTitle>
                  <CardDescription>Current health status across all players</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <PlayerStatusDistribution />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team Performance</CardTitle>
                  <CardDescription>Overall team health metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <TeamPerformanceChart />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Health Metrics Trends</CardTitle>
                <CardDescription>Average metrics across all players</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <HealthMetricsChart />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Health Metrics Over Time</CardTitle>
                <CardDescription>Detailed view of health metrics trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px]">
                  <HealthMetricsChart />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alerts Over Time</CardTitle>
                <CardDescription>Number of alerts in the past 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <AlertsOverTimeChart />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  )
}
