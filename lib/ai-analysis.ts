import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import type { HealthReading } from "@/types"
import { addToRetryQueue } from "@/lib/retry-queue-service"

// Define the schema for AI analysis
const analysisSchema = z.object({
  summary: z.string().describe("A brief summary of the player's health status"),
  recommendations: z.array(z.string()).describe("List of actionable recommendations for the player"),
  risk_level: z.enum(["low", "medium", "high"]).describe("The risk level based on the health readings"),
  potential_issues: z.array(z.string()).describe("Potential health issues identified"),
  replacement_needed: z.boolean().describe("Whether the player needs to be replaced"),
  recovery_time_estimate: z.string().optional().describe("Estimated recovery time if issues are detected"),
  priority_action: z.string().describe("The single most important action to take immediately"),
})

// Type for the analysis result
type AnalysisResult = z.infer<typeof analysisSchema>

async function generateAIAnalysis(reading: HealthReading, playerInfo: { name: string; position: string }) {
  // Validate player info to ensure it's in the correct format
  if (!playerInfo || typeof playerInfo !== "object") {
    console.error("Invalid player info object:", playerInfo)
    return generateAlertFallbackAnalysis(reading, {
      name: "Unknown Player",
      position: "Unknown Position",
    })
  }

  // Ensure name and position are strings
  const validatedPlayerInfo = {
    name: typeof playerInfo.name === "string" ? playerInfo.name : "Unknown Player",
    position: typeof playerInfo.position === "string" ? playerInfo.position : "Unknown Position",
  }

  // Normal ranges for health metrics
  const normalRanges = {
    temperature: { min: 36.5, max: 37.5 }, // Celsius
    heart_rate: { min: 60, max: 100 }, // BPM
    blood_oxygen: { min: 95, max: 100 }, // Percentage
    hydration: { min: 70, max: 100 }, // Percentage
    respiration: { min: 12, max: 20 }, // Breaths per minute
    fatigue: { min: 0, max: 30 }, // Arbitrary scale 0-100
  }

  // Create a more concise prompt to reduce token usage and processing time
  const prompt = `
    As a sports medicine AI, analyze these health readings for football player ${validatedPlayerInfo.name} (${validatedPlayerInfo.position}):
    
    Temperature: ${reading.temperature}°C (Normal: ${normalRanges.temperature.min}-${normalRanges.temperature.max}°C)
    Heart Rate: ${reading.heart_rate} BPM (Normal: ${normalRanges.heart_rate.min}-${normalRanges.heart_rate.max})
    Blood Oxygen: ${reading.blood_oxygen}% (Normal: ${normalRanges.blood_oxygen.min}-${normalRanges.blood_oxygen.max}%)
    Hydration: ${reading.hydration}% (Normal: ${normalRanges.hydration.min}-${normalRanges.hydration.max}%)
    Respiration: ${reading.respiration} breaths/min (Normal: ${normalRanges.respiration.min}-${normalRanges.respiration.max})
    Fatigue: ${reading.fatigue}/100 (Lower is better, >30 = significant fatigue)
    
    Current state: ALERT - requires immediate attention
  `

  try {
    // Use generateObject instead of generateText to directly get structured data
    const result = await generateObject({
      model: openai("gpt-4.1-nano"),
      schema: analysisSchema,
      prompt,
      temperature: 0.2,
      maxTokens: 500,
    })

    return result
  } catch (error) {
    console.error("Error analyzing player health:", error)
    // Add to retry queue
    await addToRetryQueue(reading.id, reading.player_id, error instanceof Error ? error.message : String(error))
    // Return fallback for immediate use
    return generateAlertFallbackAnalysis(reading, validatedPlayerInfo)
  }
}

