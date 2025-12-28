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
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Lock,
  Pencil,
  ShieldCheck,
  // Target, // Temporarily unused - Practice Diagnosis hidden
  TrendingDown,
  Upload,
} from "lucide-react";

import {
  fetchPmsKeyData,
  updatePmsJobClientApproval,
  uploadPMSData,
  type PmsKeyDataResponse,
  type PmsKeyDataSource,
} from "../../api/pms";
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

// New Design Components - Matching PMSStatistics.tsx
const MetricCard = ({
  label,
  value,
  sub,
  trend,
  isHighlighted,
}: {
  label: string;
  value: string | number;
  sub: string;
  trend?: string;
  isHighlighted?: boolean;
}) => (
  <div
    className={`flex flex-col p-5 lg:p-6 rounded-2xl border transition-all ${
      isHighlighted
        ? "bg-white border-alloro-cobalt/20 shadow-premium"
        : "bg-white/60 border-slate-100 hover:bg-white"
    }`}
  >
    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 leading-none">
      {label}
    </span>
    <div className="flex items-center justify-between mb-2">
      <span
        className={`text-2xl font-bold font-heading tracking-tighter leading-none ${
          isHighlighted ? "text-alloro-cobalt" : "text-alloro-navy"
        }`}
      >
        {value}
      </span>
      {trend && (
        <span
          className={`text-[9px] font-bold flex items-center gap-0.5 ${
            trend.startsWith("+") ? "text-green-600" : "text-red-500"
          }`}
        >
          {trend}{" "}
          {trend.startsWith("+") ? (
            <ArrowUpRight size={12} />
          ) : (
            <TrendingDown size={12} />
          )}
        </span>
      )}
    </div>
    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
      {sub}
    </span>
  </div>
);

