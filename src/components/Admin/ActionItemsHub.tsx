import { useState, useEffect } from "react";
import {
  Plus,
  RefreshCw,
  AlertCircle,
  Trash2,
  Check,
  X,
  Loader2,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  fetchAllTasks,
  updateTask,
  updateTaskCategory,
  archiveTask,
  fetchClients,
  bulkArchiveTasks,
  bulkApproveTasks,
  bulkUpdateStatus,
} from "../../api/tasks";
import type {
  ActionItem,
  FetchActionItemsRequest,
  ClientOption,
} from "../../types/tasks";
import { CreateTaskModal } from "./CreateTaskModal";

export function ActionItemsHub() {
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Multi-select state
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(
    new Set()
  );
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);

  // Loading states for individual operations
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [updatingApprovalId, setUpdatingApprovalId] = useState<number | null>(
    null
  );
  const [updatingCategoryId, setUpdatingCategoryId] = useState<number | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filter states
  const [filters, setFilters] = useState<FetchActionItemsRequest>({
    limit: 50,
    offset: 0,
  });
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedApproval, setSelectedApproval] = useState<string>("all");

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [filters]);

  const loadClients = async () => {
    try {
      const response = await fetchClients();
      setClients(response.clients);
    } catch (err) {
      console.error("Failed to load clients:", err);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAllTasks(filters);
      setTasks(response.tasks);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const newFilters: FetchActionItemsRequest = {
      limit: 50,
      offset: 0,
    };

    if (selectedClient !== "all") {
      newFilters.domain_name = selectedClient;
    }
    if (selectedStatus !== "all") {
      newFilters.status = selectedStatus as
        | "pending"
        | "in_progress"
        | "complete"
        | "archived";
    }
    if (selectedCategory !== "all") {
      newFilters.category = selectedCategory as "ALLORO" | "USER";
    }
    if (selectedApproval !== "all") {
      newFilters.is_approved = selectedApproval === "true";
    }

    setFilters(newFilters);
  };

  const resetFilters = () => {
    setSelectedClient("all");
    setSelectedStatus("all");
    setSelectedCategory("all");
    setSelectedApproval("all");
    setFilters({ limit: 50, offset: 0 });
  };

  const handleApprove = async (taskId: number, currentApproval: boolean) => {
    if (updatingApprovalId) return;

    try {
      setUpdatingApprovalId(taskId);
      await updateTask(taskId, { is_approved: !currentApproval });
      await loadTasks();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setUpdatingApprovalId(null);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    if (updatingStatusId) return;

    try {
      setUpdatingStatusId(taskId);
      await updateTask(taskId, {
        status: newStatus as
          | "pending"
          | "in_progress"
          | "complete"
          | "archived",
      });
      await loadTasks();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleCategoryChange = async (taskId: number, newCategory: string) => {
    if (updatingCategoryId) return;

    try {
      setUpdatingCategoryId(taskId);
      await updateTaskCategory(taskId, newCategory as "ALLORO" | "USER");
      await loadTasks();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setUpdatingCategoryId(null);
    }
  };

  const handleArchive = async (taskId: number) => {
    if (deletingId) return;
    if (!confirm("Are you sure you want to archive this task?")) return;

    try {
      setDeletingId(taskId);
      await archiveTask(taskId);
      await loadTasks();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to archive task");
    } finally {
      setDeletingId(null);
    }
  };

  // Multi-select handlers
  const toggleSelectAll = () => {
    if (selectedTaskIds.size === tasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
    }
  };

  const toggleSelectTask = (taskId: number) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedTaskIds.size === 0) return;
    if (
      !confirm(
        `Are you sure you want to archive ${selectedTaskIds.size} task(s)?`
      )
    )
      return;

    try {
      setBulkOperationLoading(true);
      await bulkArchiveTasks(Array.from(selectedTaskIds));
      setSelectedTaskIds(new Set());
      await loadTasks();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to archive tasks");
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkApprove = async (approve: boolean) => {
    if (selectedTaskIds.size === 0) return;

    try {
      setBulkOperationLoading(true);
      await bulkApproveTasks(Array.from(selectedTaskIds), approve);
      setSelectedTaskIds(new Set());
      await loadTasks();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to update task approval"
      );
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedTaskIds.size === 0) return;

    try {
      setBulkOperationLoading(true);
      await bulkUpdateStatus(
        Array.from(selectedTaskIds),
        status as "pending" | "in_progress" | "complete" | "archived"
      );
      setSelectedTaskIds(new Set());
      await loadTasks();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to update task status"
      );
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedTaskIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
            <CheckSquare className="h-4 w-4" />
            <span>
              {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? "s" : ""}{" "}
              selected
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusChange(e.target.value);
                  e.target.value = "";
                }
              }}
              disabled={bulkOperationLoading}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold uppercase text-gray-700 transition hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Change Status...</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="complete">Complete</option>
            </select>
            <button
              onClick={() => handleBulkApprove(true)}
              disabled={bulkOperationLoading}
              className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold uppercase text-green-700 transition hover:border-green-300 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              onClick={() => handleBulkApprove(false)}
              disabled={bulkOperationLoading}
              className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold uppercase text-yellow-700 transition hover:border-yellow-300 hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-3.5 w-3.5" />
              Unapprove
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkOperationLoading}
              className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkOperationLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete
            </button>
            <button
              onClick={() => setSelectedTaskIds(new Set())}
              disabled={bulkOperationLoading}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Client
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-medium text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.domain_name}>
                  {client.domain_name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Status
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-medium text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="complete">Complete</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Category
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-medium text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Categories</option>
              <option value="ALLORO">ALLORO</option>
              <option value="USER">USER</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Approval
            <select
              value={selectedApproval}
              onChange={(e) => setSelectedApproval(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-medium text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All</option>
              <option value="true">Approved</option>
              <option value="false">Pending</option>
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
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold uppercase text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Task
          </button>
          <button
            type="button"
            onClick={loadTasks}
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

      {/* Tasks Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[auto_1.2fr_1.8fr_1fr_1fr_1fr_1fr_1fr] items-center gap-4 border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <button
            onClick={toggleSelectAll}
            disabled={tasks.length === 0}
            className="flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              selectedTaskIds.size === tasks.length
                ? "Deselect all"
                : "Select all"
            }
          >
            {selectedTaskIds.size === tasks.length && tasks.length > 0 ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4 text-gray-400" />
            )}
          </button>
          <span>Client</span>
          <span>Task</span>
          <span>Category</span>
          <span>Status</span>
          <span>Approval</span>
          <span>Created</span>
          <span className="text-right">Actions</span>
        </div>
        {loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading tasks...</span>
          </div>
        ) : error ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadTasks}
              className="rounded-full border border-blue-200 px-4 py-2 text-xs font-semibold uppercase text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
            >
              Retry
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            No tasks found for the selected filters.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`grid grid-cols-[auto_1.2fr_1.8fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-b border-gray-100 px-4 py-4 last:border-b-0 ${
                selectedTaskIds.has(task.id) ? "bg-blue-50" : ""
              }`}
            >
              <button
                onClick={() => toggleSelectTask(task.id)}
                className="flex items-center justify-center"
                title={
                  selectedTaskIds.has(task.id) ? "Deselect task" : "Select task"
                }
              >
                {selectedTaskIds.has(task.id) ? (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
              <div className="text-sm text-gray-700">{task.domain_name}</div>
              <div>
                <div className="text-sm text-gray-900 font-medium">
                  {task.title}
                </div>
                {task.description && (
                  <div className="text-xs text-gray-500 line-clamp-1">
                    {task.description}
                  </div>
                )}
              </div>
              <div>
                {updatingCategoryId === task.id ? (
                  <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating...
                  </div>
                ) : (
                  <select
                    value={task.category}
                    onChange={(e) =>
                      handleCategoryChange(task.id, e.target.value)
                    }
                    disabled={updatingCategoryId !== null}
                    className={`rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      task.category === "ALLORO"
                        ? "text-purple-700"
                        : "text-blue-700"
                    }`}
                  >
                    <option value="ALLORO">ALLORO</option>
                    <option value="USER">USER</option>
                  </select>
                )}
              </div>
              <div>
                {updatingStatusId === task.id ? (
                  <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating...
                  </div>
                ) : (
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleStatusChange(task.id, e.target.value)
                    }
                    disabled={updatingStatusId !== null}
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="complete">Complete</option>
                  </select>
                )}
              </div>
              <div>
                {updatingApprovalId === task.id ? (
                  <div className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold uppercase text-blue-700">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating...
                  </div>
                ) : (
                  <button
                    onClick={() => handleApprove(task.id, task.is_approved)}
                    disabled={updatingApprovalId !== null}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold uppercase transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      task.is_approved
                        ? "border border-green-200 bg-green-100 text-green-700 hover:border-green-300"
                        : "border border-yellow-200 bg-yellow-100 text-yellow-700 hover:border-yellow-300"
                    }`}
                  >
                    {task.is_approved ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    {task.is_approved ? "Approved" : "Pending"}
                  </button>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(task.created_at)}
              </div>
              <div className="flex items-center justify-end gap-2">
                {deletingId === task.id ? (
                  <div className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase text-blue-700">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </div>
                ) : (
                  <button
                    onClick={() => handleArchive(task.id)}
                    disabled={deletingId !== null}
                    className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold uppercase text-red-600 transition hover:border-red-300 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Archive task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
        <div>
          {tasks.length > 0 ? (
            <span>
              Showing {tasks.length} task{tasks.length !== 1 ? "s" : ""}
            </span>
          ) : (
            <span>0 tasks</span>
          )}
        </div>
        {!loading && !error && tasks.length > 0 && (
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <span>
              <strong className="text-gray-900">
                {tasks.filter((t) => !t.is_approved).length}
              </strong>{" "}
              pending approval
            </span>
            <span>
              <strong className="text-gray-900">
                {tasks.filter((t) => t.status !== "complete").length}
              </strong>{" "}
              active
            </span>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadTasks();
        }}
        clients={clients}
      />
    </div>
  );
}
