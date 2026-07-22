export interface DiagnosticFinding {
  id: string;
  fingerprint: string;
  category: "traffic" | "engagement" | "conversions" | "attribution" | "pages" | "devices" | "measurement";
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  evidence: string;
  currentValue?: number;
  previousValue?: number;
  percentageChange?: number;
  affectedEntity?: string;
  proposedAction: string;
  targetMetric?: string;
}

export const ANALYTICS_THRESHOLDS = {
  TRAFFIC: {
    CRITICAL_DROP: -30,    // <= -30%
    HIGH_DROP: -15,        // -15% to -29.99%
    MODERATE_DROP: -8,     // -8% to -14.99%
    SIGNIFICANT_GROWTH: 20,// >= +20%
  },
  ENGAGEMENT: {
    BELOW_AVERAGE_RATIO: 0.8, // 20% lower than site average
    DROP_THRESHOLD: -15,      // Drop > 15%
    ABOVE_AVERAGE_RATIO: 1.2, // 20% higher than site average
  },
  CONVERSIONS: {
    MIN_SESSIONS_ZERO_EVENTS: 50,
    CONVERSION_RATE_BELOW_AVG_RATIO: 0.7, // 30% lower than avg
    CONVERSION_RATE_ABOVE_AVG_RATIO: 1.3, // 30% higher than avg
    KEY_EVENTS_DROP: -25,                 // Key events drop >= 25%
  },
  ATTRIBUTION: {
    MAX_DIRECT_RATIO: 0.4,       // Direct > 40%
    MAX_UNASSIGNED_RATIO: 0.05,  // Unassigned > 5%
    MAX_NOT_SET_RATIO: 0.05,     // (not set) > 5%
  },
  PAGES: {
    MIN_SESSIONS_ZERO_EVENTS: 100,
    ENGAGEMENT_BELOW_AVG_RATIO: 0.75, // 25% lower than avg
    PAGE_TRAFFIC_LOSS: -25,           // Traffic loss > 25%
  },
  DEVICES: {
    MOBILE_SHARE_MIN: 0.5,             // Mobile > 50%
    MOBILE_CONVERSION_DEFICIT_RATIO: 0.7, // Mobile converts 30% less than desktop
  },
};
