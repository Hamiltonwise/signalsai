import { apiGet, apiPost, apiPut } from "./index";

export interface AgentResult {
  id: number;
  domain: string;
  agent_response: {
    webhooks?: Array<{
      webhookUrl: string;
      success?: boolean;
      data: Array<{
        title?: string;
        explanation?: string;
        proof_type?: string;
        [key: string]: unknown;
      }>;
    }>;
    successCount?: number;
    totalCount?: number;
  };
  status: "pending" | "approved" | "rejected";
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface FetchAgentResultsParams {
  status?: "pending" | "approved" | "rejected";
  domain?: string;
}

export interface FetchAgentResultsResponse {
  success: boolean;
  data?: AgentResult[];
  error?: string;
  message?: string;
}

export interface ApproveAgentResultRequest {
  resultId: number;
  status: "approved" | "rejected";
  approvedBy: string;
}

export interface ApproveAgentResultResponse {
  success: boolean;
  data?: AgentResult;
  error?: string;
  message?: string;
}

export interface LatestAgentResultResponse {
  success: boolean;
  data?: AgentResult;
  error?: string;
  message?: string;
}

export interface UpdateAgentResultRequest {
  resultId: number;
  agentResponse: unknown;
}

export interface UpdateAgentResultResponse {
  success: boolean;
  data?: AgentResult;
  error?: string;
  message?: string;
}

/**
 * Fetch agent results with optional filtering
 */
export async function fetchAgentResults(
  params: FetchAgentResultsParams = {}
): Promise<FetchAgentResultsResponse> {
  const query = new URLSearchParams();

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.domain) {
    query.set("domain", params.domain);
  }

  const queryString = query.toString();

  return apiGet({
    path: `/agents/results${queryString ? `?${queryString}` : ""}`,
  });
}

/**
 * Approve or reject an agent result
 */
export async function approveAgentResult(
  request: ApproveAgentResultRequest
): Promise<ApproveAgentResultResponse> {
  return apiPost({
    path: "/agents/approve",
    passedData: request,
  });
}

/**
 * Get the latest approved agent result for a domain
 */
export async function getLatestAgentResult(
  domain: string
): Promise<LatestAgentResultResponse> {
  return apiGet({
    path: `/agents/latest?domain=${encodeURIComponent(domain)}`,
  });
}

/**
 * Update agent_response for a specific result
 */
export async function updateAgentResult(
  request: UpdateAgentResultRequest
): Promise<UpdateAgentResultResponse> {
  return apiPut({
    path: "/agents/update-response",
    passedData: request,
  });
}