// Update the analyzePlayerHealth function to ensure it always returns a valid analysis
export async function analyzePlayerHealth(reading: HealthReading, playerInfo: { name: string; position: string }) {
  // Validate player info to ensure it's in the correct format
  if (!playerInfo || typeof playerInfo !== "object") {
    console.error("Invalid player info for analysis:", playerInfo)
    return generateFallbackAnalysis(reading, {
      name: "Unknown Player",
      position: "Unknown Position",
    })
  }

  // Ensure name and position are strings
  const validatedPlayerInfo = {
    name: typeof playerInfo.name === "string" ? playerInfo.name : "Unknown Player",
    position: typeof playerInfo.position === "string" ? playerInfo.position : "Unknown Position",
  }

  // For alert states, always ensure we have an analysis
  if (reading.state === "alert") {
    try {
      // Attempt to generate AI analysis
      const aiAnalysis = await generateAIAnalysis(reading, validatedPlayerInfo)
      return aiAnalysis
    } catch (error) {
      console.error("Error generating AI analysis for alert state:", error)
      // Always fall back to a generated analysis for alert states
      return generateAlertFallbackAnalysis(reading, validatedPlayerInfo)
    }
  }

  // For non-alert states, continue with the existing logic
  return generateBasicAnalysis(reading, validatedPlayerInfo)
}

// Generate a basic analysis for normal and warning states
function generateBasicAnalysis(reading: HealthReading, playerInfo: { name: string; position: string }) {
  // Determine risk level based on state
  const risk_level = reading.state === "normal" ? "low" : "medium"

  // Create basic analysis based on the state
  const basicAnalysis = {
    summary:
      reading.state === "normal"
        ? `${playerInfo.name}'s health readings are within normal ranges.`
        : `${playerInfo.name}'s health readings show some values outside normal ranges that require monitoring.`,
    recommendations:
      reading.state === "normal"
        ? ["Continue regular monitoring", "Maintain current training regimen", "Ensure proper hydration and nutrition"]
        : [
            "Monitor the player's condition more frequently",
            "Consider adjusting training intensity",
            "Ensure proper hydration and rest",
          ],
    risk_level: risk_level,
    potential_issues: [],
    replacement_needed: false,
    priority_action:
      reading.state === "normal"
        ? "Continue normal monitoring protocols"
        : "Monitor player closely and consider adjustments to training load",
  }

  // Add potential issues based on readings
  if (reading.temperature < 36.5 || reading.temperature > 37.5) {
    basicAnalysis.potential_issues.push("Abnormal body temperature")
  }

  if (reading.heart_rate < 60 || reading.heart_rate > 100) {
    basicAnalysis.potential_issues.push("Irregular heart rate")
  }

  if (reading.blood_oxygen < 95) {
    basicAnalysis.potential_issues.push("Low blood oxygen levels")
  }

  if (reading.hydration < 70) {
    basicAnalysis.potential_issues.push("Dehydration")
  }

  if (reading.respiration < 12 || reading.respiration > 20) {
    basicAnalysis.potential_issues.push("Abnormal respiration rate")
  }

  if (reading.fatigue > 30) {
    basicAnalysis.potential_issues.push("Excessive fatigue")
  }

  return basicAnalysis
}

// Generate a fallback analysis when the AI call fails
function generateFallbackAnalysis(reading: HealthReading, playerInfo: { name: string; position: string }) {
  // For alert state, create a more detailed fallback
  const fallbackAnalysis = {
    summary: `${playerInfo.name}'s health readings indicate a critical alert state that requires immediate attention.`,
    recommendations: [
      "Remove player from field immediately",
      "Seek immediate medical evaluation",
      "Monitor vital signs continuously",
      "Prepare for possible medical intervention",
      "Notify medical team of the situation",
    ],
    risk_level: "high" as const,
    potential_issues: [],
    replacement_needed: true,
    priority_action: "Remove player from field immediately for urgent medical evaluation",
    recovery_time_estimate: "24-48 hours minimum, pending medical evaluation",
  }

  // Add potential issues based on readings
  if (reading.temperature < 36.5 || reading.temperature > 37.5) {
    fallbackAnalysis.potential_issues.push("Abnormal body temperature")
  }

  if (reading.heart_rate < 60 || reading.heart_rate > 100) {
    fallbackAnalysis.potential_issues.push("Irregular heart rate")
  }

  if (reading.blood_oxygen < 95) {
    fallbackAnalysis.potential_issues.push("Low blood oxygen levels")
  }

  if (reading.hydration < 70) {
    fallbackAnalysis.potential_issues.push("Dehydration")
  }

  if (reading.respiration < 12 || reading.respiration > 20) {
    fallbackAnalysis.potential_issues.push("Abnormal respiration rate")
  }

  if (reading.fatigue > 30) {
    fallbackAnalysis.potential_issues.push("Excessive fatigue")
  }

  // If no issues were detected but state is alert, add a generic issue
  if (fallbackAnalysis.potential_issues.length === 0) {
    fallbackAnalysis.potential_issues.push("Critical health concern detected")
  }

  return fallbackAnalysis
}

