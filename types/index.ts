export type Player = {
  id: string
  name: string
  position: string
  team: string
  jersey_number: number
  image_url?: string
  created_at: string
  updated_at: string
}

export type HealthReading = {
  id: string
  player_id: string
  temperature: number
  heart_rate: number
  blood_oxygen: number
  hydration: number
  respiration: number
  fatigue: number
  timestamp: string
  state: "normal" | "warning" | "alert"
  ai_analysis?: AIAnalysis
  created_at: string
  half_id?: string
}

export type AIAnalysis = {
  summary: string
  recommendations: string[]
  risk_level: "low" | "medium" | "high"
  potential_issues: string[]
  replacement_needed: boolean
  recovery_time_estimate?: string
  priority_action: string
}

export type PlayerWithLatestReading = Player & {
  latest_reading?: HealthReading
}

// Enhanced AI analysis with more sophisticated insights
export type EnhancedAIAnalysisResult = {
  // Core health assessment
  summary: string
  key_findings: string[]
  trend_analysis: string
  recommendations: string[]
  estimated_recovery: string

  // Performance metrics
  performance_impact: {
    current_capacity: number // 0-100%
    endurance_impact: number // 0-100%
    speed_impact: number // 0-100%
    decision_making_impact: number // 0-100%
    position_specific_metrics: {
      [key: string]: number // Position-specific performance metrics
    }
  }

  // Bottleneck analysis
  primary_limiting_factors: string[]
  secondary_concerns: string[]

  // Optimization suggestions
  recovery_optimization: string[]
  training_adjustments: string[]
  nutrition_recommendations: string[]

  // Meta information
  confidence_level: number
  readings_analyzed: number
  timestamp: string
}

// Existing types for the retry queue
export type RetryQueueItem = {
  id: number
  reading_id: string
  player_id: string
  attempts: number
  max_attempts: number
  last_error: string | null
  status: "pending" | "processing" | "completed" | "failed"
  created_at: string
  updated_at: string
  next_retry_at: string
}

export type RetryQueueStats = {
  pending: number
  processing: number
  completed: number
  failed: number
  total: number
}

// New types for matches and halves
export type Match = {
  id: string
  name: string
  match_date: string
  status: "upcoming" | "in_progress" | "completed" | "cancelled"
  notes?: string
  created_at: string
  updated_at: string
}

export type Half = {
  id: string
  match_id: string
  half_number: number
  start_time?: string
  end_time?: string
  notes?: string
  created_at: string
  updated_at: string
}

export type MatchStatistics = {
  match_id: string
  match_name: string
  match_date: string
  half_id?: string
  half_number?: number
  player_count: number
  reading_count: number
  alert_count: number
  warning_count: number
  normal_count: number
  avg_heart_rate?: number
  avg_hydration?: number
  avg_fatigue?: number
}

export type MatchWithHalves = Match & {
  halves: Half[]
}

export type HalfWithReadings = Half & {
  readings: HealthReading[]
}
