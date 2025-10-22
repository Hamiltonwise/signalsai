import { useState, useEffect } from "react";
import agents from "../api/agents";

interface AgentData {
  success: boolean;
  googleAccountId: number;
  domain: string;
  agents: {
    proofline: AgentResult | null;
    summary: AgentResult | null;
    opportunity: AgentResult | null;
  };
}

interface AgentResult {
  results: unknown[];
  lastUpdated: string;
  dateStart: string;
  dateEnd: string;
  resultId: number;
}

export function useAgentData(googleAccountId: number | null) {
  const [data, setData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!googleAccountId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const json = await agents.getLatestAgentData(googleAccountId);

      if (json.successful === false) {
        throw new Error(json.errorMessage || "Failed to fetch agent data");
      }

      setData(json);
      setError(null);
    } catch (err: unknown) {
      console.error("Error fetching agent data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch agent data"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [googleAccountId]);

  return { data, loading, error, refetch: fetchData };
}
