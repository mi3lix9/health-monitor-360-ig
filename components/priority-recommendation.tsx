import { AlertTriangle, CheckCircle, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { AIAnalysis } from "@/types"

type PriorityRecommendationProps = {
  analysis: AIAnalysis | undefined | null
}

export function PriorityRecommendation({ analysis }: PriorityRecommendationProps) {
  if (!analysis || !analysis.priority_action) return null

  return (
    <Alert
      className={
        analysis.risk_level === "low"
          ? "border-green-500 bg-green-50"
          : analysis.risk_level === "medium"
            ? "border-yellow-500 bg-yellow-50"
            : "border-red-500 bg-red-50"
      }
    >
      {analysis.risk_level === "low" && <CheckCircle className="h-5 w-5 text-green-500" />}
      {analysis.risk_level === "medium" && <Info className="h-5 w-5 text-yellow-500" />}
      {analysis.risk_level === "high" && <AlertTriangle className="h-5 w-5 text-red-500" />}
      <AlertTitle
        className={
          analysis.risk_level === "low"
            ? "text-green-800"
            : analysis.risk_level === "medium"
              ? "text-yellow-800"
              : "text-red-800"
        }
      >
        Priority Action
      </AlertTitle>
      <AlertDescription
        className={
          analysis.risk_level === "low"
            ? "text-green-700"
            : analysis.risk_level === "medium"
              ? "text-yellow-700"
              : "text-red-700"
        }
      >
        {analysis.priority_action}
      </AlertDescription>
    </Alert>
  )
}
