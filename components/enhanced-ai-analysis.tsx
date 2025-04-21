"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
  Zap,
  Activity,
  Droplet,
  Utensils,
  Dumbbell,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useHalfWithReadings } from "@/lib/react-query-hooks";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import type { HealthReading, Player, EnhancedAIAnalysisResult } from "@/types";

type EnhancedAIAnalysisProps = {
  player: Player;
  currentReading: HealthReading;
  halfId?: string | null;
  isEmbedded?: boolean;
};

export function EnhancedAIAnalysis({
  player,
  currentReading,
  halfId,
  isEmbedded = false,
}: EnhancedAIAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<EnhancedAIAnalysisResult | null>(
    null
  );
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const { data: halfData, isLoading: isHalfLoading } = useHalfWithReadings(
    halfId || ""
  );

  // Check if we should show the enhanced analysis
  const shouldShowAnalysis = currentReading.state === "alert" && halfId;

  // Function to trigger the enhanced analysis
  const triggerAnalysis = async () => {
    if (!halfId) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/enhanced-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: player.id,
          halfId: halfId,
          readingId: currentReading.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate enhanced analysis");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      toast({
        title: "Analysis Complete",
        description: "Extra detailed analysis has been generated",
      });
    } catch (error) {
      console.error("Error generating enhanced analysis:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not generate enhanced analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Automatically trigger analysis when component mounts if in alert state
  useEffect(() => {
    console.log("shouldShowAnalysis", shouldShowAnalysis);
    console.log("analysis", analysis);
    console.log("isAnalyzing", isAnalyzing);
    console.log("halfId", halfId);
    console.log("halfData", halfData);

    if (shouldShowAnalysis && !analysis && !isAnalyzing) {
      // Check if we have enough readings for a comprehensive analysis
      if (halfData && halfData.readings && halfData.readings.length < 2) {
        // If we have limited data, set a preliminary analysis
        setAnalysis({
          summary: `Preliminary analysis based on limited data (${halfData.readings.length} reading). More readings are needed for comprehensive analysis.`,
          key_findings: [
            "Player is currently in ALERT state",
            "Insufficient historical data for trend analysis",
            "Monitoring should be increased in frequency",
          ],
          trend_analysis:
            "Trend analysis not available due to limited historical data. Continue monitoring to establish trends.",
          recommendations: [
            "Increase monitoring frequency",
            "Consider player removal as precautionary measure",
            "Prepare medical staff for potential intervention",
            "Document all symptoms and observations",
          ],
          estimated_recovery:
            "Cannot be determined with current data. Medical evaluation required.",
          performance_impact: {
            current_capacity: 50,
            endurance_impact: 65,
            speed_impact: 60,
            decision_making_impact: 55,
            position_specific_metrics: {
              overall_performance: 45,
            },
          },
          primary_limiting_factors: [
            "Insufficient data for comprehensive analysis",
            "Acute physiological stress indicators",
            "Potential dehydration",
          ],
          secondary_concerns: [
            "Risk of injury due to compromised state",
            "Potential for rapid deterioration",
            "Incomplete performance baseline",
          ],
          recovery_optimization: [
            "Immediate medical evaluation",
            "Establish baseline recovery metrics",
            "Implement standard recovery protocols",
          ],
          training_adjustments: [
            "Pause high-intensity training",
            "Implement active recovery",
            "Gradual return to play protocol",
          ],
          nutrition_recommendations: [
            "Immediate hydration with electrolytes",
            "Anti-inflammatory nutrition protocol",
            "Carbohydrate replenishment",
          ],
          confidence_level: 60,
          readings_analyzed: halfData.readings.length,
          timestamp: new Date().toISOString(),
        });
      } else {
        // If we have enough data, trigger the full analysis
        triggerAnalysis();
      }
    }
  }, [shouldShowAnalysis, analysis, isAnalyzing, halfData]);

  if (!shouldShowAnalysis) {
    return null;
  }

  if (isHalfLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  const matchHalf = halfData ? `Half ${halfData.half_number}` : "Current Half";

  // Render a simplified version for embedding in other components
  if (isEmbedded) {
    return (
      <div className="space-y-4">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-2">
            <div className="animate-pulse flex items-center justify-center h-12 w-12 rounded-full bg-red-200 dark:bg-red-800">
              <Brain className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-center text-red-700 dark:text-red-400 text-sm">
              Analyzing player data...
            </p>
          </div>
        ) : analysis ? (
          <>
            <div className="rounded-lg border border-red-200 dark:border-red-800 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <div className="font-medium text-red-700 dark:text-red-400 text-sm">
                  Critical Assessment
                </div>
                <Badge
                  variant="outline"
                  className="ml-auto bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 text-xs"
                >
                  {analysis.confidence_level}% Confidence
                </Badge>
              </div>
              <p className="text-red-700 dark:text-red-400 text-sm">
                {analysis.summary}
              </p>
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Current Capacity</div>
              <div className="text-sm">
                {analysis.performance_impact.current_capacity}%
              </div>
            </div>
            <Progress
              value={analysis.performance_impact.current_capacity}
              className="h-2 mb-4"
            />

            {analysis.key_findings.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-sm">Key Findings</h4>
                <ul className="space-y-1">
                  {analysis.key_findings.slice(0, 3).map((finding, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="h-5 w-5 flex-shrink-0 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center text-xs font-medium text-red-700 dark:text-red-400">
                        {index + 1}
                      </div>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.primary_limiting_factors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-sm">
                  Primary Limiting Factors
                </h4>
                <ul className="space-y-1">
                  {analysis.primary_limiting_factors
                    .slice(0, 2)
                    .map((factor, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <div className="h-5 w-5 flex-shrink-0 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center text-xs font-medium text-red-700 dark:text-red-400">
                          <Zap className="h-3 w-3" />
                        </div>
                        <span>{factor}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={triggerAnalysis}
                disabled={isAnalyzing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isAnalyzing ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 space-y-2">
            <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
            <p className="text-center text-sm">
              No enhanced analysis available
            </p>
            <Button size="sm" onClick={triggerAnalysis} disabled={isAnalyzing}>
              Generate Analysis
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Full standalone version
  return (
    <Card className="border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-red-600 dark:text-red-400" />
            <CardTitle>Extra Detailed Analysis</CardTitle>
          </div>
          <Collapsible>
            <CollapsibleTrigger asChild onClick={() => setIsOpen(!isOpen)}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle enhanced analysis</span>
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
        <CardDescription className="text-sm">
          Comprehensive analysis of player performance during {matchHalf}
          {halfData && halfData.start_time && (
            <span className="ml-2 text-xs">
              <Clock className="h-3 w-3 inline mr-1" />
              {format(new Date(halfData.start_time), "h:mm a")}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent>
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="animate-pulse flex items-center justify-center h-16 w-16 rounded-full bg-red-200 dark:bg-red-800">
                  <Brain className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-center text-red-700 dark:text-red-400 font-medium">
                  Analyzing player performance data...
                </p>
                <p className="text-center text-sm text-red-600/70 dark:text-red-400/70">
                  Examining {halfData?.readings?.length || "all"} readings from{" "}
                  {matchHalf}
                </p>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-red-200 dark:border-red-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <div className="font-medium text-red-700 dark:text-red-400">
                      Critical Assessment
                    </div>
                    <Badge
                      variant="outline"
                      className="ml-auto bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                    >
                      {analysis.confidence_level}% Confidence
                    </Badge>
                  </div>
                  <p className="text-red-700 dark:text-red-400">
                    {analysis.summary}
                  </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
                    <TabsTrigger value="optimization">Optimization</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    {analysis.key_findings.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Key Findings</h4>
                        <ul className="space-y-2">
                          {analysis.key_findings.map((finding, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="h-5 w-5 flex-shrink-0 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center text-xs font-medium text-red-700 dark:text-red-400">
                                {index + 1}
                              </div>
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.trend_analysis && (
                      <div>
                        <h4 className="font-medium mb-2">Trend Analysis</h4>
                        <p className="text-sm">{analysis.trend_analysis}</p>
                      </div>
                    )}

                    {analysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recommendations</h4>
                        <ul className="space-y-2">
                          {analysis.recommendations.map(
                            (recommendation, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <div className="h-5 w-5 flex-shrink-0 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center text-xs font-medium text-red-700 dark:text-red-400">
                                  {index + 1}
                                </div>
                                <span>{recommendation}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {analysis.estimated_recovery && (
                      <div className="rounded-lg border border-red-200 dark:border-red-800 p-4 mt-4">
                        <h4 className="font-medium mb-2">Estimated Recovery</h4>
                        <p className="text-sm">{analysis.estimated_recovery}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="performance" className="space-y-4 mt-4">
                    <div>
                      <h4 className="font-medium mb-4">
                        Performance Impact Analysis
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-medium">
                              Current Capacity
                            </div>
                            <div className="text-sm">
                              {analysis.performance_impact.current_capacity}%
                            </div>
                          </div>
                          <Progress
                            value={analysis.performance_impact.current_capacity}
                            className="h-2"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-medium">
                              Endurance Impact
                            </div>
                            <div className="text-sm">
                              {analysis.performance_impact.endurance_impact}%
                            </div>
                          </div>
                          <Progress
                            value={analysis.performance_impact.endurance_impact}
                            className="h-2 bg-gray-200 dark:bg-gray-700"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Higher value indicates greater negative impact
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-medium">
                              Speed Impact
                            </div>
                            <div className="text-sm">
                              {analysis.performance_impact.speed_impact}%
                            </div>
                          </div>
                          <Progress
                            value={analysis.performance_impact.speed_impact}
                            className="h-2 bg-gray-200 dark:bg-gray-700"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Higher value indicates greater negative impact
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-medium">
                              Decision Making Impact
                            </div>
                            <div className="text-sm">
                              {
                                analysis.performance_impact
                                  .decision_making_impact
                              }
                              %
                            </div>
                          </div>
                          <Progress
                            value={
                              analysis.performance_impact.decision_making_impact
                            }
                            className="h-2 bg-gray-200 dark:bg-gray-700"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Higher value indicates greater negative impact
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">
                        Position-Specific Metrics
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(
                          analysis.performance_impact.position_specific_metrics
                        ).map(([key, value]) => (
                          <div
                            key={key}
                            className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <div className="text-sm font-medium capitalize mb-1">
                              {key.replace(/_/g, " ")}
                            </div>
                            <Progress value={value} className="h-2" />
                            <div className="text-xs text-right mt-1">
                              {value}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="bottlenecks" className="space-y-4 mt-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <h4 className="font-medium">
                          Primary Limiting Factors
                        </h4>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <ul className="space-y-2">
                          {analysis.primary_limiting_factors.map(
                            (factor, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <div className="h-5 w-5 flex-shrink-0 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center text-xs font-medium text-red-700 dark:text-red-400">
                                  {index + 1}
                                </div>
                                <span>{factor}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <h4 className="font-medium">Secondary Concerns</h4>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <ul className="space-y-2">
                          {analysis.secondary_concerns.map((concern, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="h-5 w-5 flex-shrink-0 rounded-full bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center text-xs font-medium text-yellow-700 dark:text-yellow-400">
                                {index + 1}
                              </div>
                              <span>{concern}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="optimization" className="space-y-4 mt-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Droplet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="font-medium">Recovery Optimization</h4>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <ul className="space-y-2">
                          {analysis.recovery_optimization.map(
                            (strategy, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <div className="h-5 w-5 flex-shrink-0 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-xs font-medium text-blue-700 dark:text-blue-400">
                                  {index + 1}
                                </div>
                                <span>{strategy}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Dumbbell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <h4 className="font-medium">Training Adjustments</h4>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <ul className="space-y-2">
                          {analysis.training_adjustments.map(
                            (adjustment, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <div className="h-5 w-5 flex-shrink-0 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center text-xs font-medium text-purple-700 dark:text-purple-400">
                                  {index + 1}
                                </div>
                                <span>{adjustment}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Utensils className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <h4 className="font-medium">
                          Nutrition Recommendations
                        </h4>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <ul className="space-y-2">
                          {analysis.nutrition_recommendations.map(
                            (recommendation, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <div className="h-5 w-5 flex-shrink-0 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center text-xs font-medium text-green-700 dark:text-green-400">
                                  {index + 1}
                                </div>
                                <span>{recommendation}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400" />
                <p className="text-center">No enhanced analysis available</p>
                <Button onClick={triggerAnalysis} disabled={isAnalyzing}>
                  Generate Analysis
                </Button>
              </div>
            )}
          </CardContent>
          {analysis && (
            <CardFooter className="flex flex-col sm:flex-row sm:justify-between border-t border-red-200 dark:border-red-800 pt-4 gap-2">
              <div className="text-xs text-red-600/70 dark:text-red-400/70">
                Analysis based on {analysis.readings_analyzed} readings from{" "}
                {matchHalf}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={triggerAnalysis}
                disabled={isAnalyzing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isAnalyzing ? "animate-spin" : ""
                  }`}
                />
                Refresh Analysis
              </Button>
            </CardFooter>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
