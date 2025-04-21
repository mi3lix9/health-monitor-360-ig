import { getBrowserClient } from "@/lib/supabase";
import type {
  HealthReading,
  Player,
  PlayerWithLatestReading,
  Match,
  Half,
  MatchStatistics,
} from "@/types";

// Helper function to handle Supabase errors consistently
async function handleSupabaseResponse<T>(
  promise: Promise<{ data: T | null; error: any }>,
  errorContext: string
): Promise<T> {
  try {
    const { data, error } = await promise;

    if (error) {
      console.error(`Error in ${errorContext}:`, error);
      throw new Error(error.message);
    }

    if (data === null) {
      throw new Error(`No data returned from ${errorContext}`);
    }

    return data;
  } catch (error) {
    console.error(`Error in ${errorContext}:`, error);
    throw error;
  }
}

// Fetch all players
export async function fetchAllPlayers(): Promise<Player[]> {
  try {
    const supabase = getBrowserClient();
    return (
      (await handleSupabaseResponse(
        supabase.from("players").select("*").order("name"),
        "fetchAllPlayers"
      )) || []
    );
  } catch (error) {
    console.error("Error in fetchAllPlayers:", error);
    return []; // Return empty array instead of throwing
  }
}

// Fetch a single player by ID
export async function fetchPlayerById(
  playerId: string
): Promise<Player | null> {
  try {
    if (!playerId) return null;

    const supabase = getBrowserClient();
    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("id", playerId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }
        console.error(`Error fetching player ${playerId}:`, error);
        return null; // Return null instead of throwing
      }

      return data;
    } catch (error) {
      console.error(`Error in fetchPlayerById for ${playerId}:`, error);
      return null; // Return null instead of throwing
    }
  } catch (error) {
    console.error(`Error in fetchPlayerById for ${playerId}:`, error);
    return null; // Return null instead of throwing
  }
}

// Fetch latest health reading for a player
export async function fetchLatestReadingForPlayer(
  playerId: string
): Promise<HealthReading | null> {
  try {
    if (!playerId) return null;

    const supabase = getBrowserClient();
    try {
      const { data, error } = await supabase
        .from("health_readings")
        .select("*")
        .eq("player_id", playerId)
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned - this is not an error for us
          return null;
        }
        console.error(
          `Error fetching latest reading for player ${playerId}:`,
          error
        );
        return null; // Return null instead of throwing
      }

      return data;
    } catch (error) {
      console.error(
        `Error in fetchLatestReadingForPlayer for ${playerId}:`,
        error
      );
      return null; // Return null instead of throwing
    }
  } catch (error) {
    console.error(
      `Error in fetchLatestReadingForPlayer for ${playerId}:`,
      error
    );
    return null; // Return null instead of throwing
  }
}

// Fetch all health readings for a player
export async function fetchReadingsForPlayer(
  playerId: string,
  limit = 10
): Promise<HealthReading[]> {
  try {
    if (!playerId) return [];

    const supabase = getBrowserClient();
    try {
      const { data, error } = await supabase
        .from("health_readings")
        .select("*")
        .eq("player_id", playerId)
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) {
        console.error(`Error fetching readings for player ${playerId}:`, error);
        return []; // Return empty array instead of throwing
      }

      return data || [];
    } catch (error) {
      console.error(`Error in fetchReadingsForPlayer for ${playerId}:`, error);
      return []; // Return empty array instead of throwing
    }
  } catch (error) {
    console.error(`Error in fetchReadingsForPlayer for ${playerId}:`, error);
    return []; // Return empty array instead of throwing
  }
}

// Fetch all players with their latest readings
export async function fetchPlayersWithLatestReadings(): Promise<
  PlayerWithLatestReading[]
> {
  try {
    const players = await fetchAllPlayers();

    const playersWithReadings = await Promise.all(
      players.map(async (player) => {
        const latestReading = await fetchLatestReadingForPlayer(player.id);
        return {
          ...player,
          latest_reading: latestReading || undefined,
        };
      })
    );

    return playersWithReadings;
  } catch (error) {
    console.error("Error in fetchPlayersWithLatestReadings:", error);
    return []; // Return empty array instead of throwing
  }
}

