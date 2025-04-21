"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBrowserClient } from "./supabase";
import type { HealthReading, Half, Match } from "@/types";
import {
  addHealthReading,
  // New imports for matches and halves
  fetchAllMatches,
  fetchMatchWithHalves,
  fetchHalvesForMatch,
  fetchHalfWithReadings,
  fetchMatchStatistics,
  fetchReadingsForHalf,
  addMatch,
  addHalf,
  updateMatch,
  updateHalf,
  deleteMatch,
  deleteHalf,
  fetchAllPlayers,
  fetchPlayerById,
  fetchHealthReadingsStats,
  fetchPlayersWithLatestReadings,
  fetchRecentHealthReadings,
  fetchReadingsForPlayer,
} from "@/lib/api-service";

// Define query keys directly in this file
const queryKeys = {
  players: "players",
  player: (id: string) => ["player", id],
  latestReading: (playerId: string) => ["latestReading", playerId],
  readings: (playerId: string) => ["readings", playerId],
  playersWithReadings: "playersWithReadings",
  healthStats: "healthStats",
  recentReadings: "recentReadings",
  // New query keys for matches and halves
  matches: "matches",
  match: (id: string) => ["match", id],
  matchWithHalves: (id: string) => ["matchWithHalves", id],
  halves: (matchId: string) => ["halves", matchId],
  half: (id: string) => ["half", id],
  halfWithReadings: (id: string) => ["halfWithReadings", id],
  matchStatistics: (matchId?: string) =>
    matchId ? ["matchStatistics", matchId] : ["matchStatistics"],
  readingsForHalf: (halfId: string) => ["readingsForHalf", halfId],
};

// Hook for fetching a single player by ID
export function usePlayer(playerId: string) {
  return useQuery({
    queryKey: queryKeys.player(playerId),
    queryFn: () => fetchPlayerById(playerId),
    enabled: !!playerId,
  });
}

// Hook for fetching player readings
export function usePlayerReadings(playerId: string, limit = 10) {
  return useQuery({
    queryKey: [...queryKeys.readings(playerId), limit],
    queryFn: () => fetchReadingsForPlayer(playerId, limit),
    enabled: !!playerId,
  });
}

// Hook for fetching health reading statistics
export function useHealthStats() {
  return useQuery({
    queryKey: [queryKeys.healthStats],
    queryFn: async () => {
      const stats = await fetchHealthReadingsStats();
      return {
        normalCount: stats.normalCount || 0,
        warningCount: stats.warningCount || 0,
        alertCount: stats.alertCount || 0,
        totalCount: stats.totalCount || 0,
      };
    },
  });
}

// Hook for fetching all players
export function usePlayers() {
  return useQuery({
    queryKey: [queryKeys.players],
    queryFn: fetchAllPlayers,
  });
}

// Hook for fetching players with their latest readings
export function usePlayersWithReadings() {
  return useQuery({
    queryKey: [queryKeys.playersWithReadings],
    queryFn: fetchPlayersWithLatestReadings,
  });
}

// Alias for backward compatibility
export const usePlayersWithLatestReadings = usePlayersWithReadings;

// Hook for fetching recent health readings
export function useRecentHealthReadings(limit = 50) {
  return useQuery({
    queryKey: [queryKeys.recentReadings, limit],
    queryFn: () => fetchRecentHealthReadings(limit),
  });
}

// Alias for backward compatibility
export function useRecentReadings(limit = 50) {
  return useRecentHealthReadings(limit);
}

// Hook for fetching all matches
export function useMatches() {
  return useQuery({
    queryKey: [queryKeys.matches],
    queryFn: fetchAllMatches,
  });
}

// Hook for fetching a single match with its halves
export function useMatchWithHalves(matchId: string) {
  return useQuery({
    queryKey: queryKeys.matchWithHalves(matchId),
    queryFn: () => fetchMatchWithHalves(matchId),
    enabled: !!matchId,
  });
}

// Hook for fetching halves for a match
export function useHalvesForMatch(matchId: string) {
  return useQuery({
    queryKey: queryKeys.halves(matchId),
    queryFn: () => fetchHalvesForMatch(matchId),
    enabled: !!matchId,
  });
}

