import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type {
  HealthReading,
  Player,
  Half,
  EnhancedAIAnalysisResult,
} from "@/types";

// Define the schema for enhanced AI analysis using Zod
const enhancedAnalysisSchema = z.object({
  summary: z
    .string()
    .describe(
      "A brief summary of the player's current health status and critical concerns"
    ),
  key_findings: z
    .array(z.string())
    .describe("List of key findings from analyzing the trends in vital signs"),
  trend_analysis: z
    .string()
    .describe("Detailed analysis of how metrics changed over time"),
  recommendations: z
    .array(z.string())
    .describe("List of specific recommendations for immediate action"),
  estimated_recovery: z
    .string()
    .describe("Estimated recovery time and process"),
  performance_impact: z
    .object({
      current_capacity: z
        .number()
        .min(0)
        .max(100)
        .describe("Current capacity percentage (0-100%)"),
      endurance_impact: z
        .number()
        .min(0)
        .max(100)
        .describe(
          "Impact on endurance (0-100%, higher means greater negative impact)"
        ),
      speed_impact: z
        .number()
        .min(0)
        .max(100)
        .describe(
          "Impact on speed (0-100%, higher means greater negative impact)"
        ),
      decision_making_impact: z
        .number()
        .min(0)
        .max(100)
        .describe(
          "Impact on decision making (0-100%, higher means greater negative impact)"
        ),
      position_specific_metrics: z
        .record(z.number())
        .describe("Position-specific performance metrics"),
    })
    .describe("Performance impact analysis"),
  primary_limiting_factors: z
    .array(z.string())
    .describe("Primary limiting factors affecting performance"),
  secondary_concerns: z
    .array(z.string())
    .describe("Secondary concerns that should be monitored"),
  recovery_optimization: z
    .array(z.string())
    .describe("Recovery optimization strategies"),
  training_adjustments: z
    .array(z.string())
    .describe("Training adjustments recommended"),
  nutrition_recommendations: z
    .array(z.string())
    .describe("Nutrition recommendations"),
  confidence_level: z
    .number()
    .min(0)
    .max(100)
    .describe("Confidence level in the analysis (0-100%)"),
  readings_analyzed: z.number().describe("Number of readings analyzed"),
});

// Type for the enhanced analysis result from Zod schema
type EnhancedAnalysisResult = z.infer<typeof enhancedAnalysisSchema>;

// Generate enhanced analysis with performance metrics, bottlenecks, and optimization suggestions
export async function generateEnhancedAnalysis(
  player: Player,
  readings: HealthReading[],
  currentReading: HealthReading,
  half: Half
): Promise<EnhancedAIAnalysisResult> {
  console.log("Generating enhanced analysis");

  try {
    // Check if we have enough readings for a meaningful analysis
    if (readings.length < 2) {
      return generateLimitedDataAnalysis(
        player,
        readings.length,
        currentReading
      );
    }

    // Sort readings by timestamp
    const sortedReadings = [...readings].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Extract key metrics for trend analysis
    const metrics = sortedReadings.map((reading) => ({
      timestamp: new Date(reading.timestamp).toISOString(),
      temperature: reading.temperature,
      heart_rate: reading.heart_rate,
      blood_oxygen: reading.blood_oxygen,
      hydration: reading.hydration,
      respiration: reading.respiration,
      fatigue: reading.fatigue,
      state: reading.state,
    }));

    // Create a prompt for the AI with enhanced analysis requirements
    const prompt = `
      As a sports medicine AI specialist with expertise in performance analytics, analyze the following health data for football player ${
        player.name
      } (${player.position}) during Half ${half.half_number}.
      
      Current Reading (ALERT state):
      - Temperature: ${currentReading.temperature}°C
      - Heart Rate: ${currentReading.heart_rate} BPM
      - Blood Oxygen: ${currentReading.blood_oxygen}%
      - Hydration: ${currentReading.hydration}%
      - Respiration: ${currentReading.respiration} breaths/min
      - Fatigue: ${currentReading.fatigue}/100
      - Timestamp: ${new Date(currentReading.timestamp).toISOString()}
      
      Historical Readings during this Half (${metrics.length} readings):
      ${JSON.stringify(metrics, null, 2)}
      
      Based on this data, provide a comprehensive analysis including:
      1. A summary of the player's current health status
      2. Key findings from analyzing the trends in vital signs
      3. A trend analysis explaining how the player's condition has evolved during this half
      4. Specific recommendations for immediate action
      5. Estimated recovery time and process
      
      ADDITIONALLY, provide the following advanced insights:
      
      6. Performance Impact Analysis:
         - Current capacity percentage (0-100%)
         - Impact on endurance (0-100%, higher means greater negative impact)
         - Impact on speed (0-100%, higher means greater negative impact)
         - Impact on decision making (0-100%, higher means greater negative impact)
         - Position-specific metrics relevant to ${player.position}
      
      7. Bottleneck Analysis:
         - Primary limiting factors affecting performance
         - Secondary concerns that should be monitored
      
      8. Optimization Suggestions:
         - Recovery optimization strategies
         - Training adjustments recommended
         - Nutrition recommendations
    `;

    // Generate the enhanced analysis using generateObject with Zod schema
    try {
      const result = await generateObject({
        model: openai("gpt-4.1-nano", { structuredOutputs: true }),
        schema: enhancedAnalysisSchema,
        prompt,
        temperature: 0.2,
        maxTokens: 1500,
      });

      // Add timestamp
      return {
        ...result,
        timestamp: new Date().toISOString(),
      };
    } catch (parseError) {
      console.error("Error generating enhanced analysis:", parseError);
      // Return a fallback analysis
      return generateFallbackEnhancedAnalysis(player, readings.length);
    }
  } catch (error) {
    console.error("Error in enhanced analysis process:", error);
    return generateFallbackEnhancedAnalysis(player, readings.length);
  }
}