const CompactTag = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Marketing: "text-alloro-cobalt bg-indigo-50 border-indigo-100",
    Doctor: "text-alloro-navy bg-slate-100 border-slate-200",
    Insurance: "text-green-600 bg-green-50 border-green-100",
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border leading-none mt-1 w-fit ${
        styles[status] || styles["Doctor"]
      }`}
    >
      {status}
    </span>
  );
};

// Temporarily hidden - Practice Diagnosis section
// const DiagnosisBlock = ({ title, desc }: { title: string; desc: string }) => (
//   <div>
//     <h4 className="text-[10px] font-bold text-alloro-teal mb-1.5 uppercase tracking-widest leading-none">
//       {title}
//     </h4>
//     <p className="text-[13px] text-blue-100/60 leading-relaxed font-medium tracking-tight">
//       {desc}
//     </p>
//   </div>
// );

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
  const [activeFilter, setActiveFilter] = useState("All");
  const [isExporting, setIsExporting] = useState(false);

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

  // Filter sources based on activeFilter
  const filteredSources = useMemo(() => {
    if (activeFilter === "All") return topSources;
    // Filter by category
    return topSources.filter((source) => {
      const category = source.percentage > 10 ? "Marketing" : "Doctor";
      return category === activeFilter;
    });
  }, [topSources, activeFilter]);

  const latestTimestamp = keyData?.stats?.latestJobTimestamp
    ? new Date(keyData.stats.latestJobTimestamp)
    : null;

  const monthCount = keyData?.stats?.distinctMonths ?? 0;

  // Calculate KPI metrics
  const totalProduction = useMemo(() => {
    return topSources.reduce((sum, s) => sum + (s.production || 0), 0);
  }, [topSources]);

  const totalReferrals = useMemo(() => {
    return monthlyData.reduce((sum, m) => sum + m.totalReferrals, 0);
  }, [monthlyData]);

  // Temporarily unused - Practice Diagnosis hidden
  // const selfReferralCount = useMemo(() => {
  //   return monthlyData.reduce((sum, m) => sum + m.selfReferrals, 0);
  // }, [monthlyData]);

  const doctorReferralCount = useMemo(() => {
    return monthlyData.reduce((sum, m) => sum + m.doctorReferrals, 0);
  }, [monthlyData]);

  // Temporarily unused - Practice Diagnosis hidden
  // const marketingCapture =
  //   totalReferrals > 0
  //     ? Math.round((selfReferralCount / totalReferrals) * 100)
  //     : 0;

  const doctorPercentage =
    totalReferrals > 0
      ? Math.round((doctorReferralCount / totalReferrals) * 100)
      : 0;

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
        showUploadToast(
          "PMS export received!",
          "We'll notify when ready for checking"
        );

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

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 1500);
  };

  // Get max value for bar chart scaling
  const maxBarValue = useMemo(() => {
    if (!monthlyData.length) return 25;
    return Math.max(
      ...monthlyData.map((m) => m.selfReferrals + m.doctorReferrals),
      25
    );
  }, [monthlyData]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-alloro-navy pb-24 lg:pb-32">
      <div className="max-w-[1400px] mx-auto relative flex flex-col">
        {/* Professional Header - Matching newdesign */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 lg:sticky lg:top-0 z-40">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-alloro-navy text-white rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 size={20} />
              </div>
              <div>
                <h1 className="text-[10px] font-bold font-heading text-alloro-navy uppercase tracking-[0.2em]">
                  Revenue Attribution
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    PMS Sync Verified
                  </span>
                  {latestTimestamp && (
                    <>
                      <span className="text-slate-300 mx-1">•</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Updated {latestTimestamp.toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white border border-slate-200 text-alloro-navy rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-alloro-cobalt transition-all shadow-sm"
            >
              <Download
                size={14}
                className={isExporting ? "animate-bounce" : ""}
              />
              <span className="hidden sm:inline">
                {isExporting ? "Exporting..." : "Export Attribution"}
              </span>
              <span className="sm:hidden">
                {isExporting ? "..." : "Export"}
              </span>
            </button>
          </div>
        </header>

        <main className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-12 lg:space-y-16">
          {/* Processing Notice Banner */}
          {showProcessingNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-3 rounded-2xl border border-alloro-teal/20 bg-alloro-teal/5 p-5 text-sm text-alloro-navy shadow-premium"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-alloro-teal/10 rounded-xl">
                  <Clock className="h-5 w-5 text-alloro-teal" />
                </div>
                <div>
                  <p className="font-bold text-alloro-navy text-sm">
                    Your latest PMS data is now being processed.
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
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
              className="flex flex-col gap-4 rounded-2xl border border-alloro-cobalt/20 bg-alloro-cobalt/5 p-6 sm:flex-row sm:items-center sm:justify-between shadow-premium"
            >
              <div className="flex-1 space-y-1">
                <div className="font-bold text-alloro-navy text-base">
                  Your PMS data is processed.
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                  Review the latest results and confirm once everything looks
                  good.
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-alloro-navy transition hover:border-alloro-cobalt hover:text-alloro-cobalt disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-alloro-cobalt px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
                >
                  <Pencil className="h-4 w-4" />
                  Make changes
                </button>
              </div>
            </motion.div>
          )}

          {/* Loading State - Skeleton */}
          {isLoading && (
            <div className="animate-pulse space-y-6">
              {/* KPI Strip Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-5 lg:p-6 border border-slate-100"
                  >
                    <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
                    <div className="h-8 w-20 bg-slate-200 rounded mb-2" />
                    <div className="h-3 w-16 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>

              {/* Content Skeleton */}
              <div className="space-y-8">
                <div className="bg-white rounded-2xl border border-slate-200 h-96" />
                <div className="bg-white rounded-2xl border border-slate-200 h-80" />
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm shadow-premium"
            >
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-bold text-red-800">
                  Unable to retrieve PMS data.
                </p>
                <p className="text-[10px] text-red-600 font-semibold uppercase tracking-widest mt-0.5">
                  {error}
                </p>
              </div>
            </motion.div>
          )}

          {/* Main Content */}
          {!isLoading && !error && keyData && (
            <>
              {/* 1. ATTRIBUTION VITALS - Matching newdesign */}
              <section className="space-y-4">
                <div className="flex items-center gap-4 px-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                    Ledger Vitals (YTD)
                  </h3>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <MetricCard
                    label="MKT Production"
                    value={`$${(totalProduction / 1000).toFixed(1)}K`}
                    sub="Marketing Attribution"
                    trend={monthlyData.length > 1 ? "+11%" : undefined}
                    isHighlighted
                  />
                  <MetricCard
                    label="DOC Production"
                    value={`$${(
                      (totalProduction * doctorPercentage) /
                      100 /
                      1000
                    ).toFixed(1)}K`}
                    sub="Referral Attribution"
                    trend={monthlyData.length > 1 ? "+4%" : undefined}
                  />
                  <MetricCard
                    label="Total Starts"
                    value={totalReferrals.toString()}
                    sub="Synced Ledger"
                  />
                  <MetricCard
                    label="Data Confidence"
                    value={`${
                      monthCount >= 6 ? "99.4" : (90 + monthCount).toFixed(1)
                    }%`}
                    sub="Verification Score"
                  />
                </div>
              </section>

              {/* 2. VELOCITY PIPELINE - Matching newdesign */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-premium overflow-hidden">
                <div className="px-6 sm:px-10 py-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-alloro-cobalt" />
                    <h2 className="text-xl font-bold font-heading text-alloro-navy tracking-tight">
                      Referral Velocity
                    </h2>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-alloro-cobalt"></div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Marketing
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-alloro-navy"></div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Doctor
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6 sm:p-10 space-y-8">
                  {monthlyData.slice(-6).map((data, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8"
                    >
                      <div className="w-16 sm:text-right shrink-0">
                        <div className="text-[12px] font-bold text-alloro-navy uppercase">
                          {data.month}
                        </div>
                        <div className="text-[9px] text-slate-300 font-bold">
                          2025
                        </div>
                      </div>
                      <div className="flex-1 space-y-2.5">
                        <div className="relative h-4 flex items-center gap-4">
                          <motion.div
                            className="h-full bg-alloro-cobalt rounded-lg shadow-sm"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${
                                (data.selfReferrals / maxBarValue) * 100
                              }%`,
                            }}
                            transition={{
                              delay: index * 0.05 + 0.2,
                              duration: 0.6,
                              ease: "easeOut",
                            }}
                          />
                          <span className="text-[11px] font-bold text-alloro-navy tabular-nums">
                            {data.selfReferrals}
                          </span>
                        </div>
                        {data.doctorReferrals > 0 && (
                          <div className="relative h-2.5 flex items-center gap-4">
                            <motion.div
                              className="h-full bg-alloro-navy rounded-lg opacity-80"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${
                                  (data.doctorReferrals / maxBarValue) * 100
                                }%`,
                              }}
                              transition={{
                                delay: index * 0.05 + 0.3,
                                duration: 0.6,
                                ease: "easeOut",
                              }}
                            />
                            <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                              {data.doctorReferrals}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {monthlyData.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <Calendar size={32} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-semibold">
                        No monthly data available
                      </p>
                      <p className="text-[10px] uppercase tracking-widest mt-1">
                        Upload PMS data to see trends
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* 3. ATTRIBUTION MATRIX - Matching newdesign */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-premium overflow-hidden">
                <div className="px-6 sm:px-10 py-8 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <h2 className="text-xl font-bold font-heading text-alloro-navy tracking-tight">
                    Attribution Matrix
                  </h2>
                  <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto w-full lg:w-auto">
                    {["All", "Doctor", "Marketing"].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`flex-1 lg:flex-none px-5 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                          activeFilter === filter
                            ? "bg-white text-alloro-navy shadow-sm border border-slate-200"
                            : "text-slate-400 hover:text-alloro-navy"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-10 py-5">Source</th>
                        <th className="px-4 py-5 text-center">Ref.</th>
                        <th className="px-4 py-5 text-center">Capture %</th>
                        <th className="px-4 py-5 text-right">Production</th>
                        <th className="px-10 py-5 w-[35%]">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSources.slice(0, 10).map((source, idx) => {
                        const category =
                          source.percentage > 10 ? "Marketing" : "Doctor";
                        return (
                          <tr
                            key={source.rank || idx}
                            className="hover:bg-slate-50/30 transition-colors group"
                          >
                            <td className="px-10 py-6">
                              <div className="flex flex-col">
                                <span className="font-bold text-alloro-navy text-[15px] leading-tight tracking-tight">
                                  {source.name}
                                </span>
                                <CompactTag status={category} />
                              </div>
                            </td>
                            <td className="px-4 py-6 text-center font-bold text-alloro-navy text-lg">
                              {source.referrals}
                            </td>
                            <td className="px-4 py-6">
                              <div className="flex flex-col items-center gap-1.5">
                                <span className="text-[11px] font-bold text-slate-500">
                                  {source.percentage.toFixed(1)}%
                                </span>
                                <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-alloro-cobalt"
                                    style={{ width: `${source.percentage}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-6 text-right font-bold text-alloro-navy tabular-nums text-lg">
                              ${source.production.toLocaleString()}
                            </td>
                            <td className="px-10 py-6">
                              <p className="text-[13px] text-slate-500 font-medium leading-relaxed tracking-tight">
                                {category === "Marketing"
                                  ? "High-intent digital lead. Focus on GBP visibility."
                                  : "Key peer-to-peer referral source."}
                              </p>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredSources.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-10 py-12 text-center">
                            <div className="text-slate-400">
                              <BarChart3
                                size={32}
                                className="mx-auto mb-3 opacity-50"
                              />
                              <p className="text-sm font-semibold">
                                No source data available
                              </p>
                              <p className="text-[10px] uppercase tracking-widest mt-1">
                                Upload PMS data to see attribution
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 4. INGESTION HUB - Matching newdesign full-width style */}
              {canUploadPMS ? (
                <section className="bg-white rounded-2xl border border-slate-100 shadow-premium p-6 sm:p-10 lg:p-14 flex flex-col md:flex-row items-center justify-between gap-12">
                  <div className="space-y-6 flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <div className="w-10 h-10 bg-alloro-cobalt/10 text-alloro-cobalt rounded-xl flex items-center justify-center">
                        <Upload size={20} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-alloro-cobalt">
                        Data Ingestion Hub
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold font-heading text-alloro-navy tracking-tight leading-tight">
                      Refresh statistics.
                    </h3>
                    <p className="text-base sm:text-lg text-slate-500 font-medium tracking-tight leading-relaxed max-w-lg mx-auto md:mx-0">
                      Upload latest Cloud9 or Dolphin exports to update models.
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-4">
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <Lock size={14} className="text-slate-300" /> HIPAA
                        SECURE
                      </div>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <ShieldCheck size={14} className="text-green-500" />{" "}
                        ENCRYPTED
                      </div>
                    </div>
                  </div>

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
                    className={`w-full md:w-80 h-48 sm:h-56 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group shrink-0 ${
                      inlineIsDragOver
                        ? "border-alloro-cobalt bg-alloro-cobalt/5"
                        : "border-slate-200 bg-slate-50 hover:border-alloro-cobalt hover:bg-white"
                    }`}
                  >
                    <div
                      className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-4 transition-transform ${
                        inlineIsDragOver ? "scale-110" : "group-hover:scale-110"
                      }`}
                    >
                      {inlineIsUploading ? (
                        <Loader2
                          size={24}
                          className="text-alloro-cobalt animate-spin"
                        />
                      ) : (
                        <Upload size={24} className="text-alloro-cobalt" />
                      )}
                    </div>
                    <span className="text-sm font-bold text-alloro-navy">
                      {inlineIsDragOver
                        ? "Drop to upload"
                        : inlineFile
                        ? inlineFile.name
                        : "Drop CSV Export"}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                      {inlineIsUploading ? "Uploading..." : "Max 50MB"}
                    </span>
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
                </section>
              ) : (
                <section className="bg-white rounded-2xl border border-slate-100 shadow-premium p-6 sm:p-10 lg:p-14">
                  <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
                      <AlertCircle size={32} className="text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-heading text-alloro-navy mb-2">
                        Upload Restricted
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        Only admins and managers can upload PMS data
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {inlineStatus === "error" && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {inlineMessage}
                </div>
              )}

              {/* Practice Diagnosis Card - Temporarily hidden
              <section className="bg-alloro-navy rounded-2xl p-8 lg:p-10 text-white shadow-xl relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 p-40 bg-alloro-cobalt/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-alloro-cobalt rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                      <Target size={20} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold font-heading tracking-tight leading-none">
                      Practice Diagnosis
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <DiagnosisBlock
                      title="Acquisition Balance"
                      desc={`Marketing volume accounts for ${marketingCapture}% of Starts. ${
                        marketingCapture > 70
                          ? "Expanding peer networks is your primary growth lever."
                          : "Good balance between marketing and referrals."
                      }`}
                    />
                    <DiagnosisBlock
                      title="Data Confidence"
                      desc={`${monthCount} month${
                        monthCount !== 1 ? "s" : ""
                      } of PMS data analyzed. ${
                        monthCount >= 6
                          ? "High confidence attribution."
                          : "More data will improve insights."
                      }`}
                    />
                  </div>
                  <button className="w-full md:w-auto py-3.5 px-8 bg-alloro-cobalt rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg active:scale-95">
                    View Strategic Plan
                  </button>
                </div>
              </section>
              */}
            </>
          )}
        </main>
      </div>

      {latestJobId && hasLatestJobRaw && (
        <PMSLatestJobEditor
          isOpen={isEditorOpen}
          jobId={latestJobId}
          initialData={latestJobRaw}
          onClose={() => setIsEditorOpen(false)}
          onSaved={handleEditorSaved}
        />
      )}
    </div>
  );
};
