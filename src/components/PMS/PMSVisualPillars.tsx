import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Pencil,
} from "lucide-react";

import {
  fetchPmsKeyData,
  updatePmsJobClientApproval,
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [keyData, setKeyData] =
    useState<PmsKeyDataResponse["data"] | null>(null);
  const [localProcessing, setLocalProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

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
      window.removeEventListener(
        "pms:job-uploaded",
        handler as EventListener
      );
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

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
            PMS Visual Pillars
          </span>
          <h2 className="text-2xl font-bold text-gray-900">
            Referral Performance Overview
          </h2>
          <p className="text-sm text-gray-600">
            Domain: {keyData?.domain || domain}
          </p>
        </div>
        <div className="text-right text-xs text-gray-500 space-y-1">
          {monthCount > 0 && <div>{periodLabel}</div>}
          {latestTimestamp && (
            <div>Last updated {latestTimestamp.toLocaleString()}</div>
          )}
        </div>
      </div>

      {showProcessingNotice && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-medium">
                Your latest PMS data is now being processed.
              </p>
            </div>
          </div>
        </div>
      )}

      {showClientApprovalBanner && (
        <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 space-y-1 text-sm text-blue-700">
            <div className="font-semibold text-blue-800">
              Your PMS data is processed.
            </div>
            <div>
              Review the latest results and confirm once everything looks good.
            </div>
            {latestJobStatus && (
              <div className="text-xs text-blue-600">
                Latest job status: {latestJobStatus}
              </div>
            )}
            {bannerError && (
              <div className="flex items-center gap-2 text-xs text-red-600">
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
              className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold uppercase text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
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
              className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-600 px-4 py-2 text-xs font-semibold uppercase text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Pencil className="h-4 w-4" />
              Make changes
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-dashed border-emerald-200 bg-white p-10 text-sm text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Loading PMS metrics...
        </div>
      )}

      {!isLoading && error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600"
        >
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Unable to retrieve PMS data.</p>
            <p className="text-xs text-red-500">{error}</p>
          </div>
        </motion.div>
      )}

      {!isLoading && !error && keyData && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MonthlyReferralsChart data={monthlyData} periodLabel={periodLabel} />
          <TopReferralSources
            data={topSources}
            subtitle="Aggregated PMS production"
          />
        </div>
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
