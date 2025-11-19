import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type {
  AgentInsightSummary,
  AgentInsightsSummaryResponse,
} from "../../types/agentInsights";

/**
 * AI Data Insights List Page
 * Shows table of all agents with summary metrics
 * Clicking a row navigates to detail page
 */
export default function AIDataInsightsList() {
  const navigate = useNavigate();
  const [summaryData, setSummaryData] = useState<AgentInsightSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [currentPage]);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/agent-insights/summary?page=${currentPage}&limit=50`
      );
      const data: AgentInsightsSummaryResponse = await response.json();

      if (data.success) {
        setSummaryData(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(data.message || "Failed to fetch summary");
      }
    } catch (err) {
      console.error("Failed to fetch agent insights summary:", err);
      setError("Failed to load agent insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatAgentName = (agentType: string): string => {
    return agentType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleRowClick = (agentType: string) => {
    navigate(`/admin/ai-data-insights/${agentType}`);
  };

  const handleRunAgents = async () => {
    if (isRunning) return;

    if (
      !confirm(
        "This will run Guardian and Governance agents across all practices. This may take several minutes. Continue?"
      )
    ) {
      return;
    }

    setIsRunning(true);
    try {
      const response = await fetch(
        "/api/agents/guardian-governance-agents-run",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(
          "Guardian and Governance agents completed successfully! Refreshing data..."
        );
        fetchSummary();
      } else {
        alert("Failed to run agents: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Failed to run Guardian/Governance agents:", err);
      alert("Failed to run agents. Please try again.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearData = async () => {
    if (isClearing) return;

    if (
      !confirm(
        "This will delete ALL Guardian and Governance data for this month. This action cannot be undone. Continue?"
      )
    ) {
      return;
    }

    setIsClearing(true);
    try {
      const response = await fetch(
        "/api/admin/agent-insights/clear-month-data",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(
          `Successfully cleared ${data.deleted.recommendations} recommendations and ${data.deleted.agent_results} agent results.`
        );
        fetchSummary();
      } else {
        alert("Failed to clear data: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Failed to clear Guardian/Governance data:", err);
      alert("Failed to clear data. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleGenerateLogRef = async (
    agentType: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    try {
      const response = await fetch(
        `/api/admin/agent-insights/${agentType}/governance-ids`
      );
      const data = await response.json();

      if (data.success) {
        const totalCount = data.counts.passed + data.counts.rejected;

        if (totalCount === 0) {
          alert(
            `No PASS or REJECT recommendations found for ${formatAgentName(
              agentType
            )}`
          );
        } else {
          const message = `Governance Log Reference for ${formatAgentName(
            agentType
          )}:\n\nPASSED (${data.counts.passed}):\n${
            data.passed.length > 0 ? data.passed.join(", ") : "None"
          }\n\nREJECTED (${data.counts.rejected}):\n${
            data.rejected.length > 0 ? data.rejected.join(", ") : "None"
          }\n\nTotal: ${totalCount} recommendations`;
          alert(message);
          console.log("Governance IDs for", agentType, ":", data);
        }
      } else {
        alert(
          "Failed to generate log ref: " + (data.message || "Unknown error")
        );
      }
    } catch (err) {
      console.error("Failed to generate governance log ref:", err);
      alert("Failed to generate governance log reference. Please try again.");
    }
  };

  // Render action buttons (used in multiple states)
  const renderActionButtons = () => (
    <div className="flex gap-2">
      <button
        onClick={handleRunAgents}
        disabled={isRunning || isClearing}
        className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-4 py-2 text-xs font-semibold uppercase text-blue-600 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
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
            Running...
          </>
        ) : (
          <>
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
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Run Guardian & Governance
          </>
        )}
      </button>
      <button
        onClick={handleClearData}
        disabled={isRunning || isClearing}
        className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold uppercase text-red-600 transition hover:border-red-300 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isClearing ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
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
            Clearing...
          </>
        ) : (
          <>
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Clear Month Data
          </>
        )}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading agent insights...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">
          <p className="font-semibold mb-2">Error loading data</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (summaryData.length === 0) {
    return (
      <div className="space-y-4">
        {/* Header with buttons even in empty state */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <p className="text-gray-600">
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          {renderActionButtons()}
        </div>

        {/* Empty state message */}
        <div className="flex items-center justify-center h-64 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="text-gray-600 text-center">
            <p className="text-lg mb-2">No agent data available</p>
            <p className="text-sm">
              Guardian and Governance agents haven't run yet this month.
              <br />
              Click "Run Guardian & Governance" above to start.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <p className="text-gray-600">
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        {renderActionButtons()}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 bg-white border-b border-gray-100">
              <th className="py-3 px-4">Agent</th>
              <th className="py-3 px-4">Confidence Rate</th>
              <th className="py-3 px-4">Pass Rate</th>
              <th className="py-3 px-4"># of Recommendations</th>
              <th className="py-3 px-4">Fixed</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {summaryData.map((agent, index) => (
              <tr
                key={agent.agent_type}
                className={`
                  cursor-pointer transition-colors hover:bg-gray-50
                  ${
                    index < summaryData.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }
                `}
                onClick={() => handleRowClick(agent.agent_type)}
              >
                <td className="py-4 px-4 font-medium text-gray-900">
                  {formatAgentName(agent.agent_type)}
                </td>
                <td className="py-4 px-4 text-sm text-gray-700">
                  {agent.confidence_rate.toFixed(2)}
                </td>
                <td className="py-4 px-4 text-sm text-gray-700">
                  {(agent.pass_rate * 100).toFixed(0)}%
                </td>
                <td className="py-4 px-4 text-sm text-gray-700">
                  {agent.total_recommendations}
                </td>
                <td className="py-4 px-4 text-sm text-gray-700">
                  {agent.fixed_count}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <button
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium whitespace-nowrap"
                      onClick={(e) => handleGenerateLogRef(agent.agent_type, e)}
                      title="Generate governance log reference"
                    >
                      Governance Log IDs
                    </button>
                    <button
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(agent.agent_type);
                      }}
                    >
                      View more
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      {/* Legend */}
      <div className="text-sm text-gray-600">
        <p className="mb-1">
          <strong className="text-gray-900">Pass Rate:</strong> Percentage of
          checks with PASS verdict
        </p>
        <p className="mb-1">
          <strong className="text-gray-900">Confidence Rate:</strong> Average
          confidence score from agent analysis
        </p>
        <p>
          <strong className="text-gray-900">Fixed:</strong> Number of
          recommendations marked as completed
        </p>
      </div>
    </div>
  );
}
