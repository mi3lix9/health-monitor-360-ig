import { type NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { generateEnhancedAnalysis } from "@/lib/enhanced-ai-analysis";
import { LogIn } from "lucide-react";

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerClient();
    const { playerId, halfId, readingId } = await request.json();

    // Validate the request body
    if (!playerId || !halfId || !readingId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the player info
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("*")
      .eq("id", playerId)
      .single();

    if (playerError) {
      console.error("Error fetching player:", playerError);
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Get the half info
    const { data: half, error: halfError } = await supabase
      .from("halves")
      .select("*")
      .eq("id", halfId)
      .single();

    if (halfError) {
      console.error("Error fetching half:", halfError);
      return NextResponse.json({ error: "Half not found" }, { status: 404 });
    }

    // Get all readings for this player during this half
    const { data: readings, error: readingsError } = await supabase
      .from("health_readings")
      .select("*")
      .eq("player_id", playerId)
      .eq("half_id", halfId)
      .order("timestamp", { ascending: true });

    if (readingsError) {
      console.error("Error fetching readings:", readingsError);
      return NextResponse.json(
        { error: "Failed to fetch readings" },
        { status: 500 }
      );
    }

    if (!readings || readings.length === 0) {
      return NextResponse.json(
        { error: "No readings found for this player in this half" },
        { status: 404 }
      );
    }

    // Get the current reading
    const { data: currentReading, error: currentReadingError } = await supabase
      .from("health_readings")
      .select("*")
      .eq("id", readingId)
      .single();

    if (currentReadingError) {
      console.error("Error fetching current reading:", currentReadingError);
      return NextResponse.json(
        { error: "Current reading not found" },
        { status: 404 }
      );
    }

    // Generate the enhanced analysis
    console.log("Generating enhanced analysis", process.env.OPENAI_API_KEY);

    const analysis = await generateEnhancedAnalysis(
      player,
      readings,
      currentReading,
      half
    );

    // Return the analysis
    return NextResponse.json({ success: true, analysis }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
