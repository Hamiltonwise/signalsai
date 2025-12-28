import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  CheckSquare,
  Square,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCw,
  Target,
  Zap,
  Layout,
  Users,
  Plus,
} from "lucide-react";
import { fetchClientTasks, completeTask } from "../../api/tasks";
import type { GroupedActionItems, ActionItem } from "../../types/tasks";
import { parseHighlightTags } from "../../utils/textFormatting";

interface TasksViewProps {
  googleAccountId: number | null;
}

interface TaskCardProps {
  task: ActionItem;
  isReadOnly: boolean;
  isCompleting?: boolean;
  canEdit: boolean;
  onToggle?: () => void;
  onExpand?: () => void;
  isExpanded?: boolean;
  isClamped?: boolean;
  descriptionRef?: (el: HTMLParagraphElement | null) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isReadOnly,
  isCompleting,
  canEdit,
  onToggle,
  onExpand,
  isExpanded,
  isClamped,
  descriptionRef,
}) => {
  const isDone = task.status === "complete";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPriority = () => {
    try {
      const metadata =
        typeof task.metadata === "string"
          ? JSON.parse(task.metadata)
          : task.metadata;
      return metadata?.urgency || "Normal";
    } catch {
      return "Normal";
    }
  };

  const priority = getPriority();
  const isHighPriority = priority === "Immediate" || priority === "High";

  return (
    <div
      onClick={!isReadOnly && canEdit ? onToggle : undefined}
      className={`
        group relative bg-white rounded-2xl p-5 sm:p-6 lg:p-8 border transition-all duration-300 select-none
        ${
          isDone
            ? "border-green-100 bg-green-50/20 opacity-60"
            : "border-slate-100 shadow-premium hover:shadow-xl hover:border-alloro-cobalt/20"
        }
        ${!isReadOnly && canEdit ? "cursor-pointer active:scale-[0.98]" : ""}
      `}
    >
      <div className="flex flex-row gap-4 sm:gap-6 items-start">
        <div className="shrink-0 mt-1">
          {isReadOnly ? (
            isDone ? (
              <CheckCircle2 size={24} className="text-green-500" />
            ) : (
              <div className="p-1.5 bg-alloro-navy/5 rounded-lg text-alloro-navy">
                <Zap size={20} />
              </div>
            )
          ) : isCompleting ? (
            <Loader2 size={24} className="animate-spin text-alloro-cobalt" />
          ) : isDone ? (
            <CheckSquare size={24} className="text-green-500" />
          ) : (
            <Square
              size={24}
              className={`text-slate-200 ${
                canEdit ? "group-hover:text-alloro-cobalt" : ""
              } transition-colors`}
            />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h3
              className={`font-bold text-[16px] sm:text-[17px] text-alloro-navy font-heading tracking-tight leading-tight transition-all ${
                isDone ? "line-through opacity-30" : ""
              }`}
            >
              {parseHighlightTags(task.title, "underline")}
            </h3>
            {isHighPriority && !isDone && (
              <span className="px-2 py-0.5 bg-alloro-cobalt/10 text-alloro-cobalt text-[8px] font-bold uppercase tracking-widest rounded leading-none">
                High Priority
              </span>
            )}
          </div>
          {task.description && (
            <div>
              <p
                ref={descriptionRef}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isClamped && onExpand) onExpand();
                }}
                className={`text-[13px] sm:text-[14px] leading-relaxed font-medium tracking-tight transition-all ${
                  isDone ? "opacity-30" : "text-slate-500"
                } ${!isExpanded ? "line-clamp-2" : ""} ${
                  isClamped ? "cursor-pointer hover:opacity-80" : ""
                }`}
              >
                {parseHighlightTags(task.description, "underline")}
              </p>
              {isClamped && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onExpand) onExpand();
                  }}
                  className="text-xs text-alloro-cobalt hover:text-blue-700 font-semibold mt-1"
                >
                  {isExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 border-t border-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <Clock size={14} className="opacity-40" />{" "}
              {isDone && task.completed_at
                ? `Verified: ${formatDate(task.completed_at)}`
                : task.due_date
                ? `Due: ${formatDate(task.due_date)}`
                : `Created: ${formatDate(task.created_at)}`}
            </span>
            <span className="flex items-center gap-2">
              <Users size={14} className="opacity-40" />{" "}
              {task.agent_type || "User"}
            </span>
            <span className="px-2 py-0.5 bg-slate-50 rounded text-slate-500">
              {task.category}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export function TasksView({ googleAccountId }: TasksViewProps) {
  const [tasks, setTasks] = useState<GroupedActionItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [clampedTasks, setClampedTasks] = useState<Set<number>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [completionPct, setCompletionPct] = useState(0);
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

  // Calculate completion percentage
  useEffect(() => {
    if (!tasks) return;
    const allTasks = [...(tasks.ALLORO || []), ...(tasks.USER || [])];
    const total = allTasks.length;
    const done = allTasks.filter((t) => t.status === "complete").length;
    setCompletionPct(total > 0 ? Math.round((done / total) * 100) : 0);
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

  const handleSync = async () => {
    setIsRefreshing(true);
    await loadTasks();
    setTimeout(() => setIsRefreshing(false), 800);
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

  if (!googleAccountId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center py-16"
      >
        <div className="text-center max-w-md bg-white rounded-2xl border border-slate-200 shadow-premium p-10">
          <div className="p-4 bg-slate-100 rounded-2xl w-fit mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-alloro-navy font-heading mb-2 tracking-tight">
            No Account Selected
          </h3>
          <p className="text-slate-500 text-sm font-medium">
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
        <div className="text-center max-w-md bg-white rounded-2xl border border-slate-200 shadow-premium p-10">
          <div className="p-4 bg-red-50 rounded-2xl w-fit mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-alloro-navy font-heading mb-2 tracking-tight">
            Unable to Load Tasks
          </h3>
          <p className="text-slate-500 text-sm font-medium mb-6">{error}</p>
          <button
            onClick={loadTasks}
            className="px-6 py-3 bg-alloro-cobalt text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-sm flex items-center gap-2 mx-auto"
          >
            <RotateCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  const alloroTasks = tasks?.ALLORO || [];
  const userTasks = tasks?.USER || [];
  const totalTasks = alloroTasks.length + userTasks.length;
  const doneTasks = [...alloroTasks, ...userTasks].filter(
    (t) => t.status === "complete"
  ).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-alloro-navy">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 lg:sticky lg:top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-alloro-navy text-white rounded-xl flex items-center justify-center shadow-lg">
              <Target size={20} />
            </div>
            <div>
              <h1 className="text-[10px] font-bold font-heading text-alloro-navy uppercase tracking-[0.2em]">
                Execution Plan
              </h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Strategy Sprint 2026
              </p>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={loading}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white border border-slate-200 text-alloro-navy rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-alloro-cobalt transition-all shadow-sm disabled:opacity-50"
          >
            <RotateCw
              size={14}
              className={isRefreshing ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">
              {isRefreshing ? "Syncing..." : "Sync Hub"}
            </span>
            <span className="sm:hidden">{isRefreshing ? "..." : "Sync"}</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-12 lg:space-y-16">
        {/* Sprint Progress Monitor */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 lg:p-12 shadow-premium relative overflow-hidden">
          <div className="absolute top-0 right-0 p-48 bg-alloro-cobalt/5 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 sm:gap-10">
            {/* Circular Progress */}
            <div className="w-24 sm:w-32 h-24 sm:h-32 rounded-full border-[8px] sm:border-[10px] border-slate-50 flex items-center justify-center text-2xl sm:text-3xl font-bold font-heading text-alloro-navy relative shrink-0">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="42%"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-100"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="42%"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * completionPct) / 100}
                  strokeLinecap="round"
                  className="text-alloro-cobalt transition-all duration-1000"
                />
              </svg>
              {completionPct}%
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-alloro-navy tracking-tight leading-none">
                Sprint Readiness Monitor
              </h2>
              <p className="text-sm sm:text-base text-slate-500 font-medium tracking-tight">
                Completed{" "}
                <span className="text-alloro-cobalt font-bold">
                  {doneTasks} of {totalTasks} tasks
                </span>
                .
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0 w-full md:w-auto">
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 min-w-[80px] sm:min-w-[100px] text-center">
                <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">
                  Alloro
                </p>
                <p className="text-lg sm:text-xl font-bold font-heading text-alloro-navy leading-none">
                  {alloroTasks.length}
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 min-w-[80px] sm:min-w-[100px] text-center">
                <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">
                  Manual
                </p>
                <p className="text-lg sm:text-xl font-bold font-heading text-alloro-navy leading-none">
                  {userTasks.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {loading && tasks === null && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 animate-pulse">
            {/* Left Column Skeleton */}
            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center gap-4 px-2">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="h-6 w-32 bg-slate-200 rounded" />
              </div>
              <div className="space-y-4 sm:space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 lg:p-8 shadow-premium"
                  >
                    <div className="flex gap-4 sm:gap-6">
                      <div className="w-6 h-6 bg-slate-200 rounded-lg shrink-0 mt-1" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-48 bg-slate-200 rounded" />
                        <div className="h-4 w-full bg-slate-200 rounded" />
                        <div className="h-4 w-3/4 bg-slate-200 rounded" />
                        <div className="flex gap-4 pt-4 border-t border-slate-50">
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
            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center gap-4 px-2">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="h-6 w-28 bg-slate-200 rounded" />
              </div>
              <div className="space-y-4 sm:space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 lg:p-8 shadow-premium"
                  >
                    <div className="flex gap-4 sm:gap-6">
                      <div className="w-6 h-6 bg-slate-200 rounded shrink-0 mt-1" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-44 bg-slate-200 rounded" />
                        <div className="h-4 w-full bg-slate-200 rounded" />
                        <div className="h-4 w-2/3 bg-slate-200 rounded" />
                        <div className="flex gap-4 pt-4 border-t border-slate-50">
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

        {/* Task Segmentation */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {/* System Directives (Alloro Tasks) */}
          <div className="space-y-6 sm:space-y-8">
            <div className="flex items-center gap-4 px-2">
              <div className="w-10 h-10 bg-alloro-navy text-white rounded-xl flex items-center justify-center shadow-lg">
                <Zap size={20} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-heading text-alloro-navy tracking-tight">
                Alloro Tasks
              </h2>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {alloroTasks.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center shadow-premium">
                  <div className="p-4 bg-slate-100 rounded-2xl w-fit mx-auto mb-4">
                    <CheckSquare className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium">
                    No system directives at the moment
                  </p>
                </div>
              ) : (
                alloroTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isReadOnly={true}
                    canEdit={false}
                    isExpanded={expandedTaskId === task.id}
                    isClamped={clampedTasks.has(task.id)}
                    onExpand={() =>
                      setExpandedTaskId(
                        expandedTaskId === task.id ? null : task.id
                      )
                    }
                    descriptionRef={(el) => {
                      if (el) descriptionRefs.current.set(task.id, el);
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Practice Actions (Your Tasks) */}
          <div className="space-y-6 sm:space-y-8">
            <div className="flex items-center gap-4 px-2">
              <div className="w-10 h-10 bg-alloro-cobalt text-white rounded-xl flex items-center justify-center shadow-lg">
                <Layout size={20} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-heading text-alloro-navy tracking-tight">
                Your Tasks
              </h2>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {userTasks.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center shadow-premium">
                  <div className="p-4 bg-green-50 rounded-2xl w-fit mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <p className="text-slate-500 font-medium">
                    All caught up! No tasks pending.
                  </p>
                </div>
              ) : (
                userTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isReadOnly={false}
                    isCompleting={completingTaskId === task.id}
                    canEdit={canEditTasks}
                    onToggle={() => handleToggleTask(task.id, task.status)}
                    isExpanded={expandedTaskId === task.id}
                    isClamped={clampedTasks.has(task.id)}
                    onExpand={() =>
                      setExpandedTaskId(
                        expandedTaskId === task.id ? null : task.id
                      )
                    }
                    descriptionRef={(el) => {
                      if (el) descriptionRefs.current.set(task.id, el);
                    }}
                  />
                ))
              )}

              {/* Add Manual Task Button */}
              <button className="w-full py-12 sm:py-16 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-4 text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] hover:border-alloro-cobalt hover:text-alloro-cobalt transition-all group shadow-inner-soft">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all">
                  <Plus size={24} />
                </div>
                Add Manual Task
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
