import { useState, useEffect } from "react";
import {
  RefreshCw,
  AlertCircle,
  Archive,
  ArchiveRestore,
  Loader2,
  CheckSquare,
  Square,
  Eye,
} from "lucide-react";
import {
  fetchAgentOutputs,
  fetchDomains,
  fetchAgentTypes,
  archiveAgentOutput,
  unarchiveAgentOutput,
  bulkArchiveAgentOutputs,
  bulkUnarchiveAgentOutputs,
} from "../../api/agentOutputs";
import type {
  AgentOutput,
  FetchAgentOutputsRequest,
  AgentOutputStatus,
  AgentOutputType,
} from "../../types/agentOutputs";
import { AgentOutputDetailModal } from "../../components/Admin/AgentOutputDetailModal";

/**
 * Agent Outputs List Page
 * Shows table of all agent outputs with filtering and archive functionality
 */
export default function AgentOutputsList() {
  const [outputs, setOutputs] = useState<AgentOutput[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [agentTypes, setAgentTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [selectedOutput, setSelectedOutput] = useState<AgentOutput | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);

  // Individual action loading
  const [archivingId, setArchivingId] = useState<number | null>(null);

  // Filter states
  const [filters, setFilters] = useState<FetchAgentOutputsRequest>({
    page: 1,
    limit: 50,
  });
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedAgentType, setSelectedAgentType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    loadDomains();
    loadAgentTypes();
  }, []);

  useEffect(() => {
    loadOutputs();
  }, [filters]);

  const loadDomains = async () => {
    try {
      const response = await fetchDomains();
      setDomains(response.domains);
    } catch (err) {
      console.error("Failed to load domains:", err);
    }
  };

  const loadAgentTypes = async () => {
    try {
      const response = await fetchAgentTypes();
      setAgentTypes(response.agentTypes);
    } catch (err) {
      console.error("Failed to load agent types:", err);
    }
  };

  const loadOutputs = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);
      const response = await fetchAgentOutputs(filters);
      setOutputs(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err) {
      console.error("Failed to fetch agent outputs:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load agent outputs"
      );
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  const applyFilters = () => {
    const newFilters: FetchAgentOutputsRequest = {
      page: 1,
      limit: 50,
    };

    if (selectedDomain !== "all") {
      newFilters.domain = selectedDomain;
    }
    if (selectedAgentType !== "all") {
      newFilters.agent_type = selectedAgentType as AgentOutputType;
    }
    if (selectedStatus !== "all") {
      newFilters.status = selectedStatus as AgentOutputStatus;
    }

    setFilters(newFilters);
  };

  const resetFilters = () => {
    setSelectedDomain("all");
    setSelectedAgentType("all");
    setSelectedStatus("all");
    setFilters({ page: 1, limit: 50 });
  };

  const handleViewDetails = (output: AgentOutput) => {
    setSelectedOutput(output);
    setShowDetailModal(true);
  };

  const handleArchive = async (id: number) => {
    if (archivingId) return;
    if (!confirm("Are you sure you want to archive this agent output?")) return;

    try {
      setArchivingId(id);
      await archiveAgentOutput(id);
      await loadOutputs();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to archive agent output"
      );
    } finally {
      setArchivingId(null);
    }
  };

  const handleUnarchive = async (id: number) => {
    if (archivingId) return;
    if (!confirm("Are you sure you want to restore this agent output?")) return;

    try {
      setArchivingId(id);
      await unarchiveAgentOutput(id);
      await loadOutputs();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to restore agent output"
      );
    } finally {
      setArchivingId(null);
    }
  };

  // Multi-select handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === outputs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(outputs.map((o) => o.id)));
    }
  };

  const toggleSelectOutput = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Bulk operations
  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `Are you sure you want to archive ${selectedIds.size} agent output(s)?`
      )
    )
      return;

    try {
      setBulkOperationLoading(true);
      await bulkArchiveAgentOutputs(Array.from(selectedIds));
      setSelectedIds(new Set());
      await loadOutputs();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to archive agent outputs"
      );
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkUnarchive = async () => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `Are you sure you want to restore ${selectedIds.size} agent output(s)?`
      )
    )
      return;

    try {
      setBulkOperationLoading(true);
      await bulkUnarchiveAgentOutputs(Array.from(selectedIds));
      setSelectedIds(new Set());
      await loadOutputs();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to restore agent outputs"
      );
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const formatDateRange = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) {
      return "just now";
    } else if (diffMinutes < 60) {
      return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
    } else if (diffWeeks < 4) {
      return diffWeeks === 1 ? "1 week ago" : `${diffWeeks} weeks ago`;
    } else if (diffMonths < 12) {
      return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
    } else {
      return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
    }
  };

  const formatAgentType = (agentType: string): string => {
    return agentType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Success
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            Pending
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            Error
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            {status}
          </span>
        );
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Check if all selected items are archived (for showing correct bulk action button)
  const allSelectedAreArchived =
    selectedIds.size > 0 &&
    Array.from(selectedIds).every((id) => {
      const output = outputs.find((o) => o.id === id);
      return output?.status === "archived";
    });

  // Check if any selected items are not archived
  const anySelectedNotArchived =
    selectedIds.size > 0 &&
    Array.from(selectedIds).some((id) => {
      const output = outputs.find((o) => o.id === id);
      return output?.status !== "archived";
    });

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
            <CheckSquare className="h-4 w-4" />
            <span>
              {selectedIds.size} output{selectedIds.size !== 1 ? "s" : ""}{" "}
              selected
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {anySelectedNotArchived && (
              <button
                onClick={handleBulkArchive}
                disabled={bulkOperationLoading}
                className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase text-orange-700 transition hover:border-orange-300 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkOperationLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Archive className="h-3.5 w-3.5" />
                )}
                Archive
              </button>
            )}
            {allSelectedAreArchived && (
              <button
                onClick={handleBulkUnarchive}
                disabled={bulkOperationLoading}
                className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold uppercase text-green-700 transition hover:border-green-300 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkOperationLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArchiveRestore className="h-3.5 w-3.5" />
                )}
                Restore
              </button>
            )}
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

      {/* Filters Bar */}
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col items-start gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Domain
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-medium text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Domains</option>
              {domains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col items-start gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Agent Type
            <select
              value={selectedAgentType}
              onChange={(e) => setSelectedAgentType(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-medium text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Types</option>
              {agentTypes.map((type) => (
                <option key={type} value={type}>
                  {formatAgentType(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col items-start gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Status
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-medium text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="error">Error</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <button
            onClick={applyFilters}
            className="rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold uppercase text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
          >
            Apply
          </button>
          <button
            onClick={resetFilters}
            className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
          >
            Reset
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadOutputs()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {loading ? "Loading" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Outputs Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[auto_1.2fr_1fr_0.8fr_0.8fr_0.8fr_1fr] items-center gap-4 border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <button
            onClick={toggleSelectAll}
            disabled={outputs.length === 0}
            className="flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              selectedIds.size === outputs.length
                ? "Deselect all"
                : "Select all"
            }
          >
            {selectedIds.size === outputs.length && outputs.length > 0 ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4 text-gray-400" />
            )}
          </button>
          <span>Domain</span>
          <span>Agent Type</span>
          <span>Date Range</span>
          <span>Status</span>
          <span>Created</span>
          <span className="text-right">Actions</span>
        </div>

        {loading && outputs.length === 0 ? (
          <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading agent outputs...</span>
          </div>
        ) : error ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => loadOutputs()}
              className="rounded-full border border-blue-200 px-4 py-2 text-xs font-semibold uppercase text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
            >
              Retry
            </button>
          </div>
        ) : outputs.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            No agent outputs found for the selected filters.
          </div>
        ) : (
          outputs.map((output) => (
            <div
              key={output.id}
              className={`grid grid-cols-[auto_1.2fr_1fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 border-b border-gray-100 px-4 py-4 last:border-b-0 ${
                selectedIds.has(output.id) ? "bg-blue-50" : ""
              }`}
            >
              <button
                onClick={() => toggleSelectOutput(output.id)}
                className="flex items-center justify-center"
                title={
                  selectedIds.has(output.id)
                    ? "Deselect output"
                    : "Select output"
                }
              >
                {selectedIds.has(output.id) ? (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
              <div className="text-sm text-gray-700 font-medium truncate">
                {output.domain}
              </div>
              <div className="text-sm text-gray-700">
                {formatAgentType(output.agent_type)}
              </div>
              <div className="text-xs text-gray-500">
                {formatDateRange(output.date_start)} →{" "}
                {formatDateRange(output.date_end)}
              </div>
              <div>{getStatusBadge(output.status)}</div>
              <div
                className="text-xs text-gray-500"
                title={new Date(output.created_at).toLocaleString()}
              >
                {formatRelativeTime(output.created_at)}
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => handleViewDetails(output)}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold uppercase text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
                  title="View output details"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </button>
                {output.status === "archived" ? (
                  <button
                    onClick={() => handleUnarchive(output.id)}
                    disabled={archivingId !== null}
                    className="inline-flex items-center gap-1 rounded-full border border-green-200 px-3 py-1 text-xs font-semibold uppercase text-green-600 transition hover:border-green-300 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Restore output"
                  >
                    {archivingId === output.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ArchiveRestore className="h-3.5 w-3.5" />
                    )}
                    Restore
                  </button>
                ) : (
                  <button
                    onClick={() => handleArchive(output.id)}
                    disabled={archivingId !== null}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase text-gray-600 transition hover:border-gray-300 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Archive output"
                  >
                    {archivingId === output.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Archive className="h-3.5 w-3.5" />
                    )}
                    Archive
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => handlePageChange(Math.max(1, (filters.page || 1) - 1))}
          disabled={(filters.page || 1) === 1 || loading}
          className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {filters.page || 1} of {totalPages} ({total} total)
        </span>
        <button
          onClick={() =>
            handlePageChange(Math.min(totalPages, (filters.page || 1) + 1))
          }
          disabled={(filters.page || 1) === totalPages || loading}
          className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
        <div>
          {outputs.length > 0 ? (
            <span>
              Showing {outputs.length} of {total} output{total !== 1 ? "s" : ""}
            </span>
          ) : (
            <span>0 outputs</span>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AgentOutputDetailModal
        output={selectedOutput}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedOutput(null);
        }}
      />
    </div>
  );
}