// Generate a more detailed fallback analysis specifically for alert states
function generateAlertFallbackAnalysis(reading: HealthReading, playerInfo: { name: string; position: string }) {
  // Create a detailed analysis based on the available metrics
  const alertAnalysis = {
    summary: `PRELIMINARY ANALYSIS: ${playerInfo.name}'s health readings indicate a critical alert state requiring immediate attention. This analysis is based on limited data and should be supplemented with medical evaluation.`,
    recommendations: [
      "Remove player from field immediately for medical assessment",
      "Monitor vital signs continuously",
      "Begin standard recovery protocols appropriate for position",
      "Prepare substitute player",
      "Document all symptoms and readings for medical staff",
    ],
    risk_level: "high" as const,
    potential_issues: [],
    replacement_needed: true,
    priority_action: "Immediate removal from play and medical evaluation",
    recovery_time_estimate: "To be determined after medical assessment",
  }

  // Add specific issues based on which metrics are in alert ranges
  if (reading.temperature < 36 || reading.temperature > 38) {
    alertAnalysis.potential_issues.push(
      reading.temperature < 36
        ? "Hypothermia risk: Body temperature below safe threshold"
        : "Hyperthermia risk: Body temperature above safe threshold",
    )
  }

  if (reading.heart_rate < 50 || reading.heart_rate > 120) {
    alertAnalysis.potential_issues.push(
      reading.heart_rate < 50
        ? "Bradycardia: Abnormally low heart rate"
        : "Tachycardia: Abnormally elevated heart rate",
    )
  }

  if (reading.blood_oxygen < 90) {
    alertAnalysis.potential_issues.push("Hypoxemia: Critically low blood oxygen levels")
  }

  if (reading.hydration < 60) {
    alertAnalysis.potential_issues.push("Severe dehydration: Urgent rehydration needed")
  }

  if (reading.respiration < 10 || reading.respiration > 25) {
    alertAnalysis.potential_issues.push(
      reading.respiration < 10
        ? "Respiratory depression: Abnormally slow breathing rate"
        : "Hyperventilation: Abnormally rapid breathing rate",
    )
  }

  if (reading.fatigue > 50) {
    alertAnalysis.potential_issues.push("Extreme fatigue: High risk of injury and performance impairment")
  }

  // If no specific issues were detected but state is alert, add a generic issue
  if (alertAnalysis.potential_issues.length === 0) {
    alertAnalysis.potential_issues.push("Critical health concern detected in combined metrics")
  }

  // Add position-specific concerns
  switch (playerInfo.position.toLowerCase()) {
    case "goalkeeper":
      alertAnalysis.potential_issues.push("Alert state may affect reaction time and decision making")
      break
    case "defender":
      alertAnalysis.potential_issues.push("Alert state may compromise defensive positioning and tackling safety")
      break
    case "midfielder":
      alertAnalysis.potential_issues.push("Alert state may impact stamina and field coverage capabilities")
      break
    case "forward":
      alertAnalysis.potential_issues.push("Alert state may affect sprint capacity and finishing ability")
      break
    default:
      alertAnalysis.potential_issues.push("Alert state may compromise overall performance and safety")
  }

  return alertAnalysis
}
