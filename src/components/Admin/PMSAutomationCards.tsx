import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  Loader2,
  RefreshCw,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  fetchPmsJobs,
  deletePmsJob,
  togglePmsJobApproval,
  updatePmsJobResponse,
  type PmsJob,
  type AutomationStatusDetail,
} from "../../api/pms";
import { PMSAutomationProgressDropdown } from "./PMSAutomationProgressDropdown";

type StatusFilter =
  | "all"
  | "pending"
  | "waiting_for_approval"
  | "approved"
  | "completed"
  | "error";
type ApprovalFilter = "all" | "approved" | "unapproved";

interface PaginationState {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

interface JobEditorState {
  draft: string;
  isDirty: boolean;
  error?: string;
}

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "All Jobs",
  pending: "Pending",
  waiting_for_approval: "Waiting for Approval",
  approved: "Approved",
  completed: "Completed",
  error: "Error",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gray-200 text-gray-700 border-gray-300",
  waiting_for_approval: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  error: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_OPTIONS: StatusFilter[] = [
  "all",
  "pending",
  "waiting_for_approval",
  "approved",
  "completed",
  "error",
];

const APPROVAL_OPTIONS: ApprovalFilter[] = ["all", "approved", "unapproved"];

const APPROVAL_TEXT: Record<"locked" | "pending", string> = {
  locked: "Approved",
  pending: "Needs approval",
};

const POLL_INTERVAL_MS = 2000;

const formatTimeElapsed = (value: number | null): string => {
  if (!value && value !== 0) {
    return "—";
  }

  if (value < 60) {
    return `${value}s`;
  }

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
};

const formatTimestamp = (value: string): string => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const serializeResponse = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch (error) {
      return value;
    }
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
};

const validateJson = (value: string): string | undefined => {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  try {
    JSON.parse(trimmed);
    return undefined;
  } catch (error: any) {
    return error?.message || "Invalid JSON";
  }
};