// Hook for fetching a half with its readings
export function useHalfWithReadings(halfId: string) {
  return useQuery({
    queryKey: queryKeys.halfWithReadings(halfId),
    queryFn: () => fetchHalfWithReadings(halfId),
    enabled: !!halfId,
  });
}

// Hook for fetching match statistics
export function useMatchStatistics(matchId?: string) {
  return useQuery({
    queryKey: queryKeys.matchStatistics(matchId),
    queryFn: () => fetchMatchStatistics(matchId),
  });
}

// Hook for fetching readings for a half
export function useReadingsForHalf(halfId: string) {
  return useQuery({
    queryKey: queryKeys.readingsForHalf(halfId),
    queryFn: () => fetchReadingsForHalf(halfId),
    enabled: !!halfId,
  });
}

// Hook for adding a match
export function useAddMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (match: Omit<Match, "id" | "created_at" | "updated_at">) =>
      addMatch(match),
    onSuccess: () => {
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: [queryKeys.matches] });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.matchStatistics()],
      });
    },
  });
}

// Hook for adding a half
export function useAddHalf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (half: Omit<Half, "id" | "created_at" | "updated_at">) =>
      addHalf(half),
    onSuccess: (data) => {
      // Invalidate affected queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.halves(data.match_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.matchWithHalves(data.match_id),
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.matchStatistics(data.match_id)],
      });
    },
  });
}

// Hook for updating a match
export function useUpdateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      matchId,
      updates,
    }: {
      matchId: string;
      updates: Partial<Omit<Match, "id" | "created_at" | "updated_at">>;
    }) => updateMatch(matchId, updates),
    onSuccess: (data) => {
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: [queryKeys.matches] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.matchWithHalves(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.matchStatistics(data.id)],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.matchStatistics()],
      });
    },
  });
}

// Hook for updating a half
export function useUpdateHalf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      halfId,
      updates,
    }: {
      halfId: string;
      updates: Partial<Omit<Half, "id" | "created_at" | "updated_at">>;
    }) => updateHalf(halfId, updates),
    onSuccess: (data) => {
      // Invalidate affected queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.halves(data.match_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.halfWithReadings(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.matchWithHalves(data.match_id),
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.matchStatistics(data.match_id)],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.matchStatistics()],
      });
    },
  });
}

// Hook for deleting a match
export function useDeleteMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: string) => deleteMatch(matchId),
    onSuccess: (_, matchId) => {
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: [queryKeys.matches] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.matchWithHalves(matchId),
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.matchStatistics()],
      });
    },
  });
}

// Hook for deleting a half
export function useDeleteHalf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ halfId, matchId }: { halfId: string; matchId: string }) =>
      deleteHalf(halfId),
    onSuccess: (_, { halfId, matchId }) => {
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: queryKeys.halves(matchId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.halfWithReadings(halfId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.matchWithHalves(matchId),
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.matchStatistics(matchId)],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.matchStatistics()],
      });
    },
  });
}

// Update the useAddHealthReading hook to accept half_id
export function useAddHealthReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      playerId,
      reading,
      halfId,
    }: {
      playerId: string;
      reading: Omit<
        HealthReading,
        | "id"
        | "player_id"
        | "timestamp"
        | "created_at"
        | "ai_analysis"
        | "state"
      >;
      halfId?: string;
    }) => addHealthReading(playerId, reading, halfId),
    onSuccess: (data, variables) => {
      // Invalidate affected queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.latestReading(variables.playerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.readings(variables.playerId),
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.playersWithReadings],
      });
      queryClient.invalidateQueries({ queryKey: [queryKeys.healthStats] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.recentReadings] });

      // If half_id is provided, invalidate related queries
      if (variables.halfId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.readingsForHalf(variables.halfId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.halfWithReadings(variables.halfId),
        });
      }
    },
  });
}