// Fetch health readings statistics
export async function fetchHealthReadingsStats() {
  try {
    const supabase = getBrowserClient();

    // Get total readings count
    const { count: totalCount, error: totalError } = await supabase
      .from("health_readings")
      .select("*", { count: "exact", head: true });

    if (totalError) throw new Error(totalError.message);

    // Get normal readings count
    const { count: normalCount, error: normalError } = await supabase
      .from("health_readings")
      .select("*", { count: "exact", head: true })
      .eq("state", "normal");

    if (normalError) throw new Error(normalError.message);

    // Get warning readings count
    const { count: warningCount, error: warningError } = await supabase
      .from("health_readings")
      .select("*", { count: "exact", head: true })
      .eq("state", "warning");

    if (warningError) throw new Error(warningError.message);

    // Get alert readings count
    const { count: alertCount, error: alertError } = await supabase
      .from("health_readings")
      .select("*", { count: "exact", head: true })
      .eq("state", "alert");

    if (alertError) throw new Error(alertError.message);

    return {
      totalCount: totalCount || 0,
      normalCount: normalCount || 0,
      warningCount: warningCount || 0,
      alertCount: alertCount || 0,
    };
  } catch (error) {
    console.error("Error in fetchHealthReadingsStats:", error);
    throw error;
  }
}

// Fetch recent health readings
export async function fetchRecentHealthReadings(
  limit = 50
): Promise<HealthReading[]> {
  try {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
      .from("health_readings")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent health readings:", error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchRecentHealthReadings:", error);
    throw error;
  }
}

// Add a new health reading
export async function addHealthReading(
  playerId: string,
  reading: Omit<
    HealthReading,
    "id" | "player_id" | "timestamp" | "created_at" | "ai_analysis" | "state"
  >,
  halfId?: string
): Promise<HealthReading | null> {
  try {
    const response = await fetch("/api/readings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        player_id: playerId,
        half_id: halfId,
        ...reading,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to add health reading";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If we can't parse the error as JSON, use the status text
        errorMessage = `${errorMessage}: ${response.statusText}`;
      }
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const data = await response.json();
      return data.data;
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error("Error in addHealthReading:", error);
    return null; // Return null instead of throwing
  }
}

// Add a new player
export async function addNewPlayer(
  player: Omit<Player, "id" | "created_at" | "updated_at">
): Promise<Player> {
  try {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
      .from("players")
      .insert([player])
      .select()
      .single();

    if (error) {
      console.error("Error adding player:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Error in addNewPlayer:", error);
    throw error;
  }
}

// Fetch all matches
export async function fetchAllMatches(): Promise<Match[]> {
  try {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: false });

    if (error) {
      console.error("Error fetching matches:", error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchAllMatches:", error);
    throw error;
  }
}

// Fetch a single match by ID with its halves
export async function fetchMatchWithHalves(matchId: string) {
  try {
    if (!matchId) return null;

    const supabase = getBrowserClient();

    // Get the match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError) {
      console.error(`Error fetching match ${matchId}:`, matchError);
      throw new Error(matchError.message);
    }

    // Get the halves for this match
    const { data: halves, error: halvesError } = await supabase
      .from("halves")
      .select("*")
      .eq("match_id", matchId)
      .order("half_number");

    if (halvesError) {
      console.error(`Error fetching halves for match ${matchId}:`, halvesError);
      throw new Error(halvesError.message);
    }

    return {
      ...match,
      halves: halves || [],
    };
  } catch (error) {
    console.error(`Error in fetchMatchWithHalves for ${matchId}:`, error);
    throw error;
  }
}

