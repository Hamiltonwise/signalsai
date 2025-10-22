import { apiGet, apiPost, apiPatch } from "./index";
import type { AgentResponse } from "../types/agents";

const baseurl = "/agents";

// Agent Result type for API responses
export interface AgentResult {
  id: number;
  status: "pending" | "approved" | "rejected";
  domain: string;
  google_account_id: number;
  agent_response?: AgentResponse;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
}

// API response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function getLatestAgentData(googleAccountId: number) {
  try {
    return await apiGet({
      path: baseurl + `/latest/${googleAccountId}`,
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

async function fetchAgentResults(params?: {
  status?: string;
}): Promise<ApiResponse<AgentResult[]>> {
  try {
    const queryParams = params?.status ? `?status=${params.status}` : "";
    return await apiGet({
      path: baseurl + `/results${queryParams}`,
    });
  } catch (err) {
    console.log(err);
    return {
      success: false,
      error: "Technical error, contact developer",
    };
  }
}

async function getLatestAgentResult(
  domain: string
): Promise<ApiResponse<AgentResult>> {
  try {
    return await apiGet({
      path: baseurl + `/latest?domain=${encodeURIComponent(domain)}`,
    });
  } catch (err) {
    console.log(err);
    return {
      success: false,
      error: "Technical error, contact developer",
    };
  }
}

async function approveAgentResult(params: {
  resultId: number;
  status: "approved" | "rejected";
  approvedBy: string;
}): Promise<ApiResponse<AgentResult>> {
  try {
    return await apiPost({
      path: baseurl + `/results/${params.resultId}/approve`,
      passedData: {
        status: params.status,
        approved_by: params.approvedBy,
      },
    });
  } catch (err) {
    console.log(err);
    return {
      success: false,
      error: "Technical error, contact developer",
    };
  }
}

async function updateAgentResult(params: {
  resultId: number;
  agentResponse: AgentResponse;
}): Promise<ApiResponse<AgentResult>> {
  try {
    return await apiPatch({
      path: baseurl + `/results/${params.resultId}`,
      passedData: {
        agent_response: params.agentResponse,
      },
    });
  } catch (err) {
    console.log(err);
    return {
      success: false,
      error: "Technical error, contact developer",
    };
  }
}

// Export individual functions as named exports
export {
  fetchAgentResults,
  getLatestAgentResult,
  approveAgentResult,
  updateAgentResult,
};

// Default export with all functions
const agents = {
  getLatestAgentData,
  fetchAgentResults,
  getLatestAgentResult,
  approveAgentResult,
  updateAgentResult,
};

export default agents;
