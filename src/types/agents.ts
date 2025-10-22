/**
 * TypeScript interfaces for Agent data structures
 */

export interface ProoflineAgentData {
  title: string;
  proof_type: string;
  explanation: string;
  value_change?: number | string;
  metric_signal?: string;
  source_type?: string;
  citations?: string[];
  [key: string]: unknown;
}

export interface SummaryAgentWin {
  title: string;
  description: string;
  metric?: string;
  value?: string;
}

export interface SummaryAgentRisk {
  title: string;
  description: string;
  severity?: "low" | "medium" | "high";
}

export interface SummaryAgentData {
  wins: SummaryAgentWin[];
  risks: SummaryAgentRisk[];
  next_steps: string;
  [key: string]: unknown;
}

export interface OpportunityAgentStep {
  step: string;
  description: string;
}

export interface OpportunityAgentData {
  title: string;
  steps: OpportunityAgentStep[];
  expected_lift: number | string;
  rationale: string;
  [key: string]: unknown;
}

export interface WebhookResult {
  webhookUrl: string;
  success: boolean;
  data?: Array<ProoflineAgentData | SummaryAgentData | OpportunityAgentData>;
  error?: string;
  attempts?: number;
}

export interface AgentResponse {
  webhooks: WebhookResult[];
  successCount?: number;
  totalCount?: number;
}

export type AgentType = "proofline" | "summary" | "opportunity";

export const PROOF_TYPES = [
  "metric_improvement",
  "user_behavior",
  "conversion_rate",
  "engagement",
  "traffic_growth",
  "other",
] as const;

export type ProofType = (typeof PROOF_TYPES)[number];