export function PMSAutomationCards() {
  const [jobs, setJobs] = useState<PmsJob[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvingJobId, setApprovingJobId] = useState<number | null>(null);
  const [savingResponseJobId, setSavingResponseJobId] = useState<number | null>(
    null
  );
  const [activeModalJobId, setActiveModalJobId] = useState<number | null>(null);
  const [editorStates, setEditorStates] = useState<
    Record<number, JobEditorState>
  >({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);
  const [expandedAutomationJobIds, setExpandedAutomationJobIds] = useState<
    Set<number>
  >(new Set());

  const isFetchingRef = useRef(false);

  const loadJobs = useCallback(
    async (options?: { silent?: boolean }) => {
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;

      if (!options?.silent) {
        setIsLoading(true);
      }

      try {
        const response = (await fetchPmsJobs({
          page: pagination.page,
          status: statusFilter === "all" ? undefined : [statusFilter],
          isApproved:
            approvalFilter === "all"
              ? undefined
              : approvalFilter === "approved",
          domain: domainFilter === "all" ? undefined : domainFilter,
        })) as any;

        if (response?.success && response.data) {
          const incomingJobs: PmsJob[] = response.data.jobs;

          setJobs(incomingJobs);
          setPagination({
            page: response.data.pagination.page,
            perPage: response.data.pagination.perPage,
            total: response.data.pagination.total,
            totalPages: response.data.pagination.totalPages,
            hasNextPage: response.data.pagination.hasNextPage,
          });
          setEditorStates((previous) => {
            const next: Record<number, JobEditorState> = {};

            incomingJobs.forEach((job) => {
              const existing = previous[job.id];
              if (existing && existing.isDirty) {
                next[job.id] = existing;
              } else {
                next[job.id] = {
                  draft: serializeResponse(job.response_log),
                  isDirty: false,
                  error: undefined,
                };
              }
            });

            return next;
          });
          setAvailableDomains((previous) => {
            const domainSet = new Set(previous);
            incomingJobs.forEach((job) => {
              if (job.domain) {
                domainSet.add(job.domain);
              }
            });
            if (domainFilter !== "all") {
              domainSet.add(domainFilter);
            }
            return Array.from(domainSet).sort((a, b) => a.localeCompare(b));
          });
          setError(null);
          setLastUpdated(new Date());
        } else {
          const fallbackError =
            response?.error ||
            response?.errorMessage ||
            "Unable to fetch PMS jobs right now.";

          if (!options?.silent) {
            setJobs([]);
            setEditorStates({});
          }

          setError(fallbackError);
        }
      } catch (err) {
        console.error("Failed to load PMS jobs", err);
        if (!options?.silent) {
          setJobs([]);
          setEditorStates({});
        }
        setError("An unexpected error occurred while loading PMS jobs.");
      } finally {
        if (!options?.silent) {
          setIsLoading(false);
        }
        isFetchingRef.current = false;
      }
    },
    [approvalFilter, domainFilter, pagination.page, statusFilter]
  );

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadJobs({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [loadJobs]);

  const handleStatusFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleApprovalFilterChange = (value: ApprovalFilter) => {
    setApprovalFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDomainFilterChange = (value: string) => {
    setDomainFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const goToPreviousPage = () => {
    setPagination((prev) => {
      if (prev.page <= 1) {
        return prev;
      }

      return { ...prev, page: prev.page - 1 };
    });
  };

  const goToNextPage = () => {
    setPagination((prev) => {
      if (prev.page >= prev.totalPages) {
        return prev;
      }

      return { ...prev, page: prev.page + 1 };
    });
  };

  const handleApprovalToggle = async (job: PmsJob) => {
    if (job.is_approved || approvingJobId) {
      return;
    }

    setApprovingJobId(job.id);

    try {
      const response = (await togglePmsJobApproval(job.id, true)) as any;

      if (response?.success && response.data?.job) {
        const updatedJob: PmsJob = response.data.job;
        setJobs((prev) =>
          prev.map((item) => (item.id === job.id ? updatedJob : item))
        );
        setEditorStates((prev) => {
          const next = { ...prev };
          const existing = next[job.id];
          if (existing && existing.isDirty) {
            return next;
          }
          next[job.id] = {
            draft: serializeResponse(updatedJob.response_log),
            isDirty: false,
          };
          return next;
        });
        setError(null);
      } else {
        const fallbackError =
          response?.error ||
          response?.errorMessage ||
          "Unable to approve the PMS job.";
        setError(fallbackError);
      }
    } catch (err) {
      console.error("Failed to toggle PMS job approval", err);
      setError("Failed to approve the job. Please try again.");
    } finally {
      setApprovingJobId(null);
    }
  };

  const handleDraftChange = (jobId: number, value: string) => {
    setEditorStates((prev) => {
      const errorMessage = validateJson(value);
      return {
        ...prev,
        [jobId]: {
          draft: value,
          isDirty: true,
          error: errorMessage,
        },
      };
    });
  };

  const handleSaveResponse = async (jobId: number) => {
    const editorState = editorStates[jobId];
    if (!editorState) {
      return;
    }

    const validationError = validateJson(editorState.draft);
    if (validationError) {
      setEditorStates((prev) => ({
        ...prev,
        [jobId]: {
          ...editorState,
          error: validationError,
        },
      }));
      return;
    }

    setSavingResponseJobId(jobId);

    try {
      const payload = editorState.draft.trim().length
        ? editorState.draft
        : null;
      const response = (await updatePmsJobResponse(jobId, payload)) as any;

      if (response?.success && response.data?.job) {
        const updatedJob: PmsJob = response.data.job;
        setJobs((prev) =>
          prev.map((job) => (job.id === jobId ? updatedJob : job))
        );
        setEditorStates((prev) => ({
          ...prev,
          [jobId]: {
            draft: serializeResponse(updatedJob.response_log),
            isDirty: false,
            error: undefined,
          },
        }));
        setError(null);
        setLastUpdated(new Date());
      } else {
        const fallbackError =
          response?.error ||
          response?.errorMessage ||
          "Unable to update the response log.";
        setError(fallbackError);
      }
    } catch (err) {
      console.error("Failed to update PMS job response", err);
      setError("Failed to save the response log. Please try again.");
    } finally {
      setSavingResponseJobId(null);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (deletingJobId !== null) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this PMS job? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setDeletingJobId(jobId);

    try {
      const response = (await deletePmsJob(jobId)) as any;

      if (response?.success) {
        setJobs((prev) => prev.filter((job) => job.id !== jobId));
        setEditorStates((prev) => {
          const next = { ...prev };
          delete next[jobId];
          return next;
        });

        const nextTotal = Math.max(pagination.total - 1, 0);
        const nextTotalPages = Math.max(
          Math.ceil(nextTotal / pagination.perPage),
          1
        );
        const nextPage = Math.min(pagination.page, nextTotalPages);
        const shouldRefetchImmediately = nextPage === pagination.page;

        setPagination((prev) => ({
          ...prev,
          total: nextTotal,
          totalPages: nextTotalPages,
          page: nextPage,
          hasNextPage: nextPage < nextTotalPages,
        }));

        if (shouldRefetchImmediately) {
          void loadJobs({ silent: true });
        }

        setError(null);
        setLastUpdated(new Date());
      } else {
        const fallbackError =
          response?.error ||
          response?.errorMessage ||
          "Unable to delete the PMS job.";
        setError(fallbackError);
      }
    } catch (err) {
      console.error("Failed to delete PMS job", err);
      setError("Failed to delete the PMS job. Please try again.");
    } finally {
      setDeletingJobId(null);
    }
  };

  const toggleAutomationExpansion = (jobId: number) => {
    setExpandedAutomationJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const handleAutomationStatusChange = (
    jobId: number,
    status: AutomationStatusDetail | null
  ) => {
    if (status) {
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, automation_status_detail: status } : job
        )
      );
    }
  };

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (jobs.length === 0) {
      return { rangeStart: 0, rangeEnd: 0 };
    }

    const start = (pagination.page - 1) * pagination.perPage + 1;
    const end = start + jobs.length - 1;
    return { rangeStart: start, rangeEnd: end };
  }, [jobs.length, pagination.page, pagination.perPage]);

  const activeModalJob = useMemo(() => {
    if (!activeModalJobId) {
      return undefined;
    }

    return jobs.find((job) => job.id === activeModalJobId);
  }, [activeModalJobId, jobs]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Status
            <select
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-medium text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={statusFilter}
              onChange={(event) =>
                handleStatusFilterChange(event.target.value as StatusFilter)
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Domain
            <select
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-medium text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={domainFilter}
              onChange={(event) => handleDomainFilterChange(event.target.value)}
            >
              <option value="all">All Domains</option>
              {availableDomains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Approval
            <select
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-medium text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={approvalFilter}
              onChange={(event) =>
                handleApprovalFilterChange(event.target.value as ApprovalFilter)
              }
            >
              {APPROVAL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "all"
                    ? "All"
                    : option === "approved"
                    ? "Approved"
                    : "Needs Review"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {lastUpdated && (
            <span className="hidden sm:inline">
              Last updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={() => loadJobs()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase text-gray-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {isLoading ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.6fr_1.4fr_1.1fr_1.6fr_1.4fr_1.2fr] items-center gap-4 border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <span>Status</span>
          <span>Domain</span>
          <span>Time Elapsed</span>
          <span>Approval</span>
          <span>Created</span>
          <span className="text-right">Actions</span>
        </div>
        {isLoading && jobs.length === 0 ? (
          <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading jobs…</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            {error || "No PMS jobs found for the selected filters."}
          </div>
        ) : (
          jobs.map((job) => {
            const statusClass =
              STATUS_STYLES[job.status] ||
              "bg-gray-100 text-gray-700 border-gray-200";
            const approvalLabel = job.is_approved ? "locked" : "pending";
            const isDeleting = deletingJobId === job.id;
            const hasAutomationStatus = !!job.automation_status_detail;
            const isAutomationExpanded = expandedAutomationJobIds.has(job.id);

            const isPending = job.status === "pending";
            return (
              <div
                key={job.id}
                className="border-b border-gray-100 last:border-b-0"
              >
                <div className="relative grid grid-cols-[1.6fr_1.4fr_1.1fr_1.6fr_1.4fr_1.2fr] gap-4 px-4 py-4">
                  {isPending && (
                    <div className="absolute inset-0 bg-white/50 pointer-events-none z-0">
                      <div className="h-full w-full animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 opacity-30" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 relative z-10">
                    {hasAutomationStatus && (
                      <button
                        type="button"
                        onClick={() => toggleAutomationExpansion(job.id)}
                        className="rounded p-1 hover:bg-gray-100 transition"
                        title={
                          isAutomationExpanded
                            ? "Hide automation progress"
                            : "Show automation progress"
                        }
                      >
                        {isAutomationExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase ${statusClass}`}
                    >
                      {STATUS_LABELS[job.status as StatusFilter] || job.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    {job.domain || "—"}
                  </div>
                  <div className="text-sm font-medium text-gray-800">
                    {formatTimeElapsed(job.time_elapsed)}
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-gray-600 relative z-10">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={job.is_approved}
                        disabled={
                          job.is_approved ||
                          approvingJobId === job.id ||
                          isPending
                        }
                        onClick={() => handleApprovalToggle(job)}
                        className={`relative inline-flex h-6 w-12 items-center rounded-full border transition ${
                          job.is_approved
                            ? "border-green-400 bg-green-500"
                            : "border-gray-300 bg-gray-200"
                        } ${
                          job.is_approved || isPending
                            ? "cursor-default"
                            : "cursor-pointer"
                        } disabled:opacity-60`}
                      >
                        <span
                          className={`absolute left-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            job.is_approved ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                      {approvingJobId === job.id ? (
                        <span className="flex items-center gap-1 text-xs font-semibold uppercase text-blue-600">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Approving…
                        </span>
                      ) : (
                        <span className="text-xs font-semibold uppercase text-gray-500">
                          {APPROVAL_TEXT[approvalLabel]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatTimestamp(job.timestamp)}
                  </div>
                  <div className="flex flex-col items-end gap-2 relative z-10">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveModalJobId(job.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase text-gray-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job.id)}
                        disabled={isDeleting || isPending}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold uppercase text-red-600 transition hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:border-red-100 disabled:text-red-300"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                {/* Automation Progress Dropdown */}
                {hasAutomationStatus && isAutomationExpanded && (
                  <div className="px-4 pb-4">
                    <PMSAutomationProgressDropdown
                      jobId={job.id}
                      initialStatus={job.automation_status_detail}
                      onStatusChange={(status) =>
                        handleAutomationStatusChange(job.id, status)
                      }
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
        <div>
          {jobs.length > 0 ? (
            <span>
              Showing {rangeStart}–{rangeEnd} of {pagination.total} jobs
            </span>
          ) : (
            <span>0 jobs</span>
          )}
          {lastUpdated && (
            <span className="ml-2 text-xs text-gray-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPreviousPage}
            disabled={pagination.page === 1 || isLoading}
            className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase text-gray-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300"
          >
            Previous
          </button>
          <span className="text-xs font-semibold uppercase text-gray-500">
            Page {Math.min(pagination.page, Math.max(pagination.totalPages, 1))}{" "}
            of {Math.max(pagination.totalPages, 1)}
          </span>
          <button
            type="button"
            onClick={goToNextPage}
            disabled={
              pagination.page >= pagination.totalPages ||
              isLoading ||
              !pagination.hasNextPage
            }
            className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase text-gray-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300"
          >
            Next
          </button>
        </div>
      </div>
      {error && jobs.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {activeModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Response Log — Job #{activeModalJob.id}
                </h2>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  {
                    APPROVAL_TEXT[
                      activeModalJob.is_approved ? "locked" : "pending"
                    ]
                  }
                </p>
                {activeModalJob.domain ? (
                  <p className="text-xs text-gray-500">
                    Domain: {activeModalJob.domain}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setActiveModalJobId(null)}
                className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-3 px-5 py-4">
              <textarea
                value={editorStates[activeModalJob.id]?.draft ?? ""}
                onChange={(event) =>
                  handleDraftChange(activeModalJob.id, event.target.value)
                }
                spellCheck={false}
                className="h-full min-h-[55vh] w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-800 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4">
              {editorStates[activeModalJob.id]?.error ? (
                <span className="text-sm text-red-600">
                  Invalid JSON: {editorStates[activeModalJob.id]?.error}
                </span>
              ) : editorStates[activeModalJob.id]?.isDirty ? (
                <span className="text-sm text-gray-500">
                  Unsaved changes will be lost if you close
                </span>
              ) : (
                <span className="text-sm text-gray-400">&nbsp;</span>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalJobId(null)}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold uppercase text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
                >
                  Close
                </button>
                {(editorStates[activeModalJob.id]?.isDirty ||
                  savingResponseJobId === activeModalJob.id) && (
                  <button
                    type="button"
                    onClick={() => handleSaveResponse(activeModalJob.id)}
                    disabled={
                      !!editorStates[activeModalJob.id]?.error ||
                      savingResponseJobId === activeModalJob.id
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold uppercase text-blue-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:border-blue-100 disabled:text-blue-300"
                  >
                    {savingResponseJobId === activeModalJob.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Save Changes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