// Update the real-time updates hook to include better error handling
export function useRealtimeUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let healthReadingsSubscription: any = null;
    let playersSubscription: any = null;
    let matchesSubscription: any = null;
    let halvesSubscription: any = null;

    try {
      const supabase = getBrowserClient();

      // Subscribe to health readings changes
      healthReadingsSubscription = supabase
        .channel("health_readings_changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "health_readings",
          },
          async (payload) => {
            try {
              if (payload.new) {
                const newReading = payload.new as HealthReading;

                // Update the cache with the new reading
                queryClient.setQueryData(
                  queryKeys.latestReading(newReading.player_id),
                  newReading
                );

                // Update the readings list for this player
                queryClient.setQueryData<HealthReading[]>(
                  queryKeys.readings(newReading.player_id),
                  (old) => {
                    if (!old) return [newReading];
                    return [newReading, ...old].slice(0, 10);
                  }
                );

                // If half_id is provided, update related queries
                if (newReading.half_id) {
                  queryClient.invalidateQueries({
                    queryKey: queryKeys.readingsForHalf(newReading.half_id),
                  });
                  queryClient.invalidateQueries({
                    queryKey: queryKeys.halfWithReadings(newReading.half_id),
                  });
                }

                // Invalidate affected queries
                queryClient.invalidateQueries({
                  queryKey: ["playersWithReadings"],
                });
                queryClient.invalidateQueries({ queryKey: ["healthStats"] });
                queryClient.invalidateQueries({ queryKey: ["recentReadings"] });
                queryClient.invalidateQueries({
                  queryKey: ["matchStatistics"],
                });

                // Force refetch player data to ensure it's up to date
                queryClient.invalidateQueries({
                  queryKey: ["player", newReading.player_id],
                });
              }
            } catch (error) {
              console.error(
                "Error processing real-time health reading update:",
                error
              );
            }
          }
        )
        .subscribe((status: any) => {
          if (status === "SUBSCRIPTION_ERROR") {
            console.error("Subscription error for health readings");
            // Try to reconnect after a delay
            setTimeout(() => {
              if (healthReadingsSubscription) {
                supabase.removeChannel(healthReadingsSubscription);
                healthReadingsSubscription = null;
              }
            }, 5000);
          }
        });

      // Subscribe to players changes with error handling
      playersSubscription = supabase
        .channel("players_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "players",
          },
          () => {
            try {
              // Invalidate affected queries
              queryClient.invalidateQueries({ queryKey: ["players"] });
              queryClient.invalidateQueries({
                queryKey: ["playersWithReadings"],
              });
            } catch (error) {
              console.error("Error processing real-time player update:", error);
            }
          }
        )
        .subscribe();

      // Subscribe to matches changes with error handling
      matchesSubscription = supabase
        .channel("matches_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "matches",
          },
          () => {
            try {
              // Invalidate affected queries
              queryClient.invalidateQueries({ queryKey: ["matches"] });
              queryClient.invalidateQueries({ queryKey: ["matchStatistics"] });
            } catch (error) {
              console.error("Error processing real-time match update:", error);
            }
          }
        )
        .subscribe();

      // Subscribe to halves changes with error handling
      halvesSubscription = supabase
        .channel("halves_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "halves",
          },
          (payload) => {
            try {
              if (payload.new) {
                const half = payload.new as Half;

                // Invalidate affected queries
                queryClient.invalidateQueries({
                  queryKey: queryKeys.halves(half.match_id),
                });
                queryClient.invalidateQueries({
                  queryKey: queryKeys.matchWithHalves(half.match_id),
                });
                queryClient.invalidateQueries({
                  queryKey: ["matchStatistics", half.match_id],
                });
                queryClient.invalidateQueries({
                  queryKey: ["matchStatistics"],
                });
              }
            } catch (error) {
              console.error("Error processing real-time half update:", error);
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error("Error setting up real-time subscriptions:", error);
    }

    return () => {
      try {
        const supabase = getBrowserClient();
        if (healthReadingsSubscription)
          supabase.removeChannel(healthReadingsSubscription);
        if (playersSubscription) supabase.removeChannel(playersSubscription);
        if (matchesSubscription) supabase.removeChannel(matchesSubscription);
        if (halvesSubscription) supabase.removeChannel(halvesSubscription);
      } catch (error) {
        console.error("Error cleaning up real-time subscriptions:", error);
      }
    };
  }, [queryClient]);
}