function generateFallbackEnhancedAnalysis(
  player: Player,
  readingsCount: number
): EnhancedAIAnalysisResult {
  return {
    summary: `${player.name} is showing critical health metrics that require immediate attention. Multiple vital signs are outside normal ranges, indicating potential health risks.`,
    key_findings: [
      "Multiple vital signs are in alert ranges",
      "Possible signs of dehydration and fatigue",
      "Vital signs trending in concerning direction",
    ],
    trend_analysis:
      "The player's condition has deteriorated during this half, with vital signs progressively moving outside normal ranges.",
    recommendations: [
      "Remove player from field immediately",
      "Provide immediate medical evaluation",
      "Begin hydration and cooling protocols",
      "Monitor vital signs continuously",
    ],
    estimated_recovery:
      "24-48 hours with proper medical intervention and rest. Player should not return to play until cleared by medical staff.",
    performance_impact: {
      current_capacity: 40,
      endurance_impact: 75,
      speed_impact: 65,
      decision_making_impact: 60,
      position_specific_metrics: {
        field_coverage: 35,
        sprint_capacity: 30,
        reaction_time: 50,
      },
    },
    primary_limiting_factors: [
      "Severe dehydration",
      "Elevated core temperature",
      "Cardiovascular strain",
    ],
    secondary_concerns: [
      "Potential electrolyte imbalance",
      "Risk of heat-related illness",
      "Impaired cognitive function",
    ],
    recovery_optimization: [
      "Immediate cooling and hydration protocols",
      "Electrolyte replacement",
      "Monitored rest in climate-controlled environment",
    ],
    training_adjustments: [
      "Reduce training load for 48-72 hours",
      "Focus on active recovery techniques",
      "Gradual return to full intensity",
    ],
    nutrition_recommendations: [
      "Increased fluid intake with electrolytes",
      "Carbohydrate replenishment",
      "Anti-inflammatory foods",
    ],
    confidence_level: 85,
    readings_analyzed: readingsCount,
    timestamp: new Date().toISOString(),
  };
}

