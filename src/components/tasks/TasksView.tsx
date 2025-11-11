import { useState, useEffect, useRef } from "react";
import {
  CheckSquare,
  Square,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { fetchClientTasks, completeTask } from "../../api/tasks";
import type { GroupedActionItems } from "../../types/tasks";

interface TasksViewProps {
  googleAccountId: number | null;
}

export function TasksView({ googleAccountId }: TasksViewProps) {
  const [tasks, setTasks] = useState<GroupedActionItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [clampedTasks, setClampedTasks] = useState<Set<number>>(new Set());
  const descriptionRefs = useRef<Map<number, HTMLParagraphElement>>(new Map());

  // Check which descriptions are clamped after tasks load
  useEffect(() => {
    if (!tasks) return;

    const checkClamped = () => {
      const newClampedTasks = new Set<number>();
      descriptionRefs.current.forEach((element, taskId) => {
        if (element && element.scrollHeight > element.clientHeight) {
          newClampedTasks.add(taskId);
        }
      });
      setClampedTasks(newClampedTasks);
    };

    // Small delay to ensure DOM is rendered
    setTimeout(checkClamped, 100);
  }, [tasks]);

  // Fetch tasks on mount and when googleAccountId changes
  useEffect(() => {
    if (!googleAccountId) {
      setLoading(false);
      return;
    }

    loadTasks();
  }, [googleAccountId]);

  const loadTasks = async () => {
    if (!googleAccountId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetchClientTasks(googleAccountId);
      setTasks(response.tasks);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: number, currentStatus: string) => {
    if (!googleAccountId) return;

    try {
      setCompletingTaskId(taskId);

      // If task is complete, mark as pending (undo). Otherwise, mark as complete.
      if (currentStatus === "complete") {
        // Undo completion - use the update endpoint to set status to pending
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "pending" }),
        });

        if (!response.ok) {
          throw new Error("Failed to undo task completion");
        }
      } else {
        // Mark as complete
        await completeTask(taskId, googleAccountId);
      }

      // Reload tasks to get updated state
      await loadTasks();
    } catch (err) {
      console.error("Failed to toggle task:", err);
      alert(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setCompletingTaskId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "pending":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Square className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      complete: "bg-green-100 text-green-800",
      in_progress: "bg-blue-100 text-blue-800",
      pending: "bg-yellow-100 text-yellow-800",
    };

    return (
      <span
        className={`px-2 py-1 text-xs rounded-full font-medium ${
          statusConfig[status as keyof typeof statusConfig] ||
          "bg-gray-100 text-gray-800"
        }`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!googleAccountId) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>No account selected. Please log in to view tasks.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadTasks}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const alloroTasks = tasks?.ALLORO || [];
  const userTasks = tasks?.USER || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Action Items</h2>
          <p className="text-gray-600 mt-1">
            Manage your tasks and track progress
          </p>
        </div>
        <button
          onClick={loadTasks}
          disabled={loading}
          className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Refresh
        </button>
      </div>

      {loading && tasks === null && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading your tasks...</span>
          </div>
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ALLORO Tasks Column (Left) - Read Only */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              Alloro Tasks
            </h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {alloroTasks.length} tasks
            </span>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-sm text-purple-800">
              <strong>Note:</strong> These tasks are managed by Alloro and are
              read-only. Track their status here.
            </p>
          </div>

          <div className="space-y-3">
            {alloroTasks.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No Alloro tasks at the moment</p>
              </div>
            ) : (
              alloroTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getStatusIcon(task.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 line-clamp-2">
                          {task.title}
                        </h4>
                        {getStatusBadge(task.status)}
                      </div>
                      {task.description && (
                        <div className="mb-3">
                          <p
                            ref={(el) => {
                              if (el) {
                                descriptionRefs.current.set(task.id, el);
                              }
                            }}
                            onClick={() => {
                              if (clampedTasks.has(task.id)) {
                                setExpandedTaskId(
                                  expandedTaskId === task.id ? null : task.id
                                );
                              }
                            }}
                            className={`text-sm text-gray-600 transition-colors ${
                              expandedTaskId === task.id ? "" : "line-clamp-2"
                            } ${
                              clampedTasks.has(task.id)
                                ? "cursor-pointer hover:text-gray-800"
                                : ""
                            }`}
                            title={
                              clampedTasks.has(task.id)
                                ? "Click to expand/collapse"
                                : undefined
                            }
                          >
                            {task.description}
                          </p>
                          {clampedTasks.has(task.id) && (
                            <button
                              onClick={() =>
                                setExpandedTaskId(
                                  expandedTaskId === task.id ? null : task.id
                                )
                              }
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                            >
                              {expandedTaskId === task.id
                                ? "Show less"
                                : "Read more"}
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Created {formatDate(task.created_at)}</span>
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* USER Tasks Column (Right) - Interactive */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              Your Tasks
            </h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {userTasks.length} tasks
            </span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Check off tasks as you complete them to keep
              track of your progress.
            </p>
          </div>

          <div className="space-y-3">
            {userTasks.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">
                  All caught up! No tasks pending.
                </p>
              </div>
            ) : (
              userTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white border rounded-lg p-4 transition-all ${
                    task.status === "complete"
                      ? "border-green-200 bg-green-50/30"
                      : "border-gray-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleTask(task.id, task.status)}
                      disabled={completingTaskId === task.id}
                      className={`mt-1 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform disabled:cursor-not-allowed disabled:hover:scale-100`}
                      title={
                        task.status === "complete"
                          ? "Click to undo completion"
                          : "Click to mark as complete"
                      }
                    >
                      {completingTaskId === task.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      ) : task.status === "complete" ? (
                        <CheckSquare className="w-5 h-5 text-green-600 hover:text-green-700" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4
                          className={`font-medium line-clamp-2 ${
                            task.status === "complete"
                              ? "text-gray-500 line-through"
                              : "text-gray-900"
                          }`}
                        >
                          {task.title}
                        </h4>
                        {getStatusBadge(task.status)}
                      </div>
                      {task.description && (
                        <div className="mb-3">
                          <p
                            ref={(el) => {
                              if (el) {
                                descriptionRefs.current.set(task.id, el);
                              }
                            }}
                            onClick={() => {
                              if (clampedTasks.has(task.id)) {
                                setExpandedTaskId(
                                  expandedTaskId === task.id ? null : task.id
                                );
                              }
                            }}
                            className={`text-sm transition-opacity ${
                              expandedTaskId === task.id ? "" : "line-clamp-2"
                            } ${
                              task.status === "complete"
                                ? "text-gray-400"
                                : "text-gray-600"
                            } ${
                              clampedTasks.has(task.id)
                                ? "cursor-pointer hover:opacity-80"
                                : ""
                            }`}
                            title={
                              clampedTasks.has(task.id)
                                ? "Click to expand/collapse"
                                : undefined
                            }
                          >
                            {task.description}
                          </p>
                          {clampedTasks.has(task.id) && (
                            <button
                              onClick={() =>
                                setExpandedTaskId(
                                  expandedTaskId === task.id ? null : task.id
                                )
                              }
                              className={`text-xs font-medium mt-1 ${
                                task.status === "complete"
                                  ? "text-gray-400 hover:text-gray-500"
                                  : "text-blue-600 hover:text-blue-800"
                              }`}
                            >
                              {expandedTaskId === task.id
                                ? "Show less"
                                : "Read more"}
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Created {formatDate(task.created_at)}</span>
                        {task.completed_at && (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed {formatDate(task.completed_at)}
                          </span>
                        )}
                        {task.due_date && !task.completed_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <span className="text-gray-600">
              <strong className="text-gray-900">
                {alloroTasks.filter((t) => t.status !== "complete").length}
              </strong>{" "}
              Alloro tasks active
            </span>
            <span className="text-gray-600">
              <strong className="text-gray-900">
                {userTasks.filter((t) => t.status !== "complete").length}
              </strong>{" "}
              of <strong className="text-gray-900">{userTasks.length}</strong>{" "}
              your tasks remaining
            </span>
          </div>
          <span className="text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}
