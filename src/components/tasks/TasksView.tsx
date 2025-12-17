import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  CheckSquare,
  Square,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ClipboardList,
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

  // Get user role for permission checks
  const userRole = localStorage.getItem("user_role");
  const canEditTasks = userRole === "admin" || userRole === "manager";

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center py-16"
      >
        <div className="text-center max-w-md bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8">
          <div className="p-3 bg-slate-100 rounded-xl w-fit mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-alloro-navy font-heading mb-2">
            No Account Selected
          </h3>
          <p className="text-slate-600 text-sm">
            Please log in to view your tasks.
          </p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center py-16"
      >
        <div className="text-center max-w-md bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8">
          <div className="p-3 bg-red-50 rounded-xl w-fit mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-alloro-navy font-heading mb-2">
            Unable to Load Tasks
          </h3>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <button
            onClick={loadTasks}
            className="px-5 py-2.5 bg-alloro-cobalt text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  const alloroTasks = tasks?.ALLORO || [];
  const userTasks = tasks?.USER || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-alloro-cobalt/10 rounded-xl">
              <ClipboardList className="w-6 h-6 text-alloro-cobalt" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-alloro-navy tracking-tight">
                Action Items
              </h1>
              <p className="text-slate-500 text-sm mt-0.5 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-alloro-cobalt"></span>
                Manage your tasks and track progress
              </p>
            </div>
          </div>
          <button
            onClick={loadTasks}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:text-alloro-cobalt hover:border-alloro-cobalt/30 transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>
      </header>

      {loading && tasks === null && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
          {/* Left Column Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <div className="h-5 w-28 bg-slate-200 rounded" />
              </div>
              <div className="h-7 w-16 bg-slate-200 rounded-full" />
            </div>
            <div className="h-16 bg-slate-200 rounded-xl" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-slate-200 rounded mt-1" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="h-5 w-48 bg-slate-200 rounded" />
                        <div className="h-6 w-20 bg-slate-200 rounded-full" />
                      </div>
                      <div className="h-4 w-full bg-slate-200 rounded mb-1" />
                      <div className="h-4 w-3/4 bg-slate-200 rounded mb-3" />
                      <div className="flex items-center gap-4">
                        <div className="h-3 w-24 bg-slate-200 rounded" />
                        <div className="h-3 w-20 bg-slate-200 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <div className="h-5 w-24 bg-slate-200 rounded" />
              </div>
              <div className="h-7 w-16 bg-slate-200 rounded-full" />
            </div>
            <div className="h-16 bg-slate-200 rounded-xl" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-slate-200 rounded mt-1" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="h-5 w-44 bg-slate-200 rounded" />
                        <div className="h-6 w-20 bg-slate-200 rounded-full" />
                      </div>
                      <div className="h-4 w-full bg-slate-200 rounded mb-1" />
                      <div className="h-4 w-2/3 bg-slate-200 rounded mb-3" />
                      <div className="flex items-center gap-4">
                        <div className="h-3 w-24 bg-slate-200 rounded" />
                        <div className="h-3 w-28 bg-slate-200 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ALLORO Tasks Column (Left) - Read Only */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-alloro-navy font-heading flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              Alloro Tasks
            </h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-bold">
              {alloroTasks.length} tasks
            </span>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-sm text-purple-800">
              <strong className="font-bold">Note:</strong> These tasks are
              managed by Alloro and are read-only. Track their status here.
            </p>
          </div>

          <div className="space-y-3">
            {alloroTasks.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="p-3 bg-slate-100 rounded-xl w-fit mx-auto mb-3">
                  <CheckSquare className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">
                  No Alloro tasks at the moment
                </p>
              </div>
            ) : (
              alloroTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getStatusIcon(task.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-alloro-navy line-clamp-2">
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
                            className={`text-sm text-slate-600 transition-colors ${
                              expandedTaskId === task.id ? "" : "line-clamp-2"
                            } ${
                              clampedTasks.has(task.id)
                                ? "cursor-pointer hover:text-slate-800"
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
                              className="text-xs text-alloro-cobalt hover:text-blue-700 font-bold mt-1"
                            >
                              {expandedTaskId === task.id
                                ? "Show less"
                                : "Read more"}
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
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
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* USER Tasks Column (Right) - Interactive */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-alloro-navy font-heading flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-alloro-cobalt"></div>
              Your Tasks
            </h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-bold">
              {userTasks.length} tasks
            </span>
          </div>

          <div
            className={`border rounded-xl p-4 ${
              canEditTasks
                ? "bg-alloro-cobalt/5 border-alloro-cobalt/20"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <p
              className={`text-sm ${
                canEditTasks ? "text-alloro-navy" : "text-amber-800"
              }`}
            >
              {canEditTasks ? (
                <>
                  <strong className="font-bold">Tip:</strong> Check off tasks as
                  you complete them to keep track of your progress.
                </>
              ) : (
                <>
                  <strong className="font-bold">View Only:</strong> You can view
                  tasks but cannot edit them. Contact an admin or manager to
                  update task status.
                </>
              )}
            </p>
          </div>

          <div className="space-y-3">
            {userTasks.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="p-3 bg-green-50 rounded-xl w-fit mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-slate-500 font-medium">
                  All caught up! No tasks pending.
                </p>
              </div>
            ) : (
              userTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                  className={`bg-white border rounded-2xl p-5 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${
                    task.status === "complete"
                      ? "border-green-200 bg-green-50/30"
                      : "border-slate-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {canEditTasks ? (
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
                          <Loader2 className="w-5 h-5 animate-spin text-alloro-cobalt" />
                        ) : task.status === "complete" ? (
                          <CheckSquare className="w-5 h-5 text-green-600 hover:text-green-700" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400 hover:text-alloro-cobalt" />
                        )}
                      </button>
                    ) : (
                      <div className="mt-1 flex-shrink-0">
                        {task.status === "complete" ? (
                          <CheckSquare className="w-5 h-5 text-green-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4
                          className={`font-bold line-clamp-2 ${
                            task.status === "complete"
                              ? "text-slate-400 line-through"
                              : "text-alloro-navy"
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
                                ? "text-slate-400"
                                : "text-slate-600"
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
                              className={`text-xs font-bold mt-1 ${
                                task.status === "complete"
                                  ? "text-slate-400 hover:text-slate-500"
                                  : "text-alloro-cobalt hover:text-blue-700"
                              }`}
                            >
                              {expandedTaskId === task.id
                                ? "Show less"
                                : "Read more"}
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
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
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Summary Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-slate-600">
              <strong className="text-alloro-navy font-bold tabular-nums">
                {alloroTasks.filter((t) => t.status !== "complete").length}
              </strong>{" "}
              Alloro tasks active
            </span>
            <span className="text-slate-600">
              <strong className="text-alloro-navy font-bold tabular-nums">
                {userTasks.filter((t) => t.status !== "complete").length}
              </strong>{" "}
              of{" "}
              <strong className="text-alloro-navy font-bold tabular-nums">
                {userTasks.length}
              </strong>{" "}
              your tasks remaining
            </span>
          </div>
          <span className="text-slate-400 text-xs font-medium">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
