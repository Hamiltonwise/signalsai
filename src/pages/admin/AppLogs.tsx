import { useState, useEffect, useRef } from "react";
import { Trash2, AlertCircle, RefreshCw } from "lucide-react";

interface LogsData {
  logs: string[];
  total_lines: number;
  timestamp: string;
  log_type: string;
}

interface LogsResponse {
  success: boolean;
  data: LogsData;
  message?: string;
}

// Log type configuration
const LOG_TABS = [
  {
    id: "agent-run",
    label: "Agent Run",
    description: "AI agent execution logs",
  },
  { id: "email", label: "Email", description: "Email service logs" },
  {
    id: "scraping-tool",
    label: "Scraping Tool",
    description: "Web scraping logs",
  },
] as const;

type LogType = (typeof LOG_TABS)[number]["id"];

/**
 * App Logs Page
 * Displays real-time application logs with auto-refresh
 * Fetches latest 500 lines every 2 seconds
 */
export default function AppLogs() {
  const [activeTab, setActiveTab] = useState<LogType>("agent-run");
  const [logs, setLogs] = useState<string[]>([]);
  const [totalLines, setTotalLines] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch logs for the active tab
  const fetchLogs = async () => {
    try {
      const response = await fetch(
        `/api/admin/app-logs?type=${activeTab}&lines=500`
      );
      const data: LogsResponse = await response.json();

      if (data.success) {
        setLogs(data.data.logs);
        setTotalLines(data.data.total_lines);
        setError(null);
      } else {
        setError(data.message || "Failed to fetch logs");
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setError("Failed to load logs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Clear logs for the active tab
  const handleClearLogs = async () => {
    const tabLabel =
      LOG_TABS.find((t) => t.id === activeTab)?.label || activeTab;
    if (
      !window.confirm(`Are you sure you want to clear all ${tabLabel} logs?`)
    ) {
      return;
    }

    setClearing(true);
    try {
      const response = await fetch(`/api/admin/app-logs?type=${activeTab}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        setLogs([]);
        setTotalLines(0);
        setError(null);
      } else {
        setError(data.message || "Failed to clear logs");
      }
    } catch (err) {
      console.error("Failed to clear logs:", err);
      setError("Failed to clear logs. Please try again.");
    } finally {
      setClearing(false);
    }
  };

  // Auto-scroll to bottom when new logs arrive
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch logs when tab changes
  useEffect(() => {
    setLoading(true);
    setLogs([]);
    fetchLogs();
  }, [activeTab]);

  // Auto-refresh every 2 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs();
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh, activeTab]);

  // Auto-scroll when logs update
  useEffect(() => {
    if (logs.length > 0) {
      scrollToBottom();
    }
  }, [logs]);

  const activeTabInfo = LOG_TABS.find((t) => t.id === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {LOG_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{activeTabInfo?.description}</span>
            {" • "}
            Showing latest 500 lines • Total: {totalLines} lines
            {autoRefresh && " • Auto-refreshing every 2s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              autoRefresh
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-gray-50 text-gray-700 border border-gray-200"
            }`}
          >
            <RefreshCw
              className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`}
            />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </button>

          {/* Manual refresh */}
          <button
            onClick={fetchLogs}
            disabled={autoRefresh}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Refresh Now
          </button>

          {/* Clear logs */}
          <button
            onClick={handleClearLogs}
            disabled={clearing || logs.length === 0}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            {clearing ? "Clearing..." : "Clear Logs"}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Logs container */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div
          ref={logsContainerRef}
          className="bg-gray-900 text-gray-100 font-mono text-xs p-4 overflow-auto"
          style={{ height: "600px" }}
        >
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              No logs available for {activeTabInfo?.label}
            </div>
          ) : (
            <div className="space-y-0.5">
              {logs.map((line, index) => (
                <div
                  key={index}
                  className="hover:bg-gray-800 px-2 py-0.5 rounded"
                >
                  <span className="text-gray-500 select-none mr-2">
                    {index + 1}
                  </span>
                  <span
                    className={
                      line.includes("ERROR") || line.includes("Failed")
                        ? "text-red-400"
                        : line.includes("SUCCESS") || line.includes("✓")
                        ? "text-green-400"
                        : line.includes("WARNING")
                        ? "text-yellow-400"
                        : "text-gray-200"
                    }
                  >
                    {line}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="text-sm text-gray-600">
        <p>
          <strong className="text-gray-900">Note:</strong> Logs are
          automatically fetched every 2 seconds when auto-refresh is enabled.
          You can toggle auto-refresh or manually refresh as needed.
        </p>
      </div>
    </div>
  );
}
