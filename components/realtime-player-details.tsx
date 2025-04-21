"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { HealthMetrics } from "@/components/health-metrics";
import { EnhancedAIAnalysis } from "@/components/enhanced-ai-analysis";
import { AddReadingForm } from "@/components/add-reading-form";
import { usePlayer, usePlayerReadings } from "@/lib/react-query-hooks";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HealthReadingTimeline } from "@/components/health-reading-timeline";
import { PlayerHealthChart } from "@/components/charts/player-health-chart";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type RealtimePlayerDetailsProps = {
  id: string;
};

export function RealtimePlayerDetails({ id }: RealtimePlayerDetailsProps) {
  const { data: player, isLoading: isPlayerLoading } = usePlayer(id);
  const {
    data: readings,
    isLoading: isReadingsLoading,
    refetch,
  } = usePlayerReadings(id, 20);
  const [isNewReading, setIsNewReading] = useState(false);
  const [prevReadingId, setPrevReadingId] = useState<string | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Set the default tab based on the URL parameter
  const defaultTab =
    tabParam &&
    ["overview", "readings", "charts", "add-reading"].includes(tabParam)
      ? tabParam
      : "overview";

  // Function to manually refresh data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["player", id] }),
        queryClient.invalidateQueries({ queryKey: ["playersWithReadings"] }),
      ]);
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
  }, [id, refetch, queryClient, toast]);

  // Set up periodic refresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch().catch((error) =>
        console.error("Error auto-refreshing player readings:", error)
      );
    }, 1000); // Refresh every 1 second

    return () => clearInterval(intervalId);
  }, [refetch]);

  // Check if this is a new reading
  useEffect(() => {
    if (readings && readings.length > 0 && readings[0].id !== prevReadingId) {
      setIsNewReading(true);
      setPrevReadingId(readings[0].id);

      // Reset the new indicator after 5 seconds
      const timer = setTimeout(() => {
        setIsNewReading(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [readings, prevReadingId]);

  if (isPlayerLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-4 w-32" />
        </div>

        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!player) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Not Found</CardTitle>
          <CardDescription>
            The player you are looking for does not exist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/players">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Players
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const latestReading = readings && readings.length > 0 ? readings[0] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/players">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Players
          </Link>
        </Button>

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

      {/* Player header with risk assessment */}
      <Card
        className={
          latestReading
            ? latestReading.state === "alert"
              ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
              : latestReading.state === "warning"
              ? "border-yellow-300 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20"
              : "border-green-300 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
            : ""
        }
      >
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-24 w-24">
              <AvatarImage src={player.image_url || ""} alt={player.name} />
              <AvatarFallback className="text-2xl">
                {player.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{player.name}</h1>
                <div className="text-xl text-muted-foreground">
                  #{player.jersey_number}
                </div>
                {latestReading && (
                  <StatusBadge
                    status={latestReading.state}
                    className="ml-auto"
                  />
                )}
                {isNewReading && (
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary"
                  >
                    New reading
                  </Badge>
                )}
              </div>

              <div className="text-muted-foreground mb-4">
                {player.position} • {player.team}
              </div>

              {latestReading && latestReading.ai_analysis ? (
                <div
                  className={`rounded-lg p-4 ${
                    latestReading.state === "alert"
                      ? "bg-red-100 border border-red-200 dark:bg-red-950/40 dark:border-red-800"
                      : latestReading.state === "warning"
                      ? "bg-yellow-100 border border-yellow-200 dark:bg-yellow-950/40 dark:border-yellow-800"
                      : "bg-green-100 border border-green-200 dark:bg-green-950/40 dark:border-green-800"
                  }`}
                >
                  <div className="font-medium mb-2">
                    {latestReading.state === "alert"
                      ? "Critical Assessment"
                      : latestReading.state === "warning"
                      ? "Warning Assessment"
                      : "Health Assessment"}
                  </div>
                  <div className="text-sm">
                    {latestReading.ai_analysis.summary}
                  </div>

                  {latestReading.ai_analysis.priority_action &&
                    latestReading.state === "alert" && (
                      <div className="mt-3 font-medium text-red-700 dark:text-red-400 border-t border-red-200 dark:border-red-800 pt-3">
                        Priority Action:{" "}
                        {latestReading.ai_analysis.priority_action}
                      </div>
                    )}
                </div>
              ) : latestReading ? (
                <div className="rounded-lg p-4 bg-gray-100 border border-gray-200 dark:bg-gray-800/50 dark:border-gray-700">
                  <div className="font-medium mb-2">Health Status</div>
                  <div className="text-sm">
                    Basic health metrics are being monitored. No detailed
                    analysis available.
                  </div>
                </div>
              ) : (
                <div className="rounded-lg p-4 bg-gray-100 border border-gray-200 dark:bg-gray-800/50 dark:border-gray-700">
                  <div className="font-medium mb-2">No Health Data</div>
                  <div className="text-sm">
                    This player doesn't have any health readings yet.
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced AI Analysis - Show only when player is in alert state and has a half_id */}
      {latestReading &&
        latestReading.state === "alert" &&
        latestReading.half_id && (
          <EnhancedAIAnalysis
            player={player}
            currentReading={latestReading}
            halfId={latestReading.half_id}
          />
        )}

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="readings">History</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="add-reading">Add Reading</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isReadingsLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : latestReading ? (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Latest Health Metrics</CardTitle>
                    <CardDescription>
                      Recorded{" "}
                      {new Date(latestReading.timestamp).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={isNewReading ? "animate-pulse" : ""}>
                      <HealthMetrics reading={latestReading} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>AI Analysis</CardTitle>
                    <CardDescription>
                      Comprehensive analysis of player health metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={isNewReading ? "animate-pulse" : ""}>
                      <EnhancedAIAnalysis
                        player={player}
                        currentReading={latestReading}
                        halfId={latestReading.half_id}
                        isEmbedded={true}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {readings && readings.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Readings</CardTitle>
                    <CardDescription>
                      Last {Math.min(5, readings.length - 1)} health readings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <HealthReadingTimeline readings={readings.slice(1, 6)} />
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Health Data</CardTitle>
                <CardDescription>
                  This player doesn't have any health readings yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={`/players/${id}?tab=add-reading`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Reading
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="readings" className="space-y-6">
          {isReadingsLoading ? (
            <Skeleton className="h-[600px] w-full" />
          ) : readings && readings.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Health Reading History</CardTitle>
                <CardDescription>
                  Complete history of health readings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HealthReadingTimeline readings={readings} showAll />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Health Data</CardTitle>
                <CardDescription>
                  This player doesn't have any health readings yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={`/players/${id}?tab=add-reading`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Reading
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          {isReadingsLoading ? (
            <Skeleton className="h-[600px] w-full" />
          ) : readings && readings.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Health Metrics Trends</CardTitle>
                <CardDescription>
                  Visual representation of health metrics over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px]">
                  <PlayerHealthChart readings={readings} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Chart Data</CardTitle>
                <CardDescription>
                  This player doesn't have enough health readings to generate
                  charts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={`/players/${id}?tab=add-reading`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Reading
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="add-reading">
          <Card>
            <CardHeader>
              <CardTitle>Add New Health Reading</CardTitle>
              <CardDescription>
                Record the latest health metrics for {player.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddReadingForm playerId={id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
