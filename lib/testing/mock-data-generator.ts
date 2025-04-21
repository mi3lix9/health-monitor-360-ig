import type { HealthReading } from "@/types"
import type { DataGenerationOptions } from "./testing-context"

// Normal ranges for health metrics
const normalRanges = {
  temperature: { min: 36.5, max: 37.5 }, // Celsius
  heart_rate: { min: 60, max: 100 }, // BPM
  blood_oxygen: { min: 95, max: 100 }, // Percentage
  hydration: { min: 70, max: 100 }, // Percentage
  respiration: { min: 12, max: 20 }, // Breaths per minute
  fatigue: { min: 0, max: 30 }, // Arbitrary scale 0-100
}

// Warning ranges for health metrics
const warningRanges = {
  temperature: { min: 36.0, max: 38.0 }, // Celsius
  heart_rate: { min: 50, max: 120 }, // BPM
  blood_oxygen: { min: 90, max: 94 }, // Percentage
  hydration: { min: 60, max: 69 }, // Percentage
  respiration: { min: 10, max: 25 }, // Breaths per minute
  fatigue: { min: 31, max: 50 }, // Arbitrary scale 0-100
}

// Alert ranges for health metrics
const alertRanges = {
  temperature: { min: 35.0, max: 39.0 }, // Celsius
  heart_rate: { min: 40, max: 150 }, // BPM
  blood_oxygen: { min: 80, max: 89 }, // Percentage
  hydration: { min: 40, max: 59 }, // Percentage
  respiration: { min: 8, max: 30 }, // Breaths per minute
  fatigue: { min: 51, max: 100 }, // Arbitrary scale 0-100
}

// Generate a random number within a range
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

// Round to a specific number of decimal places
function roundToDecimal(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

// Generate a normal reading
function generateNormalReading(
  playerId: string,
): Omit<HealthReading, "id" | "timestamp" | "created_at" | "ai_analysis" | "state"> {
  return {
    player_id: playerId,
    temperature: roundToDecimal(randomInRange(normalRanges.temperature.min, normalRanges.temperature.max), 1),
    heart_rate: Math.round(randomInRange(normalRanges.heart_rate.min, normalRanges.heart_rate.max)),
    blood_oxygen: Math.round(randomInRange(normalRanges.blood_oxygen.min, normalRanges.blood_oxygen.max)),
    hydration: Math.round(randomInRange(normalRanges.hydration.min, normalRanges.hydration.max)),
    respiration: Math.round(randomInRange(normalRanges.respiration.min, normalRanges.respiration.max)),
    fatigue: Math.round(randomInRange(normalRanges.fatigue.min, normalRanges.fatigue.max)),
  }
}

// Generate a warning reading
function generateWarningReading(
  playerId: string,
): Omit<HealthReading, "id" | "timestamp" | "created_at" | "ai_analysis" | "state"> {
  return {
    player_id: playerId,
    temperature: roundToDecimal(randomInRange(warningRanges.temperature.min, warningRanges.temperature.max), 1),
    heart_rate: Math.round(randomInRange(warningRanges.heart_rate.min, warningRanges.heart_rate.max)),
    blood_oxygen: Math.round(randomInRange(warningRanges.blood_oxygen.min, warningRanges.blood_oxygen.max)),
    hydration: Math.round(randomInRange(warningRanges.hydration.min, warningRanges.hydration.max)),
    respiration: Math.round(randomInRange(warningRanges.respiration.min, warningRanges.respiration.max)),
    fatigue: Math.round(randomInRange(warningRanges.fatigue.min, warningRanges.fatigue.max)),
  }
}

// Generate an alert reading
function generateAlertReading(
  playerId: string,
): Omit<HealthReading, "id" | "timestamp" | "created_at" | "ai_analysis" | "state"> {
  return {
    player_id: playerId,
    temperature: roundToDecimal(randomInRange(alertRanges.temperature.min, alertRanges.temperature.max), 1),
    heart_rate: Math.round(randomInRange(alertRanges.heart_rate.min, alertRanges.heart_rate.max)),
    blood_oxygen: Math.round(randomInRange(alertRanges.blood_oxygen.min, alertRanges.blood_oxygen.max)),
    hydration: Math.round(randomInRange(alertRanges.hydration.min, alertRanges.hydration.max)),
    respiration: Math.round(randomInRange(alertRanges.respiration.min, alertRanges.respiration.max)),
    fatigue: Math.round(randomInRange(alertRanges.fatigue.min, alertRanges.fatigue.max)),
  }
}

// Generate a reading based on anomaly severity
export function generateMockReading(
  playerId: string,
  options: { anomalySeverity: "low" | "medium" | "high"; isAnomalous: boolean },
): Omit<HealthReading, "id" | "timestamp" | "created_at" | "ai_analysis" | "state"> {
  if (!options.isAnomalous) {
    return generateNormalReading(playerId)
  }

  switch (options.anomalySeverity) {
    case "low":
      // 80% chance of warning, 20% chance of alert
      return Math.random() < 0.8 ? generateWarningReading(playerId) : generateAlertReading(playerId)
    case "medium":
      // 50% chance of warning, 50% chance of alert
      return Math.random() < 0.5 ? generateWarningReading(playerId) : generateAlertReading(playerId)
    case "high":
      // 20% chance of warning, 80% chance of alert
      return Math.random() < 0.2 ? generateWarningReading(playerId) : generateAlertReading(playerId)
    default:
      return generateWarningReading(playerId)
  }
}

// Generate a batch of readings for multiple players
export function generateMockReadingsBatch(
  options: DataGenerationOptions,
): Omit<HealthReading, "id" | "timestamp" | "created_at" | "ai_analysis" | "state">[] {
  return options.playerIds.map((playerId) => {
    const isAnomalous = Math.random() < options.anomalyFrequency
    return generateMockReading(playerId, { anomalySeverity: options.anomalySeverity, isAnomalous })
  })
}
