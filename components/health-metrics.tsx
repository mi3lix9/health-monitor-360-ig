import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { HealthReading } from "@/types"

type HealthMetricsProps = {
  reading: HealthReading
}

export function HealthMetrics({ reading }: HealthMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Temperature</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reading.temperature}°C</div>
          <p className="text-xs text-muted-foreground">Normal range: 36.5-37.5°C</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reading.heart_rate} BPM</div>
          <p className="text-xs text-muted-foreground">Normal range: 60-100 BPM</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Blood Oxygen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reading.blood_oxygen}%</div>
          <p className="text-xs text-muted-foreground">Normal range: 95-100%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Hydration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reading.hydration}%</div>
          <p className="text-xs text-muted-foreground">Normal range: 70-100%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Respiration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reading.respiration} breaths/min</div>
          <p className="text-xs text-muted-foreground">Normal range: 12-20 breaths/min</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Fatigue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reading.fatigue}/100</div>
          <p className="text-xs text-muted-foreground">Normal range: 0-30</p>
        </CardContent>
      </Card>
    </div>
  )
}