// Fetch all halves for a match
export async function fetchHalvesForMatch(matchId: string): Promise<Half[]> {
  try {
    if (!matchId) return [];

    const supabase = getBrowserClient();
    const { data, error } = await supabase
      .from("halves")
      .select("*")
      .eq("match_id", matchId)
      .order("half_number");

    if (error) {
      console.error(`Error fetching halves for match ${matchId}:`, error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error(`Error in fetchHalvesForMatch for ${matchId}:`, error);
    throw error;
  }
}

// Fetch a single half by ID with its readings
export async function fetchHalfWithReadings(halfId: string) {
  try {
    if (!halfId) return null;

    const supabase = getBrowserClient();

    // Get the half
    const { data: half, error: halfError } = await supabase
      .from("halves")
      .select("*")
      .eq("id", halfId)
      .single();

    if (halfError) {
      console.error(`Error fetching half ${halfId}:`, halfError);
      throw new Error(halfError.message);
    }

    // Get the readings for this half
    const { data: readings, error: readingsError } = await supabase
      .from("health_readings")
      .select("*")
      .eq("half_id", halfId)
      .order("timestamp", { ascending: false });

    if (readingsError) {
      console.error(
        `Error fetching readings for half ${halfId}:`,
        readingsError
      );
      throw new Error(readingsError.message);
    }

    return {
      ...half,
      readings: readings || [],
    };
  } catch (error) {
    console.error(`Error in fetchHalfWithReadings for ${halfId}:`, error);
    throw error;
  }
}

// Fetch match statistics
export async function fetchMatchStatistics(
  matchId?: string
): Promise<MatchStatistics[]> {
  try {
    const supabase = getBrowserClient();
    let query = supabase.from("match_statistics").select("*");

    if (matchId) {
      query = query.eq("match_id", matchId);
    }

    const { data, error } = await query.order("match_date", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching match statistics:", error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchMatchStatistics:", error);
    throw error;
  }
}

// Add a new match
export async function addMatch(
  match: Omit<Match, "id" | "created_at" | "updated_at">
): Promise<Match> {
  try {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
      .from("matches")
      .insert([match])
      .select()
      .single();

    if (error) {
      console.error("Error adding match:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Error in addMatch:", error);
    throw error;
  }
}

// Add a new half
export async function addHalf(
  half: Omit<Half, "id" | "created_at" | "updated_at">
): Promise<Half> {
  try {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
      .from("halves")
      .insert([half])
      .select()
      .single();

    if (error) {
      console.error("Error adding half:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Error in addHalf:", error);
    throw error;
  }
}

// Update a match
export async function updateMatch(
  matchId: string,
  updates: Partial<Omit<Match, "id" | "created_at" | "updated_at">>
): Promise<Match> {
  try {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
      .from("matches")
      .update(updates)
      .eq("id", matchId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating match ${matchId}:`, error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error(`Error in updateMatch for ${matchId}:`, error);
    throw error;
  }
}

// Update a half
export async function updateHalf(
  halfId: string,
  updates: Partial<Omit<Half, "id" | "created_at" | "updated_at">>
): Promise<Half> {
  try {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
      .from("halves")
      .update(updates)
      .eq("id", halfId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating half ${halfId}:`, error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error(`Error in updateHalf for ${halfId}:`, error);
    throw error;
  }
}

// Delete a match
export async function deleteMatch(matchId: string): Promise<boolean> {
  try {
    const supabase = getBrowserClient();
    const { error } = await supabase.from("matches").delete().eq("id", matchId);

    if (error) {
      console.error(`Error deleting match ${matchId}:`, error);
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.error(`Error in deleteMatch for ${matchId}:`, error);
    throw error;
  }
}

// Delete a half
export async function deleteHalf(halfId: string): Promise<boolean> {
  try {
    const supabase = getBrowserClient();
    const { error } = await supabase.from("halves").delete().eq("id", halfId);

    if (error) {
      console.error(`Error deleting half ${halfId}:`, error);
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.error(`Error in deleteHalf for ${halfId}:`, error);
    throw error;
  }
}

// Fetch readings for a specific half
export async function fetchReadingsForHalf(
  halfId: string
): Promise<HealthReading[]> {
  try {
    if (!halfId) return [];

    const supabase = getBrowserClient();
    const { data, error } = await supabase
      .from("health_readings")
      .select("*")
      .eq("half_id", halfId)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error(`Error fetching readings for half ${halfId}:`, error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error(`Error in fetchReadingsForHalf for ${halfId}:`, error);
    throw error;
  }
}
