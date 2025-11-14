import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RecommendationCard from "../../components/Admin/RecommendationCard";
import type {
  AgentRecommendation,
  AgentRecommendationsResponse,
} from "../../types/agentInsights";

/**
 * AI Data Insights Detail Page
 * Shows recommendations for a specific agent, grouped by source
 * (Guardian vs Governance Sentinel)
 */
export default function AIDataInsightsDetail() {
  const { agentType } = useParams<{ agentType: string }>();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<AgentRecommendation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);

  useEffect(() => {
    if (agentType) {
      fetchRecommendations();
    }
  }, [agentType, currentPage]);

  const fetchRecommendations = async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/agent-insights/${agentType}/recommendations?page=${currentPage}&limit=50`
      );
      const data: AgentRecommendationsResponse = await response.json();

      if (data.success) {
        setRecommendations(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError("Failed to load recommendations");
      }
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError("Failed to load recommendations");
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  const handleFixAll = async () => {
    if (
      !confirm(
        "Are you sure you want to mark all pending recommendations as completed?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/agent-insights/${agentType}/recommendations/mark-all-completed`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(`Marked ${data.data.updated} recommendation(s) as completed`);
        fetchRecommendations();
      } else {
        alert("Failed to mark all as completed: " + (data.message || ""));
      }
    } catch (error) {
      console.error("Failed to mark all as completed:", error);
      alert("Failed to mark all as completed. Please try again.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.size} recommendation(s)?`
      )
    ) {
      return;
    }

    setBulkOperationLoading(true);
    try {
      const response = await fetch(
        "/api/admin/agent-insights/recommendations/bulk-delete",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: Array.from(selectedIds) }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(`Deleted ${data.data.deleted} recommendation(s)`);
        setSelectedIds(new Set());
        fetchRecommendations();
      } else {
        alert("Failed to delete recommendations: " + (data.message || ""));
      }
    } catch (error) {
      console.error("Failed to bulk delete recommendations:", error);
      alert("Failed to delete recommendations. Please try again.");
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === recommendations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(recommendations.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Group recommendations by source
  const governanceRecs = recommendations.filter(
    (r) => r.source_agent_type === "governance_sentinel"
  );
  const guardianRecs = recommendations.filter(
    (r) => r.source_agent_type === "guardian"
  );

  // Format agent name
  const formatAgentName = (agentType: string): string => {
    return agentType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading recommendations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">
          <p className="font-semibold mb-2">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="space-y-4">
        {/* Back Button */}
        <button
          onClick={() => navigate("/admin/ai-data-insights")}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Back to All Agents
        </button>

        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 text-center">
            <p className="text-lg mb-2">No recommendations</p>
            <p className="text-sm">
              No Guardian or Governance recommendations for{" "}
              {agentType ? formatAgentName(agentType) : "this agent"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/ai-data-insights")}
        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
      >
        ← Back to All Agents
      </button>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <span>
              {selectedIds.size} recommendation
              {selectedIds.size !== 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={bulkOperationLoading}
              className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkOperationLoading ? (
                <>
                  <svg
                    className="animate-spin h-3.5 w-3.5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </>
              )}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              disabled={bulkOperationLoading}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">
            {agentType ? formatAgentName(agentType) : "Agent"} Insights
          </h2>
          {recommendations.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {selectedIds.size === recommendations.length
                ? "Deselect All"
                : "Select All"}
            </button>
          )}
        </div>
        <button
          onClick={handleFixAll}
          className="rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold uppercase text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
        >
          Fix all
        </button>
      </div>

      {/* Governance Agent Recommendations */}
      {governanceRecs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Governance Agent
            <span className="ml-2 text-sm text-gray-600 font-normal">
              ({governanceRecs.length} recommendation
              {governanceRecs.length !== 1 ? "s" : ""})
            </span>
          </h3>
          <div className="space-y-3">
            {governanceRecs.map((rec) => (
              <div key={rec.id} className="flex items-start gap-3">
                <button
                  onClick={() => toggleSelect(rec.id)}
                  className="mt-4 flex-shrink-0"
                >
                  {selectedIds.has(rec.id) ? (
                    <svg
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-gray-400 hover:text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                      />
                    </svg>
                  )}
                </button>
                <div className="flex-1">
                  <RecommendationCard
                    recommendation={rec}
                    onUpdate={() => fetchRecommendations({ silent: true })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guardian Agent Recommendations */}
      {guardianRecs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Guardian Agent
            <span className="ml-2 text-sm text-gray-600 font-normal">
              ({guardianRecs.length} recommendation
              {guardianRecs.length !== 1 ? "s" : ""})
            </span>
          </h3>
          <div className="space-y-3">
            {guardianRecs.map((rec) => (
              <div key={rec.id} className="flex items-start gap-3">
                <button
                  onClick={() => toggleSelect(rec.id)}
                  className="mt-4 flex-shrink-0"
                >
                  {selectedIds.has(rec.id) ? (
                    <svg
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-gray-400 hover:text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                      />
                    </svg>
                  )}
                </button>
                <div className="flex-1">
                  <RecommendationCard
                    recommendation={rec}
                    onUpdate={() => fetchRecommendations({ silent: true })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