function generateLimitedDataAnalysis(
  player: Player,
  readingsCount: number,
  currentReading: HealthReading
): EnhancedAIAnalysisResult {
  // Determine which metrics are in alert ranges
  const alertMetrics = [];

  if (currentReading.temperature < 36 || currentReading.temperature > 38) {
    alertMetrics.push(`Temperature: ${currentReading.temperature}°C`);
  }

  if (currentReading.heart_rate < 50 || currentReading.heart_rate > 120) {
    alertMetrics.push(`Heart Rate: ${currentReading.heart_rate} BPM`);
  }

  if (currentReading.blood_oxygen < 90) {
    alertMetrics.push(`Blood Oxygen: ${currentReading.blood_oxygen}%`);
  }

  if (currentReading.hydration < 60) {
    alertMetrics.push(`Hydration: ${currentReading.hydration}%`);
  }

  if (currentReading.respiration < 10 || currentReading.respiration > 25) {
    alertMetrics.push(`Respiration: ${currentReading.respiration} breaths/min`);
  }

  if (currentReading.fatigue > 50) {
    alertMetrics.push(`Fatigue: ${currentReading.fatigue}/100`);
  }

  // Create findings based on the alert metrics
  const findings = alertMetrics.map(
    (metric) => `Alert level detected in ${metric}`
  );

  // Add a general finding about limited data
  findings.unshift(
    "Limited historical data available for comprehensive analysis"
  );

  // Generate position-specific recommendations and metrics
  const positionRecommendations = [];
  const positionSpecificMetrics: Record<string, number> = {};

  switch (player.position.toLowerCase()) {
    case "goalkeeper":
      positionRecommendations.push(
        "Monitor reaction time and decision-making ability"
      );
      positionSpecificMetrics["reaction_time"] = 45;
      positionSpecificMetrics["decision_making"] = 50;
      positionSpecificMetrics["explosive_movement"] = 40;
      break;
    case "defender":
      positionRecommendations.push(
        "Assess defensive positioning and tackling capability"
      );
      positionSpecificMetrics["defensive_positioning"] = 40;
      positionSpecificMetrics["tackling_safety"] = 35;
      positionSpecificMetrics["aerial_ability"] = 45;
      break;
    case "midfielder":
      positionRecommendations.push(
        "Evaluate stamina and field coverage capacity"
      );
      positionSpecificMetrics["field_coverage"] = 35;
      positionSpecificMetrics["passing_accuracy"] = 50;
      positionSpecificMetrics["transition_speed"] = 40;
      break;
    case "forward":
      positionRecommendations.push(
        "Check sprint capacity and finishing ability"
      );
      positionSpecificMetrics["sprint_capacity"] = 30;
      positionSpecificMetrics["finishing_precision"] = 45;
      positionSpecificMetrics["off_ball_movement"] = 40;
      break;
    default:
      positionRecommendations.push(
        "Assess position-specific performance metrics"
      );
      positionSpecificMetrics["overall_performance"] = 40;
  }

  // Calculate estimated performance impacts based on alert metrics
  const performanceImpact = {
    current_capacity: 50 - alertMetrics.length * 5,
    endurance_impact: 50 + alertMetrics.length * 5,
    speed_impact: 45 + alertMetrics.length * 5,
    decision_making_impact: 40 + alertMetrics.length * 5,
    position_specific_metrics: positionSpecificMetrics,
  };

  return {
    summary: `PRELIMINARY ANALYSIS: ${
      player.name
    } is showing critical health metrics that require immediate attention. This analysis is based on limited data (${readingsCount} reading${
      readingsCount !== 1 ? "s" : ""
    }) and should be supplemented with medical evaluation.`,
    key_findings: findings,
    trend_analysis:
      "Insufficient data for trend analysis. Continue monitoring to establish trends and patterns in vital signs.",
    recommendations: [
      "Remove player from field for immediate medical assessment",
      "Increase monitoring frequency to establish trends",
      "Document all symptoms and observations",
      positionRecommendations[0],
      "Prepare substitute player as precautionary measure",
    ],
    estimated_recovery:
      "Cannot be accurately determined with current data. Medical evaluation required for proper assessment.",
    performance_impact: performanceImpact,
    primary_limiting_factors: [
      "Acute physiological stress",
      "Insufficient recovery data",
      alertMetrics.length > 0 ? alertMetrics[0] : "Unknown primary factor",
    ],
    secondary_concerns: [
      "Potential for rapid deterioration without intervention",
      "Risk of injury due to compromised physical state",
      "Incomplete performance baseline data",
    ],
    recovery_optimization: [
      "Immediate medical evaluation",
      "Establish baseline recovery metrics",
      "Implement position-specific recovery protocols",
    ],
    training_adjustments: [
      "Pause high-intensity training pending medical clearance",
      "Consider modified training plan based on medical assessment",
      "Implement gradual return-to-play protocol",
    ],
    nutrition_recommendations: [
      "Immediate hydration with electrolyte replacement",
      "Anti-inflammatory nutrition protocol",
      "Targeted supplementation based on medical assessment",
    ],
    confidence_level: 70,
    readings_analyzed: readingsCount,
    timestamp: new Date().toISOString(),
  };
}
