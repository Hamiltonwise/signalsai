import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { showSparkleToast, showUploadToast } from "../../lib/toast";
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Pencil,
  Upload,
} from "lucide-react";

import {
  fetchPmsKeyData,
  updatePmsJobClientApproval,
  uploadPMSData,
  type PmsKeyDataResponse,
  type PmsKeyDataSource,
} from "../../api/pms";
import { MonthlyReferralsChart } from "./MonthlyReferralsChart";
import { TopReferralSources } from "./TopReferralSources";
import { PMSLatestJobEditor } from "./PMSLatestJobEditor";

interface PMSVisualPillarsProps {
  domain?: string;
}

const DEFAULT_DOMAIN = "artfulorthodontics.com";

const formatMonthLabel = (value: string): string => {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
};

export const PMSVisualPillars: React.FC<PMSVisualPillarsProps> = ({
  domain = DEFAULT_DOMAIN,
}) => {
  const [inlineFile, setInlineFile] = useState<File | null>(null);
  const [inlineIsUploading, setInlineIsUploading] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<string>("");
  const [inlineStatus, setInlineStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const [inlineIsDragOver, setInlineIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [keyData, setKeyData] = useState<PmsKeyDataResponse["data"] | null>(
    null
  );
  const [localProcessing, setLocalProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Get user role for permission checks
  const userRole = localStorage.getItem("user_role");
  const canUploadPMS = userRole === "admin" || userRole === "manager";

  const storageKey = useMemo(
    () => `pmsProcessing:${domain || DEFAULT_DOMAIN}`,
    [domain]
  );

  const isMountedRef = useRef(false);

  const loadKeyData = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await fetchPmsKeyData(domain);

        if (!isMountedRef.current) {
          return;
        }

        if (response?.success && response.data) {
          setKeyData(response.data);
        } else {
          setKeyData(null);
          setError(
            response?.error ||
              response?.message ||
              "Unable to load PMS visual pillars."
          );
        }
      } catch (err) {
        if (!isMountedRef.current) {
          return;
        }

        setKeyData(null);
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load PMS visual pillars.";
        setError(message);
      } finally {
        if (isMountedRef.current && !silent) {
          setIsLoading(false);
        }
      }
    },
    [domain]
  );

  useEffect(() => {
    isMountedRef.current = true;
    loadKeyData();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadKeyData]);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLocalProcessing(false);
      return;
    }

    const flag = window.localStorage.getItem(storageKey);
    setLocalProcessing(Boolean(flag));
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail || !detail.clientId || detail.clientId === domain) {
        setLocalProcessing(true);
        loadKeyData({ silent: true });
      }
    };

    window.addEventListener("pms:job-uploaded", handler as EventListener);
    return () => {
      window.removeEventListener("pms:job-uploaded", handler as EventListener);
    };
  }, [domain, loadKeyData]);

  const latestJobStatus = keyData?.stats?.latestJobStatus ?? null;
  const latestJobIsApproved = keyData?.stats?.latestJobIsApproved ?? null;
  const latestJobIsClientApproved =
    keyData?.stats?.latestJobIsClientApproved ?? null;
  const latestJobId = keyData?.stats?.latestJobId ?? null;
  const latestJobRaw = keyData?.latestJobRaw ?? null;

  const hasLatestJobRaw = useMemo(() => {
    if (latestJobRaw == null) {
      return false;
    }

    if (Array.isArray(latestJobRaw)) {
      return latestJobRaw.length > 0;
    }

    if (typeof latestJobRaw === "object") {
      return Object.keys(latestJobRaw as Record<string, unknown>).length > 0;
    }

    return true;
  }, [latestJobRaw]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (latestJobIsApproved === true) {
      window.localStorage.removeItem(storageKey);
      setLocalProcessing(false);
    } else if (latestJobIsApproved === false) {
      setLocalProcessing(true);
    }
  }, [latestJobIsApproved, storageKey]);

  useEffect(() => {
    if (latestJobStatus?.toLowerCase() === "pending") {
      setLocalProcessing(true);
    }
  }, [latestJobStatus]);

  const monthlyData = useMemo(() => {
    if (!keyData?.months?.length) {
      return [];
    }

    return keyData.months.map((month) => {
      const selfReferrals = Number(month.selfReferrals ?? 0);
      const doctorReferrals = Number(month.doctorReferrals ?? 0);
      const totalReferrals = Number(month.totalReferrals ?? 0);
      const productionTotal = Number(month.productionTotal ?? 0);

      return {
        month: formatMonthLabel(month.month),
        selfReferrals,
        doctorReferrals,
        total: totalReferrals || selfReferrals + doctorReferrals,
        totalReferrals: totalReferrals || selfReferrals + doctorReferrals,
        productionTotal,
      };
    });
  }, [keyData]);

  const topSources: PmsKeyDataSource[] = useMemo(
    () => keyData?.sources ?? [],
    [keyData]
  );

  const latestTimestamp = keyData?.stats?.latestJobTimestamp
    ? new Date(keyData.stats.latestJobTimestamp)
    : null;

  const monthCount = keyData?.stats?.distinctMonths ?? 0;
  const periodLabel = monthCount
    ? `${monthCount} month${monthCount === 1 ? "" : "s"} of PMS data`
    : undefined;

  const showClientApprovalBanner =
    !isLoading &&
    latestJobIsApproved === true &&
    latestJobIsClientApproved !== true &&
    latestJobId !== null;

  const showProcessingNotice =
    !isLoading &&
    !showClientApprovalBanner &&
    (localProcessing || latestJobStatus?.toLowerCase() === "pending");

  const handleConfirmApproval = useCallback(async () => {
    if (!latestJobId) {
      return;
    }

    setIsConfirming(true);
    setBannerError(null);

    try {
      await updatePmsJobClientApproval(latestJobId, true);

      // Show glassmorphism toast notification for client approval
      showSparkleToast(
        "Perfect!",
        "We're now setting up your summary and action items for this month"
      );

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(storageKey);
      }
      await loadKeyData();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to confirm PMS data approval.";
      setBannerError(message);
    } finally {
      setIsConfirming(false);
    }
  }, [latestJobId, loadKeyData, storageKey]);

  const handleEditorSaved = useCallback(async () => {
    setIsEditorOpen(false);
    await loadKeyData();
  }, [loadKeyData]);

  const handleInlineFile = (file: File | null) => {
    setInlineFile(file);
    setInlineStatus("idle");
    setInlineMessage("");
    if (file) {
      // auto-upload immediately after selection/drop
      void doInlineUpload(file);
    }
  };

  const doInlineUpload = async (fileOverride?: File) => {
    const fileToUpload = fileOverride ?? inlineFile;
    if (!fileToUpload) return;
    setInlineIsUploading(true);
    setInlineStatus("idle");
    try {
      const json = await uploadPMSData({
        clientId: domain,
        file: fileToUpload,
      });
      if (json?.success) {
        // Show glassmorphism toast notification
        showUploadToast(
          "PMS export received!",
          "We'll notify when ready for checking"
        );

        // Clear input and let the processing banner handle UX
        setInlineStatus("idle");
        setInlineMessage("");
        setInlineFile(null);
        try {
          if (inlineInputRef.current) inlineInputRef.current.value = "";
        } catch {
          // Ignore errors clearing file input
        }
        try {
          window.localStorage.setItem(
            `pmsProcessing:${domain}`,
            String(Date.now())
          );
          window.dispatchEvent(
            new CustomEvent("pms:job-uploaded", {
              detail: { clientId: domain },
            })
          );
        } catch {
          // Ignore localStorage errors
        }
        await loadKeyData({ silent: true });
      } else {
        setInlineStatus("error");
        setInlineMessage(json?.error || "Upload failed");
      }
    } catch (e) {
      setInlineStatus("error");
      setInlineMessage(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setInlineIsUploading(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 1500);
  };

  return (
    <section className="space-y-8">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-alloro-cobalt/10 rounded-xl">
              <Brain className="w-6 h-6 text-alloro-cobalt" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-alloro-navy tracking-tight">
                Referral Intelligence
              </h1>
              <p className="text-slate-500 text-sm mt-0.5 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-alloro-cobalt"></span>
                Synced with PMS • Analysis active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-xs text-alloro-navy font-bold uppercase tracking-wider">
                Data Period
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {monthCount > 0 ? periodLabel : "No data yet"}
              </div>
              {latestTimestamp && (
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Updated {latestTimestamp.toLocaleDateString()}
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:text-alloro-cobalt hover:border-alloro-cobalt/30 transition-all shadow-sm hover:shadow active:scale-95"
            >
              <Download
                size={16}
                className={isExporting ? "animate-bounce" : ""}
              />
              {isExporting ? "Downloading..." : "Export Report"}
            </button>
          </div>
        </div>
      </header>

      {/* Processing Notice Banner */}
      {showProcessingNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 rounded-2xl border border-alloro-teal/20 bg-alloro-teal/5 p-5 text-sm text-alloro-navy shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-alloro-teal/10 rounded-lg">
              <Clock className="h-5 w-5 text-alloro-teal" />
            </div>
            <div>
              <p className="font-bold text-alloro-navy">
                Your latest PMS data is now being processed.
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                We'll notify you when the analysis is complete.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Client Approval Banner */}
      {showClientApprovalBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 rounded-2xl border border-alloro-cobalt/20 bg-alloro-cobalt/5 p-6 sm:flex-row sm:items-center sm:justify-between shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <div className="flex-1 space-y-1">
            <div className="font-bold text-alloro-navy text-base">
              Your PMS data is processed.
            </div>
            <div className="text-sm text-slate-600">
              Review the latest results and confirm once everything looks good.
            </div>
            {bannerError && (
              <div className="flex items-center gap-2 text-xs text-red-600 mt-2">
                <AlertCircle className="h-4 w-4" />
                {bannerError}
              </div>
            )}
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleConfirmApproval}
              disabled={isConfirming || latestJobId == null}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-alloro-navy transition hover:border-alloro-cobalt hover:text-alloro-cobalt disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
            >
              {isConfirming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              disabled={latestJobId == null || !hasLatestJobRaw}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-alloro-cobalt px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
            >
              <Pencil className="h-4 w-4" />
              Make changes
            </button>
          </div>
        </motion.div>
      )}

      {/* Loading State - Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 animate-pulse">
          {/* Left Column: Monthly Timeline Skeleton (Span 5) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
              {/* Summary Card Skeleton */}
              <div className="bg-slate-200 p-6">
                <div className="h-4 w-28 bg-slate-300/50 rounded mb-3" />
                <div className="h-8 w-16 bg-slate-300/50 rounded mb-2" />
                <div className="h-3 w-32 bg-slate-300/50 rounded" />
              </div>
              {/* Chart Area Skeleton */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-slate-200 rounded-full" />
                      <div className="h-3 w-20 bg-slate-200 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-slate-200 rounded-full" />
                      <div className="h-3 w-24 bg-slate-200 rounded" />
                    </div>
                  </div>
                </div>
                <div className="h-48 bg-slate-100 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Right Column: Source Leaderboard Skeleton (Span 7) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
              {/* Header Skeleton */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="h-5 w-36 bg-slate-200 rounded mb-2" />
                    <div className="h-3 w-44 bg-slate-200 rounded" />
                  </div>
                  <div className="h-9 w-32 bg-slate-200 rounded-lg" />
                </div>
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-8 w-24 bg-slate-200 rounded-lg" />
                  ))}
                </div>
              </div>
              {/* Table Skeleton */}
              <div className="p-6">
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-5 bg-slate-200 rounded" />
                        <div className="h-4 w-40 bg-slate-200 rounded" />
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="h-4 w-12 bg-slate-200 rounded" />
                        <div className="h-4 w-20 bg-slate-200 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-bold text-red-800">
              Unable to retrieve PMS data.
            </p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Main Content Grid */}
      {!isLoading && !error && keyData && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Monthly Timeline (Span 5) */}
          <div className="lg:col-span-5">
            <MonthlyReferralsChart
              data={monthlyData}
              periodLabel={periodLabel}
            />
          </div>

          {/* Right Column: Source Leaderboard (Span 7) */}
          <div className="lg:col-span-7">
            <TopReferralSources
              data={topSources}
              subtitle="Aggregated PMS production"
            />
          </div>
        </div>
      )}

      {/* PMS Data Ingestion Section */}
      {canUploadPMS ? (
        <section className="mt-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col md:flex-row items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden">
            {/* Decorative background pattern */}
            <div className="absolute top-0 right-0 w-64 h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>

            <div className="max-w-md relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                  <CheckCircle2 size={18} />
                </div>
                <h2 className="text-lg font-bold text-alloro-navy font-heading">
                  PMS Data Ingestion
                </h2>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Drag and drop your practice management export file here. Our AI
                engine will normalize, clean, and categorize referrals
                automatically.
              </p>
              <div className="flex gap-4 mt-4 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1">
                  <FileText size={12} /> .CSV supported
                </span>
                <span className="flex items-center gap-1">
                  <FileText size={12} /> .XLSX supported
                </span>
              </div>
            </div>

            <div className="mt-6 md:mt-0 w-full md:w-auto flex-1 md:max-w-lg ml-0 md:ml-12 relative z-10">
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setInlineIsDragOver(true);
                }}
                onDragLeave={() => setInlineIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setInlineIsDragOver(false);
                  const f = e.dataTransfer?.files?.[0];
                  if (f) handleInlineFile(f);
                }}
                className={`
                  flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all group
                  ${
                    inlineIsDragOver
                      ? "border-alloro-cobalt bg-alloro-cobalt/5 scale-105"
                      : "border-alloro-cobalt/20 bg-slate-50/50 hover:bg-white hover:border-alloro-cobalt"
                  }
                `}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div
                    className={`
                    w-10 h-10 mb-3 rounded-full bg-white shadow-sm flex items-center justify-center text-alloro-cobalt transition-transform duration-300
                    ${inlineIsDragOver ? "scale-125" : "group-hover:scale-110"}
                  `}
                  >
                    <Upload size={20} />
                  </div>
                  <p className="mb-1 text-sm text-alloro-navy font-bold">
                    {inlineIsDragOver
                      ? "Drop file to upload"
                      : inlineFile
                      ? inlineFile.name
                      : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-slate-400">Max file size 25MB</p>
                  {inlineIsUploading && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-alloro-cobalt">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Uploading...
                    </div>
                  )}
                </div>
                <input
                  ref={inlineInputRef}
                  type="file"
                  accept=".csv,.txt,.xlsx,.xls"
                  onChange={(e) =>
                    handleInlineFile(e.target.files?.[0] || null)
                  }
                  className="hidden"
                />
              </label>
              {inlineStatus === "error" && (
                <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {inlineMessage}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <AlertCircle size={18} />
              </div>
              <h2 className="text-lg font-bold text-alloro-navy font-heading">
                PMS Data Upload
              </h2>
            </div>
            <div className="border-2 border-dashed rounded-xl p-6 bg-amber-50/40 border-amber-200">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-3 text-amber-600" />
                <div className="text-sm text-alloro-navy mb-1 font-bold">
                  Upload Restricted
                </div>
                <div className="text-xs text-slate-600">
                  Only admins and managers can upload PMS data. Please contact
                  your administrator if you need to upload data.
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {latestJobId && hasLatestJobRaw && (
        <PMSLatestJobEditor
          isOpen={isEditorOpen}
          jobId={latestJobId}
          initialData={latestJobRaw}
          onClose={() => setIsEditorOpen(false)}
          onSaved={handleEditorSaved}
        />
      )}
    </section>
  );
};
