"use client";

import { useEffect, useState, useCallback } from "react";
import { usePlayersWithReadings } from "@/lib/react-query-hooks";
import { PlayerCard } from "@/components/player-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { PlayerWithLatestReading } from "@/types";

type RealtimePlayersProps = {
  filterState?: "normal" | "warning" | "alert";
  limit?: number;
};

export function RealtimePlayers({ filterState, limit }: RealtimePlayersProps) {
  const { data: players, isLoading, error, refetch } = usePlayersWithReadings();
  const [sortedPlayers, setSortedPlayers] = useState<PlayerWithLatestReading[]>(
    []
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Function to manually refresh data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Data refreshed",
        description: "The latest player data has been loaded",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh failed",
        description: "Could not refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, toast]);

  // Set up periodic refresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch().catch((error) =>
        console.error("Error auto-refreshing players:", error)
      );
    }, 1000); // Refresh every 1 second

    return () => clearInterval(intervalId);
  }, [refetch]);

  // Sort and filter players
  useEffect(() => {
    if (players) {
      let filtered = [...players];

      // Apply filter if specified
      if (filterState) {
        filtered = filtered.filter(
          (p) => p.latest_reading?.state === filterState
        );
      }

      // Sort by status and then by name
      const sorted = filtered.sort((a, b) => {
        // First sort by status
        const statusOrder: Record<string, number> = {
          alert: 0,
          warning: 1,
          normal: 2,
          undefined: 3,
        };
        const statusA = a.latest_reading?.state || "undefined";
        const statusB = b.latest_reading?.state || "undefined";

        if (statusOrder[statusA] !== statusOrder[statusB]) {
          return statusOrder[statusA] - statusOrder[statusB];
        }

        // Then sort by name
        return a.name.localeCompare(b.name);
      });

      // Apply limit if specified
      setSortedPlayers(limit ? sorted.slice(0, limit) : sorted);
    }
  }, [players, filterState, limit]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: limit || 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px] rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load players: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!players || players.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No players found</AlertTitle>
        <AlertDescription>
          There are no players in the system. Add a player to get started.
        </AlertDescription>
      </Alert>
    );
  }

  if (sortedPlayers.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No matching players</AlertTitle>
        <AlertDescription>
          {filterState
            ? `No players with ${filterState} status found.`
            : "No players match the current filter."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPlayers.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}
