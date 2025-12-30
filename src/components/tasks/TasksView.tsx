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
  HelpCircle,
  Send,
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
  const [showHelp, setShowHelp] = useState(false);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const isDone = task.status === "complete";

  const handleHelpSubmit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!comment.trim()) return;
    setSent(true);
    setTimeout(() => {
      setShowHelp(false);
      setComment("");
      setSent(false);
    }, 1500);
  };

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
        group relative bg-white rounded-3xl p-8 border transition-all duration-500 select-none text-left
        ${
          isDone
            ? "border-green-100 bg-green-50/20 opacity-60 shadow-none"
            : "border-black/5 shadow-premium hover:shadow-2xl hover:border-alloro-orange/20 hover:-translate-y-1"
        }
        ${!isReadOnly && canEdit ? "cursor-pointer active:scale-[0.98]" : ""}
      `}
    >
      <div className="flex flex-row gap-8 items-start">
        <div className="shrink-0 mt-1">
          {isCompleting ? (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center border-2 border-alloro-orange/20">
              <Loader2 size={18} className="animate-spin text-alloro-orange" />
            </div>
          ) : isDone ? (
            <div className="w-8 h-8 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/20">
              <CheckSquare size={20} />
            </div>
          ) : (
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
                isReadOnly
                  ? "bg-alloro-navy/5 text-alloro-navy border-transparent"
                  : "bg-white border-slate-200 group-hover:border-alloro-orange group-hover:bg-alloro-orange/5 text-slate-200 group-hover:text-alloro-orange"
              }`}
            >
              {isReadOnly ? <Zap size={18} /> : <Square size={18} />}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <h3
                className={`font-black text-xl text-alloro-navy font-heading tracking-tight leading-tight transition-all ${
                  isDone ? "line-through opacity-30" : ""
                }`}
              >
                {parseHighlightTags(task.title, "underline")}
              </h3>
              {isHighPriority && !isDone && (
                <span className="px-3 py-1 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-red-100 leading-none">
                  Priority Alpha
                </span>
              )}
            </div>
            {!isDone && !isReadOnly && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHelp(!showHelp);
                }}
                className={`p-2 rounded-xl transition-all duration-300 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${
                  showHelp
                    ? "bg-alloro-orange text-white"
                    : "bg-alloro-bg text-slate-400 hover:text-alloro-orange hover:bg-alloro-orange/5"
                }`}
              >
                <HelpCircle size={14} /> {showHelp ? "Close" : "Ask Question"}
              </button>
            )}
          </div>

          {showHelp ? (
            <div
              className="animate-in fade-in slide-in-from-top-2 duration-300 py-4 space-y-4 border-t border-black/5 mt-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <textarea
                  autoFocus
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Where should I place the QR code?"
                  className="w-full h-24 bg-alloro-bg border border-black/5 rounded-2xl px-5 py-4 text-alloro-navy font-bold text-sm focus:outline-none focus:border-alloro-orange focus:ring-4 focus:ring-alloro-orange/5 transition-all resize-none"
                />
                <button
                  onClick={handleHelpSubmit}
                  disabled={!comment.trim() || sent}
                  className="absolute bottom-4 right-4 p-2.5 bg-alloro-navy text-white rounded-xl shadow-lg hover:bg-black transition-all active:scale-95 disabled:opacity-30"
                >
                  {sent ? <CheckCircle2 size={16} /> : <Send size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight">
                Your strategist will receive this inquiry immediately.
              </p>
            </div>
          ) : (
            <>
              {task.description && (
                <div>
                  <p
                    ref={descriptionRef}
                    className={`text-[16px] leading-relaxed font-bold tracking-tight transition-all ${
                      isDone ? "opacity-30" : "text-slate-500"
                    } ${!isExpanded ? "line-clamp-2" : ""} ${
                      isClamped ? "cursor-pointer hover:opacity-80" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isClamped && onExpand) onExpand();
                    }}
                  >
                    {parseHighlightTags(task.description, "underline")}
                  </p>
                  {isClamped && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onExpand) onExpand();
                      }}
                      className="text-xs text-alloro-orange hover:text-blue-700 font-bold mt-2 uppercase tracking-widest"
                    >
                      {isExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-10 gap-y-3 pt-6 border-t border-black/5 text-[10px] font-black text-alloro-textDark/30 uppercase tracking-[0.2em]">
                <span className="flex items-center gap-2.5">
                  <Clock size={16} className="text-alloro-orange/40" />{" "}
                  {isDone && task.completed_at
                    ? `Verified: ${formatDate(task.completed_at)}`
                    : task.due_date
                    ? `Due: ${formatDate(task.due_date)}`
                    : `Created: ${formatDate(task.created_at)}`}
                </span>
                <span className="flex items-center gap-2.5">
                  <Users size={16} className="text-alloro-orange/40" />{" "}
                  {task.agent_type || "User"}
                </span>
                <div className="flex items-center gap-2">
                  <Layout size={14} className="opacity-40" />
                  <span className="text-slate-500">
                    {task.category} Coordinator Hub
                  </span>
                </div>
              </div>
            </>
          )}
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

      // Dispatch custom event to notify Sidebar of task changes
      window.dispatchEvent(new CustomEvent("tasks:updated"));
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
            className="px-6 py-3 bg-alloro-orange text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-sm flex items-center gap-2 mx-auto"
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
    <div className="min-h-screen bg-alloro-bg font-body text-alloro-textDark pb-32 selection:bg-alloro-orange selection:text-white">
      <header className="glass-header border-b border-black/5 lg:sticky lg:top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 bg-alloro-navy text-white rounded-xl flex items-center justify-center shadow-lg">
              <Target size={20} />
            </div>
            <div className="flex flex-col text-left">
              <h1 className="text-[11px] font-black font-heading text-alloro-textDark uppercase tracking-[0.25em] leading-none">
                Execution Plan
              </h1>
              <span className="text-[9px] font-bold text-alloro-textDark/40 uppercase tracking-widest mt-1.5 hidden sm:inline">
                Tactical Sprint Protocol
              </span>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={loading}
            className="flex items-center gap-3 px-6 py-3.5 bg-white border border-black/5 text-alloro-navy rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:border-alloro-orange/20 transition-all shadow-premium active:scale-95 disabled:opacity-50"
          >
            <RotateCw
              size={14}
              className={isRefreshing ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">
              {isRefreshing ? "Synchronizing..." : "Sync Execution Hub"}
            </span>
            <span className="sm:hidden">{isRefreshing ? "..." : "Sync"}</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-[1100px] mx-auto px-6 lg:px-10 py-10 lg:py-16 space-y-12 lg:space-y-20">
        {/* HERO SECTION */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 text-left pt-2">
          <div className="flex items-center gap-4 mb-3">
            <div className="px-3 py-1.5 bg-alloro-orange/5 rounded-lg text-alloro-orange text-[10px] font-black uppercase tracking-widest border border-alloro-orange/10 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-alloro-orange"></span>
              Sprint v2.4 Live
            </div>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black font-heading text-alloro-navy tracking-tight leading-none mb-4">
            Operational Flow.
          </h1>
          <p className="text-xl lg:text-2xl text-slate-500 font-medium tracking-tight leading-relaxed max-w-4xl">
            Coordinating{" "}
            <span className="text-alloro-orange underline underline-offset-8 font-black">
              Alloro Intelligence & Practice Effort
            </span>{" "}
            to eliminate bottlenecks and capture production.
          </p>
        </section>

        {/* SPRINT INTEGRITY MONITOR */}
        <section className="bg-white rounded-[2.5rem] border border-black/5 p-10 lg:p-16 shadow-premium relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-alloro-orange/[0.03] rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none group-hover:bg-alloro-orange/[0.06] transition-all duration-700"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            <div className="w-40 h-40 rounded-full border-[12px] border-slate-50 flex items-center justify-center text-4xl font-black font-heading text-alloro-navy relative shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-700">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="42%"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-slate-50"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="42%"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * completionPct) / 100}
                  strokeLinecap="round"
                  className="text-alloro-orange transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(214,104,83,0.3)]"
                />
              </svg>
              <span className="font-sans tabular-nums">{completionPct}%</span>
            </div>
            <div className="flex-1 space-y-4 text-center md:text-left">
              <h2 className="text-3xl lg:text-4xl font-black font-heading text-alloro-navy tracking-tighter leading-none">
                Sprint Integrity Monitor
              </h2>
              <p className="text-lg lg:text-xl text-slate-500 font-medium tracking-tight leading-relaxed max-w-lg">
                You have verified{" "}
                <span className="text-alloro-orange font-black">
                  {doneTasks} of {totalTasks} tactical directives
                </span>{" "}
                in the current window.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 shrink-0 w-full md:w-auto">
              <div className="bg-slate-50/80 rounded-3xl p-8 border border-black/5 text-center min-w-[120px] group-hover:bg-white transition-colors duration-500">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">
                  System
                </p>
                <p className="text-3xl font-black font-heading text-alloro-navy leading-none font-sans">
                  {alloroTasks.length}
                </p>
              </div>
              <div className="bg-slate-50/80 rounded-3xl p-8 border border-black/5 text-center min-w-[120px] group-hover:bg-white transition-colors duration-500">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">
                  Manual
                </p>
                <p className="text-3xl font-black font-heading text-alloro-navy leading-none font-sans">
                  {userTasks.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TASK SEGMENTATION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Alloro Tasks */}
          <div className="space-y-10">
            <div className="flex items-center gap-5 px-2">
              <div className="w-12 h-12 bg-alloro-navy text-white rounded-2xl flex items-center justify-center shadow-xl">
                <Zap size={24} />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-black font-heading text-alloro-navy tracking-tight leading-none">
                  Alloro Directives
                </h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                  Algorithmic Operations
                </p>
              </div>
            </div>
            <div className="space-y-6">
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

          {/* User Tasks */}
          <div className="space-y-10">
            <div className="flex items-center gap-5 px-2">
              <div className="w-12 h-12 bg-alloro-orange text-white rounded-2xl flex items-center justify-center shadow-xl">
                <Layout size={24} />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-black font-heading text-alloro-navy tracking-tight leading-none">
                  Manual Protocol
                </h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                  Staff Execution Steps
                </p>
              </div>
            </div>
            <div className="space-y-6">
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
              <button className="w-full py-16 sm:py-20 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-6 text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] hover:border-alloro-orange hover:text-alloro-orange hover:bg-white transition-all group shadow-inner-soft active:scale-[0.99]">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center group-hover:scale-110 group-hover:shadow-premium transition-all">
                  <Plus size={28} />
                </div>
                Initialize Manual Task
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
