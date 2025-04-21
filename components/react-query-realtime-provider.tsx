"use client";

import { useRealtimeUpdates } from "@/lib/react-query-hooks";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

export function ReactQueryRealtimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = useQueryClient();

  // Set up real-time subscriptions
  useRealtimeUpdates();

  // Set up periodic refetching for critical data
  useEffect(() => {
    // Refetch critical data every 30 seconds to ensure UI stays updated
    // even if real-time subscriptions fail
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["playersWithReadings"] });
      queryClient.invalidateQueries({ queryKey: ["healthStats"] });
      queryClient.invalidateQueries({ queryKey: ["recentReadings"] });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [queryClient]);

  return <>{children}</>;
}
