import { SidebarLayout } from "@/components/layouts/sidebar-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RealtimePlayers } from "@/components/realtime-players"
import { AlertsTimeline } from "@/components/alerts-timeline"

export default function AlertsPage() {
  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground">Monitor and respond to player health alerts</p>
        </div>

        <Tabs defaultValue="current" className="space-y-6">
          <TabsList>
            <TabsTrigger value="current">Current Alerts</TabsTrigger>
            <TabsTrigger value="history">Alert History</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Players in Alert State</CardTitle>
                <CardDescription>Players requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <RealtimePlayers filterState="alert" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alert History</CardTitle>
                <CardDescription>Recent alert events across all players</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertsTimeline />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  )
}
