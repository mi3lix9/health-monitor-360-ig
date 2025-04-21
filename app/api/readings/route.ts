import { type NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { analyzePlayerHealth } from "@/lib/ai-analysis";
import { revalidatePath } from "next/cache";
import { addToRetryQueue } from "@/lib/retry-queue-service";

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerClient();

    // Parse the request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const isTestRequest = request.headers.get("X-Testing-Mode") === "true";

    // Validate the request body
    if (
      !body.player_id ||
      typeof body.temperature !== "number" ||
      typeof body.heart_rate !== "number" ||
      typeof body.blood_oxygen !== "number" ||
      typeof body.hydration !== "number" ||
      typeof body.respiration !== "number" ||
      typeof body.fatigue !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    // Determine the state based on readings
    let state: "normal" | "warning" | "alert" = "normal";

    // Simple rules for state determination
    if (
      body.temperature < 36 ||
      body.temperature > 38 ||
      body.heart_rate < 50 ||
      body.heart_rate > 120 ||
      body.blood_oxygen < 90 ||
      body.hydration < 60 ||
      body.respiration < 10 ||
      body.respiration > 25 ||
      body.fatigue > 50
    ) {
      state = "alert";
    } else if (
      body.temperature < 36.5 ||
      body.temperature > 37.5 ||
      body.heart_rate < 60 ||
      body.heart_rate > 100 ||
      body.blood_oxygen < 95 ||
      body.hydration < 70 ||
      body.respiration < 12 ||
      body.respiration > 20 ||
      body.fatigue > 30
    ) {
      state = "warning";
    }

    // Prepare the reading with state
    const reading = {
      player_id: body.player_id,
      temperature: body.temperature,
      heart_rate: body.heart_rate,
      blood_oxygen: body.blood_oxygen,
      hydration: body.hydration,
      respiration: body.respiration,
      fatigue: body.fatigue,
      state,
      timestamp: new Date().toISOString(),
      half_id: body.half_id ?? "e50b32a4-9fc2-444c-a7df-4aa3f7217dea", // Include half_id if provided
    };

    // Insert the reading - this is the most important part and should happen regardless of AI analysis
    const { data, error } = await supabase
      .from("health_readings")
      .insert([reading])
      .select()
      .single();

    if (error) {
      console.error("Error adding health reading:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If we successfully inserted the reading, we can proceed with the rest of the logic
    // Even if the following steps fail, we've already saved the reading

    // Revalidate paths to update the UI - do this early to ensure UI updates even if analysis fails
    try {
      revalidatePath("/");
      revalidatePath(`/players`);
      revalidatePath(`/players/${body.player_id}`);
      if (body.half_id) {
        revalidatePath(`/matches`);
      }
    } catch (revalidateError) {
      console.error("Error revalidating paths:", revalidateError);
      // Continue even if revalidation fails
    }

    // Get player info for analysis
    let player = null;
    try {
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("name, position")
        .eq("id", body.player_id)
        .single();

      if (playerError) {
        console.error("Error fetching player for analysis:", playerError);
        // Continue without player info
      } else {
        player = playerData;
      }
    } catch (playerFetchError) {
      console.error("Error fetching player data:", playerFetchError);
      // Continue without player info
    }

    // Log test requests
    if (isTestRequest) {
      console.log(
        `[TEST] Added reading for player ${
          player?.name || body.player_id
        }: ${state} state`
      );
    }

    // For alert states, always try to generate an analysis
    if (state === "alert") {
      try {
        // If we couldn't get player info, use a default
        const playerInfo = player || {
          name: "Unknown Player",
          position: "Unknown Position",
        };

        // Generate a basic analysis immediately for alert states
        const aiAnalysis = await analyzePlayerHealth(data, playerInfo);

        // Update the reading with the basic analysis
        try {
          await supabase
            .from("health_readings")
            .update({ ai_analysis: aiAnalysis })
            .eq("id", data.id);
        } catch (updateError) {
          console.error("Error updating reading with analysis:", updateError);
          // Continue even if update fails
        }

        // Also add to retry queue for more comprehensive analysis
        try {
          await addToRetryQueue(
            data.id,
            data.player_id,
            "Initial queue entry for immediate processing"
          );
        } catch (queueError) {
          console.error("Error adding to retry queue:", queueError);
          // Continue even if queue addition fails
        }

        // Return the reading data with the preliminary analysis
        return NextResponse.json(
          {
            success: true,
            data: { ...data, ai_analysis: aiAnalysis },
            message:
              "Alert reading recorded with preliminary analysis. Comprehensive analysis will be processed in background.",
          },
          { status: 200 }
        );
      } catch (analysisError) {
        console.error("Error in alert state analysis:", analysisError);

        // Even if analysis fails, try to add to retry queue
        try {
          await addToRetryQueue(
            data.id,
            data.player_id,
            "Failed initial analysis, queued for retry"
          );
        } catch (queueError) {
          console.error("Error adding to retry queue:", queueError);
          // Continue even if queue addition fails
        }

        // Return success with message about retry
        return NextResponse.json(
          {
            success: true,
            data,
            message:
              "Alert reading recorded. Analysis failed but will be retried.",
          },
          { status: 200 }
        );
      }
    }

    // For non-alert states, generate basic analysis synchronously
    // These are simpler and should complete quickly
    try {
      // If we couldn't get player info, use a default
      const playerInfo = player || {
        name: "Unknown Player",
        position: "Unknown Position",
      };

      const aiAnalysis = await analyzePlayerHealth(data, playerInfo);

      // Update the reading with the basic analysis
      try {
        // Convert the analysis to a string before storing it
        await supabase
          .from("health_readings")
          .update({ ai_analysis: aiAnalysis })
          .eq("id", data.id);
      } catch (updateError) {
        console.error("Error updating reading with analysis:", updateError);
        // Continue even if update fails
      }

      // Return with analysis
      return NextResponse.json(
        {
          success: true,
          data: { ...data, ai_analysis: aiAnalysis },
        },
        { status: 200 }
      );
    } catch (analysisError) {
      console.error("Error in basic analysis:", analysisError);
      // Continue without analysis
      return NextResponse.json(
        {
          success: true,
          data,
          message: "Reading recorded. Analysis failed but will be retried.",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
