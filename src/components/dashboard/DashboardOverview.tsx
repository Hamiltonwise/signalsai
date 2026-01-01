import { useState, useEffect, useCallback } from "react";
import {
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Zap,
  CheckCircle2,
  Activity,
  ChevronDown,
  ChevronLeft,
  MapPin,
  TrendingDown,
  DollarSign,
  X,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAgentData } from "../../hooks/useAgentData";
import { useAuth } from "../../hooks/useAuth";
import { format } from "date-fns";
import { fetchPmsKeyData, type PmsKeyDataResponse } from "../../api/pms";
import { fetchClientTasks } from "../../api/tasks";
import type { ActionItem } from "../../types/tasks";
import { parseHighlightTags } from "../../utils/textFormatting";
import {
  ReferralMatrices,
  type ReferralEngineData,
} from "../PMS/ReferralMatrices";

// Ranking data types
interface RankingResult {
  id: number;
  googleAccountId: number;
  domain: string;
  specialty: string;
  location: string;
  gbpAccountId: string | null;
  gbpLocationId: string | null;
  gbpLocationName: string | null;
  batchId: string | null;
  observedAt: string;
  status: string;
  rankScore: number;
  rankPosition: number;
  totalCompetitors: number;
  rankingFactors: Record<string, unknown> | null;
  rawData: Record<string, unknown> | null;
  llmAnalysis: Record<string, unknown> | null;
  statusDetail: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DashboardOverviewProps {
  googleAccountId?: number | null;
}

/* --- Helper Components - matches newdesign exactly --- */

const IntelligencePulse = () => (
  <span className="relative flex h-2.5 w-2.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alloro-orange opacity-30"></span>
    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-alloro-orange opacity-60"></span>
  </span>
);

const MetricCard = ({
  label,
  value,
  trend,
  isHighlighted,
}: {
  label: string;
  value: string | number;
  trend?: string;
  isHighlighted?: boolean;
}) => {
  const isUp = trend?.startsWith("+");
  const isDown = trend?.startsWith("-");

  return (
    <div
      className={`flex flex-col p-6 rounded-2xl border transition-all duration-500 ${
        isHighlighted
          ? "bg-white border-alloro-orange/20 shadow-premium"
          : "bg-white border-black/5 hover:border-alloro-orange/20 hover:shadow-premium"
      }`}
    >
      <span className="text-[10px] font-black text-alloro-textDark/40 uppercase tracking-[0.2em] mb-4 leading-none text-left">
        {label}
      </span>
      <div className="flex items-center justify-between">
        <span className="text-3xl font-black font-heading tracking-tighter leading-none text-alloro-textDark">
          {value}
        </span>
        {trend && (
          <span
            className={`text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm ${
              isUp
                ? "bg-green-100 text-green-700"
                : isDown
                ? "bg-red-100 text-red-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {trend}{" "}
            {isUp ? (
              <ArrowUpRight size={10} />
            ) : isDown ? (
              <TrendingDown size={10} />
            ) : null}
          </span>
        )}
      </div>
    </div>
  );
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "N/A";
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export function DashboardOverview({ googleAccountId }: DashboardOverviewProps) {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { data, error, refetch } = useAgentData(googleAccountId || null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDataHub, setShowDataHub] = useState(false);
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);

  // Modal state for Strategic Growth fixes
  const [selectedFix, setSelectedFix] = useState<{
    index: number;
    text: string;
  } | null>(null);

  // PMS data state
  const [pmsData, setPmsData] = useState<PmsKeyDataResponse["data"] | null>(
    null
  );
  const [, setPmsLoading] = useState(true);
  const [, setPmsError] = useState<string | null>(null);

  // Tasks data state
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [, setAllUserTasks] = useState<ActionItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [, setTasksError] = useState<string | null>(null);

  // Ranking data state
  const [rankingData, setRankingData] = useState<RankingResult[] | null>(null);
  const [, setRankingLoading] = useState(true);
  const [, setRankingError] = useState<string | null>(null);

  // Referral Engine data state
  const [referralData, setReferralData] = useState<ReferralEngineData | null>(
    null
  );
  const [referralLoading, setReferralLoading] = useState(true);
  const [referralPending, setReferralPending] = useState(false);

  // Fetch PMS data
  useEffect(() => {
    const loadPmsData = async () => {
      const domain = userProfile?.domainName;
      if (!domain) {
        setPmsLoading(false);
        return;
      }

      setPmsLoading(true);
      setPmsError(null);

      try {
        const response = await fetchPmsKeyData(domain);
        if (response?.success && response.data) {
          setPmsData(response.data);
        } else {
          setPmsError(
            response?.error || response?.message || "Failed to load PMS data"
          );
        }
      } catch (err) {
        setPmsError(
          err instanceof Error ? err.message : "Failed to load PMS data"
        );
      } finally {
        setPmsLoading(false);
      }
    };

    loadPmsData();
  }, [userProfile?.domainName]);

  // Fetch ranking data
  useEffect(() => {
    const loadRankingData = async () => {
      if (!googleAccountId) {
        setRankingLoading(false);
        return;
      }

      setRankingLoading(true);
      setRankingError(null);

      try {
        const response = await fetch(
          `/api/practice-ranking/latest?googleAccountId=${googleAccountId}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setRankingData(null);
            setRankingLoading(false);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success && result.rankings) {
          const rankings = Array.isArray(result.rankings)
            ? result.rankings
            : [result.rankings];
          setRankingData(rankings);
        } else {
          setRankingData(null);
        }
      } catch (err) {
        setRankingError(
          err instanceof Error ? err.message : "Failed to load ranking data"
        );
      } finally {
        setRankingLoading(false);
      }
    };

    loadRankingData();
  }, [googleAccountId]);

  // Fetch tasks data
  useEffect(() => {
    const loadTasks = async () => {
      if (!googleAccountId) {
        setTasksLoading(false);
        return;
      }

      setTasksLoading(true);
      setTasksError(null);

      try {
        const response = await fetchClientTasks(googleAccountId);
        if (response?.success && response.tasks) {
          const allTasks = [...response.tasks.ALLORO, ...response.tasks.USER];
          const opportunityTasks = allTasks.filter(
            (task) => task.agent_type === "OPPORTUNITY"
          );
          setTasks(opportunityTasks);
          setAllUserTasks(response.tasks.USER);
        } else {
          setTasksError("Failed to load tasks");
        }
      } catch (err) {
        setTasksError(
          err instanceof Error ? err.message : "Failed to load tasks"
        );
      } finally {
        setTasksLoading(false);
      }
    };

    loadTasks();
  }, [googleAccountId]);

  // Fetch Referral Engine data
  useEffect(() => {
    const loadReferralData = async () => {
      if (!googleAccountId) {
        setReferralLoading(false);
        return;
      }

      setReferralLoading(true);

      try {
        const response = await fetch(
          `/api/agents/getLatestReferralEngineOutput/${googleAccountId}`
        );

        if (!response.ok) {
          setReferralData(null);
          setReferralPending(false);
          return;
        }

        const result = await response.json();

        // Check if referral engine output is pending (monthly agents still running)
        if (result.success && result.pending === true) {
          setReferralPending(true);
          setReferralData(null);
          return;
        }

        // Got actual data
        setReferralPending(false);
        if (result.success && result.data) {
          const dataToSet = Array.isArray(result.data)
            ? result.data[0]
            : result.data;
          setReferralData(dataToSet);
        }
      } catch (err) {
        console.error("Failed to fetch referral engine data:", err);
        setReferralPending(false);
      } finally {
        setReferralLoading(false);
      }
    };

    loadReferralData();
  }, [googleAccountId]);

  // Calculate PMS metrics from latest month
  const calculatePmsMetrics = () => {
    if (!pmsData?.months || pmsData.months.length === 0) {
      return null;
    }

    const latestMonth = pmsData.months[pmsData.months.length - 1];
    const previousMonth =
      pmsData.months.length > 1
        ? pmsData.months[pmsData.months.length - 2]
        : null;

    const calculatePercentChange = (
      current: number,
      previous: number | undefined
    ) => {
      if (!previous || previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    const totalReferrals = latestMonth.totalReferrals || 0;
    const selfReferrals = latestMonth.selfReferrals || 0;
    const doctorReferrals = latestMonth.doctorReferrals || 0;
    const production = latestMonth.productionTotal || 0;

    return {
      totalReferrals,
      selfReferrals,
      doctorReferrals,
      production,
      month: latestMonth.month,
      referralChange: calculatePercentChange(
        totalReferrals,
        previousMonth?.totalReferrals
      ),
      selfReferralChange: calculatePercentChange(
        selfReferrals,
        previousMonth?.selfReferrals
      ),
      doctorReferralChange: calculatePercentChange(
        doctorReferrals,
        previousMonth?.doctorReferrals
      ),
      productionChange: calculatePercentChange(
        production,
        previousMonth?.productionTotal
      ),
    };
  };

  const pmsMetrics = calculatePmsMetrics();

  // Function to reload PMS data
  const reloadPmsData = useCallback(async () => {
    const domain = userProfile?.domainName;
    if (!domain) return;

    setPmsLoading(true);
    try {
      const response = await fetchPmsKeyData(domain);
      if (response?.success && response.data) {
        setPmsData(response.data);
      }
    } catch (err) {
      console.error("Failed to reload PMS data:", err);
    } finally {
      setPmsLoading(false);
    }
  }, [userProfile?.domainName]);

  // Function to reload ranking data
  const reloadRankingData = useCallback(async () => {
    if (!googleAccountId) return;

    setRankingLoading(true);
    try {
      const response = await fetch(
        `/api/practice-ranking/latest?googleAccountId=${googleAccountId}`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.rankings) {
          const rankings = Array.isArray(result.rankings)
            ? result.rankings
            : [result.rankings];
          setRankingData(rankings);
        }
      }
    } catch (err) {
      console.error("Failed to reload ranking data:", err);
    } finally {
      setRankingLoading(false);
    }
  }, [googleAccountId]);

  // Function to reload tasks
  const reloadTasks = useCallback(async () => {
    if (!googleAccountId) return;

    setTasksLoading(true);
    try {
      const response = await fetchClientTasks(googleAccountId);
      if (response?.success && response.tasks) {
        const allTasks = [...response.tasks.ALLORO, ...response.tasks.USER];
        const opportunityTasks = allTasks.filter(
          (task) => task.agent_type === "OPPORTUNITY"
        );
        setTasks(opportunityTasks);
        setAllUserTasks(response.tasks.USER);
      }
    } catch (err) {
      console.error("Failed to reload tasks:", err);
    } finally {
      setTasksLoading(false);
    }
  }, [googleAccountId]);

  // Function to reload referral data
  const reloadReferralData = useCallback(async () => {
    if (!googleAccountId) return;

    setReferralLoading(true);
    try {
      const response = await fetch(
        `/api/agents/getLatestReferralEngineOutput/${googleAccountId}`
      );
      if (response.ok) {
        const result = await response.json();

        // Check if referral engine output is pending
        if (result.success && result.pending === true) {
          setReferralPending(true);
          setReferralData(null);
          return;
        }

        setReferralPending(false);
        if (result.success && result.data) {
          const dataToSet = Array.isArray(result.data)
            ? result.data[0]
            : result.data;
          setReferralData(dataToSet);
        }
      }
    } catch (err) {
      console.error("Failed to reload referral data:", err);
      setReferralPending(false);
    } finally {
      setReferralLoading(false);
    }
  }, [googleAccountId]);

  // Handle refresh - now refreshes ALL data sources
  const handleRefresh = async () => {
    setIsRefreshing(true);

    // Refresh all data sources in parallel
    await Promise.all([
      refetch(),
      reloadPmsData(),
      reloadRankingData(),
      reloadTasks(),
      reloadReferralData(),
    ]);

    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Extract agent data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summaryData = data?.agents?.summary?.results?.[0] as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prooflineData = (data?.agents as any)?.proofline;
  const trajectory = prooflineData?.trajectory;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Get critical actions count
  const criticalActionsCount = tasks.filter((t) => {
    try {
      const metadata =
        typeof t.metadata === "string" ? JSON.parse(t.metadata) : t.metadata;
      return metadata?.urgency === "Immediate" || metadata?.urgency === "High";
    } catch {
      return false;
    }
  }).length;

  // Data availability flags
  const wins = summaryData?.wins;
  const risks = summaryData?.risks;
  const topFixes = referralData?.growth_opportunity_summary?.top_three_fixes;
  const estimatedRevenue =
    referralData?.growth_opportunity_summary
      ?.estimated_additional_annual_revenue;
  const alloroOpportunities = referralData?.alloro_automation_opportunities;
  const practiceActionPlan = referralData?.practice_action_plan;

  // Calculate sentiment based on score
  const getSentimentFromScore = (score: number | null | undefined) => {
    if (score === null || score === undefined)
      return { label: "N/A", color: "slate", pulse: false };
    if (score < 50) return { label: "Low", color: "red", pulse: false };
    if (score <= 75) return { label: "Okay", color: "yellow", pulse: true };
    return { label: "High", color: "green", pulse: true };
  };

  // Get sentiment for current location
  const currentLocationRanking = rankingData?.[currentLocationIndex];
  const sentiment = getSentimentFromScore(currentLocationRanking?.rankScore);

  // Carousel navigation for multiple locations
  const totalLocations = rankingData?.length || 0;

  const nextLocation = useCallback(() => {
    if (totalLocations > 1) {
      setCurrentLocationIndex((prev) => (prev + 1) % totalLocations);
    }
  }, [totalLocations]);

  const prevLocation = useCallback(() => {
    if (totalLocations > 1) {
      setCurrentLocationIndex(
        (prev) => (prev - 1 + totalLocations) % totalLocations
      );
    }
  }, [totalLocations]);

  // Auto-advance carousel every 8 seconds
  useEffect(() => {
    if (totalLocations > 1) {
      const interval = setInterval(nextLocation, 8000);
      return () => clearInterval(interval);
    }
  }, [totalLocations, nextLocation]);

  // Get current location data for carousel
  const getCurrentLocationData = () => {
    if (!rankingData || rankingData.length === 0) return null;
    const location = rankingData[currentLocationIndex];
    return {
      score: Math.round(location.rankScore || 0),
      rank: location.rankPosition || 0,
      totalCompetitors: location.totalCompetitors || 0,
      locationName: location.gbpLocationName || location.domain || "Unknown",
      location: location.location || "",
    };
  };

  const currentLocationData = getCurrentLocationData();

  // Loading skeleton component for sections waiting for data
  const LoadingSkeleton = ({ className = "" }: { className?: string }) => (
    <div className={`skeleton-shimmer rounded-xl ${className}`}></div>
  );

  // Determine if any data is missing for the alert
  const hasMissingData =
    !pmsMetrics ||
    !rankingData ||
    !tasks ||
    !referralData ||
    !wins ||
    !risks ||
    !topFixes ||
    !estimatedRevenue ||
    !alloroOpportunities ||
    !practiceActionPlan;

  // Error state
  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-8 text-center shadow-premium">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-extrabold text-alloro-navy font-heading mb-2">
          Failed to Load Data
        </h3>
        <p className="text-slate-600 mb-6">{error}</p>
        <button
          onClick={refetch}
          className="px-6 py-2.5 bg-alloro-orange text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto font-semibold text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-alloro-textDark selection:bg-alloro-orange/10">
      {/* Alert Bar */}
      {hasMissingData && (
        <div className="bg-alloro-orange text-white text-[10px] font-black uppercase tracking-widest py-3 px-4 text-center border-b border-white/10 flex items-center justify-center gap-2 shadow-sm relative z-[60]">
          <AlertTriangle size={14} className="text-white" />
          <span>
            Our agents are currently completing your account setup. You may see
            missing data while we sync your sources.
          </span>
        </div>
      )}

      {/* Professional Header - Responsive with Glass effect - matches newdesign */}
      <header
        className={`glass-header border-b border-black/5 lg:sticky ${
          hasMissingData ? "lg:top-[37px]" : "lg:top-0"
        } z-40`}
      >
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <IntelligencePulse />
            <div className="flex flex-col text-left">
              <h1 className="text-[11px] font-black font-heading text-alloro-textDark uppercase tracking-[0.25em] leading-none">
                Practice Intelligence
              </h1>
              <span className="text-[9px] font-bold text-alloro-textDark/40 uppercase tracking-widest mt-1.5 hidden sm:inline">
                Operational Integrity Hub
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-3 hover:bg-white rounded-xl transition-all active:scale-95 disabled:opacity-50 text-alloro-textDark/30"
            >
              <RefreshCw
                size={18}
                className={isRefreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - matches newdesign responsive structure */}
      <main className="w-full max-w-[1100px] mx-auto px-6 lg:px-10 py-6 lg:py-10 space-y-6 lg:space-y-10">
        {/* PERSONALIZED GREETING HERO SECTION - matches newdesign exactly */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 text-left">
          <div className="flex items-center gap-4 mb-3">
            <div className="px-3 py-1.5 bg-[#FDECEA] rounded-lg text-[#D66853] text-[10px] font-black uppercase tracking-widest border border-[#D66853]/10 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D66853]"></span>
              Real-time Analysis • {format(new Date(), "MMM d")}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
              <span className="text-green-500 text-[10px] font-black uppercase tracking-widest">
                Healthy Growth Signals
              </span>
            </div>
          </div>
          {userProfile?.lastName ? (
            <h1 className="text-5xl lg:text-6xl font-black font-heading text-alloro-navy tracking-tight leading-none mb-4">
              {getGreeting()}, Dr. {userProfile.lastName}.
            </h1>
          ) : (
            <LoadingSkeleton className="h-16 w-96 max-w-full mb-4" />
          )}
          {trajectory && (
            <p className="text-xl lg:text-2xl text-slate-500 font-medium tracking-tight leading-relaxed max-w-4xl">
              Your practice momentum is{" "}
              <span className="text-alloro-orange underline underline-offset-8 font-black">
                {trajectory}
              </span>
              . We have identified {criticalActionsCount} refinements for your
              attention today.
            </p>
          )}
        </section>

        {/* SECTION 1: INTELLIGENCE BRIEFING BANNER - matches newdesign exactly */}
        <section className="animate-in fade-in slide-in-from-top-8 duration-1000">
          <div className="bg-alloro-orange rounded-2xl p-6 lg:px-10 lg:py-8 text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-[120px] pointer-events-none"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-left">
              <div className="flex items-start sm:items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shadow-inner shrink-0 group">
                  <Zap
                    size={24}
                    className="text-white group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black font-heading tracking-tight leading-none">
                    Intelligence Briefing
                  </h3>
                  {tasksLoading || criticalActionsCount === 0 ? (
                    <div className="h-6 w-80 bg-white/30 rounded-lg animate-pulse mt-2"></div>
                  ) : (
                    <p className="text-white/80 text-base font-medium tracking-tight max-w-lg leading-relaxed">
                      You have{" "}
                      <span className="text-white font-black underline decoration-white/40 underline-offset-4">
                        {criticalActionsCount} critical actions
                      </span>{" "}
                      to secure $50k+ in recovery.
                    </p>
                  )}
                </div>
              </div>
              {tasksLoading ? (
                <div className="w-full sm:w-48 h-14 bg-white/20 rounded-xl animate-pulse"></div>
              ) : (
                <button
                  onClick={() => navigate("/tasks")}
                  className="w-full sm:w-auto px-10 py-4 bg-white text-alloro-orange rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4 shrink-0"
                >
                  REVIEW ACTIONS <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 2: CRITICAL PRIORITY / URGENT INTERVENTION - matches newdesign */}
        {(() => {
          const immediateTask = tasks.find((task) => {
            try {
              const metadata =
                typeof task.metadata === "string"
                  ? JSON.parse(task.metadata)
                  : task.metadata;
              return (
                metadata?.urgency === "Immediate" ||
                metadata?.urgency === "IMMEDIATE"
              );
            } catch {
              return false;
            }
          });

          // Extract potential risk amount from metadata if available
          // let potentialRisk = "$50K";
          try {
            if (immediateTask) {
              const metadata =
                typeof immediateTask.metadata === "string"
                  ? JSON.parse(immediateTask.metadata)
                  : immediateTask.metadata;
              if (metadata?.potential_risk) {
                // potentialRisk = metadata.potential_risk;
              }
            }
          } catch {
            // Use default
          }

          return (
            <section className="bg-white border border-slate-100 rounded-2xl p-6 lg:px-10 lg:py-8 shadow-premium relative flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex-1 text-left space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-2.5 py-1 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-red-100 leading-none">
                    URGENT INTERVENTION
                  </span>
                </div>
                {immediateTask ? (
                  <>
                    <h2 className="text-3xl lg:text-4xl font-black font-heading text-alloro-navy tracking-tight leading-none">
                      {parseHighlightTags(
                        (immediateTask.title || "").replace(/<[^>]*>/g, ""),
                        "highlight-red"
                      )}
                    </h2>
                    <p className="text-base lg:text-lg text-[#636E72] font-medium leading-relaxed tracking-tight max-w-2xl">
                      {parseHighlightTags(
                        (immediateTask.description || "").replace(
                          /<[^>]*>/g,
                          ""
                        ),
                        "highlight-red"
                      )}
                    </p>
                  </>
                ) : (
                  <div className="space-y-4 w-full">
                    <LoadingSkeleton className="h-10 w-3/4 max-w-lg" />
                    <LoadingSkeleton className="h-6 w-full max-w-xl" />
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  // Navigate to tasks with the task ID for scrolling
                  const taskId = immediateTask?.id;
                  navigate("/tasks", { state: { scrollToTaskId: taskId } });
                }}
                className="w-full sm:w-auto px-8 py-4 bg-[#11151C] text-white rounded-[1rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 shrink-0 active:scale-95 group"
              >
                See in Tasks{" "}
                <ChevronRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </section>
          );
        })()}

        {/* SECTION 3: RANKING STRATEGY - PREMIUM DESIGN - matches newdesign */}
        {rankingData && rankingData.length > 0 && (
          <section
            className="animate-in fade-in slide-in-from-bottom-4 duration-1000 cursor-pointer"
            onClick={() => navigate("/rankings")}
          >
            <div className="bg-[#FDFDFD] rounded-3xl border border-slate-100 p-10 lg:px-12 lg:py-10 shadow-premium relative overflow-hidden group hover:border-alloro-orange/20 hover:shadow-2xl transition-all duration-300">
              {/* Decorative Gradient Elements */}
              <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-alloro-orange/[0.03] to-transparent pointer-events-none"></div>
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-alloro-orange/[0.04] rounded-full blur-[100px] pointer-events-none"></div>

              {/* Carousel Navigation Header */}
              {totalLocations > 1 && (
                <div className="relative z-20 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-alloro-orange" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Location {currentLocationIndex + 1} of {totalLocations}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevLocation}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all active:scale-95"
                    >
                      <ChevronLeft size={16} className="text-slate-600" />
                    </button>
                    <div className="flex gap-1.5">
                      {rankingData?.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentLocationIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === currentLocationIndex
                              ? "bg-alloro-orange w-6"
                              : "bg-slate-300 hover:bg-slate-400"
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={nextLocation}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all active:scale-95"
                    >
                      <ChevronRight size={16} className="text-slate-600" />
                    </button>
                  </div>
                </div>
              )}

              <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12 text-left">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-1.5 bg-alloro-navy text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-lg shadow-sm">
                      RANKING STRATEGY
                    </div>
                    <div className="h-px w-20 bg-slate-100"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {currentLocationData?.location || "LOCAL MARKET"}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {currentLocationData ? (
                      <div
                        className="animate-in fade-in duration-500"
                        key={currentLocationIndex}
                      >
                        <h2 className="text-4xl lg:text-5xl font-black font-heading text-alloro-navy tracking-tight leading-[1.05]">
                          You're ranked{" "}
                          <span className="text-alloro-orange">
                            #{currentLocationData.rank} of{" "}
                            {currentLocationData.totalCompetitors}
                          </span>{" "}
                          locally — <br className="hidden md:block" />
                          growth is accelerating.
                        </h2>
                        <p className="text-lg text-slate-500 font-medium tracking-tight max-w-2xl mt-4">
                          Your authority score has increased by 12 points since
                          last month. Focus on review velocity to challenge the
                          #{Math.max(1, currentLocationData.rank - 1)} position.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <LoadingSkeleton className="h-16 w-full max-w-xl" />
                        <LoadingSkeleton className="h-8 w-96 max-w-full" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-10 shrink-0">
                  <div className="flex flex-col items-center group/stat">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3">
                      Authority Score
                    </span>
                    <div className="relative">
                      {currentLocationData ? (
                        <>
                          <span className="text-7xl font-black font-heading text-alloro-navy tabular-nums group-hover/stat:text-alloro-orange transition-colors duration-500">
                            {currentLocationData.score}
                          </span>
                          <div className="absolute -top-1 -right-4 w-2 h-2 rounded-full bg-alloro-orange animate-pulse"></div>
                        </>
                      ) : (
                        <LoadingSkeleton className="h-16 w-24" />
                      )}
                    </div>
                  </div>
                  <div className="w-px h-16 bg-slate-100 hidden sm:block"></div>
                  <div className="flex flex-col items-center group/stat">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3">
                      Patient Sentiment
                    </span>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-3xl font-black font-heading transition-colors ${
                          sentiment.label === "High"
                            ? "text-alloro-navy group-hover/stat:text-green-500"
                            : sentiment.label === "Okay"
                            ? "text-alloro-navy group-hover/stat:text-yellow-500"
                            : "text-alloro-navy"
                        }`}
                      >
                        {sentiment.label}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full ${
                          sentiment.label === "High"
                            ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                            : sentiment.label === "Okay"
                            ? "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                            : sentiment.label === "Low"
                            ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                            : "bg-slate-400"
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: VITALS & QUICK WINS & RISKS - matches newdesign */}
        {pmsMetrics && (
          <section className="space-y-8 pt-4">
            <div className="flex items-center gap-4 px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-alloro-textDark/40 whitespace-nowrap">
                Clinical Performance Vitals
              </h3>
              <div className="h-px w-full bg-black/10"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              <MetricCard
                label="Monthly Starts"
                value={pmsMetrics.selfReferrals}
                trend={
                  pmsMetrics.selfReferralChange !== 0
                    ? `${
                        pmsMetrics.selfReferralChange >= 0 ? "+" : ""
                      }${pmsMetrics.selfReferralChange.toFixed(0)}%`
                    : undefined
                }
                isHighlighted
              />
              <MetricCard
                label="Source Referrals"
                value={pmsMetrics.totalReferrals}
                trend={
                  pmsMetrics.referralChange !== 0
                    ? `${
                        pmsMetrics.referralChange >= 0 ? "+" : ""
                      }${pmsMetrics.referralChange.toFixed(0)}%`
                    : undefined
                }
              />
              <MetricCard
                label="Production"
                value={`$${(pmsMetrics.production / 1000).toFixed(0)}K`}
                trend={
                  pmsMetrics.productionChange !== 0
                    ? `${
                        pmsMetrics.productionChange >= 0 ? "+" : ""
                      }${pmsMetrics.productionChange.toFixed(0)}%`
                    : undefined
                }
              />
              <MetricCard
                label="Market Coverage"
                value={
                  currentLocationData
                    ? `${Math.round(
                        ((currentLocationData.totalCompetitors -
                          currentLocationData.rank) /
                          currentLocationData.totalCompetitors) *
                          100
                      )}%`
                    : "--%"
                }
                trend={currentLocationData ? "+1%" : undefined}
              />
            </div>
            {(wins || risks) && (
              <div className="pt-8 space-y-8">
                <div className="flex items-center gap-4 px-1">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-alloro-textDark/40 whitespace-nowrap">
                    Growth Signals & Operational Risks
                  </h3>
                  <div className="h-px w-full bg-black/10"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                  {wins && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3 text-green-600 font-black text-[10px] uppercase tracking-[0.3em]">
                        <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center border border-green-100 shadow-sm">
                          <TrendingUp size={16} />
                        </div>
                        Wins
                      </div>
                      <div className="space-y-3">
                        {wins.map((win: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex gap-4 p-5 bg-white border border-slate-50 rounded-2xl shadow-sm hover:shadow-md transition-all"
                          >
                            <CheckCircle2
                              className="text-green-500 shrink-0 mt-0.5"
                              size={20}
                            />
                            <span className="text-sm font-bold text-slate-500 leading-relaxed tracking-tight">
                              {win}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {risks && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3 text-red-600 font-black text-[10px] uppercase tracking-[0.3em]">
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-sm">
                          <AlertTriangle size={16} />
                        </div>
                        Risks
                      </div>
                      <div className="space-y-3">
                        {risks.map((risk: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex gap-4 p-5 bg-white border border-slate-50 rounded-2xl shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="w-2.5 h-2.5 bg-red-400 rounded-full shrink-0 mt-2"></div>
                            <span className="text-sm font-bold text-slate-500 leading-relaxed tracking-tight">
                              {risk}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* SECTION: PREMIUM TOP 3 STRATEGIC FIXES - matches newdesign (visible, not in hub) */}
        {topFixes && estimatedRevenue && (
          <section className="space-y-10 pt-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="px-4 py-1.5 bg-alloro-navy text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-lg leading-none">
                    STRATEGIC GROWTH
                  </div>
                  <div className="h-px w-24 bg-alloro-navy/10"></div>
                </div>
                <h2 className="text-4xl lg:text-5xl font-black font-heading text-alloro-navy tracking-tighter leading-tight">
                  Top 3 Fixes to Add{" "}
                  <span className="text-alloro-orange inline-flex items-baseline gap-1">
                    {formatCurrency(estimatedRevenue)}+
                  </span>{" "}
                  <br className="hidden md:block" />
                  to your Annual Revenue.
                </h2>
                <p className="text-slate-400 font-bold text-lg tracking-tight max-w-3xl leading-relaxed">
                  Precision refinements identified by Alloro to capture leaking
                  production and accelerate your practice growth.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {topFixes.map((fix: string, idx: number) => (
                <div
                  key={idx}
                  className="group relative bg-white rounded-3xl p-8 lg:p-10 border border-slate-100 shadow-premium hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col min-h-[440px] overflow-hidden"
                >
                  {/* Elite Background Gradient Glow */}
                  <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-alloro-orange/[0.04] rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-alloro-orange/[0.08] transition-all duration-500 pointer-events-none"></div>

                  {/* Orange Sidebar Indicator */}
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-alloro-orange transform scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top"></div>

                  <div className="relative z-10 space-y-12">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-black text-alloro-orange uppercase tracking-[0.3em] bg-alloro-orange/5 px-4 py-2 rounded-xl border border-alloro-orange/10 w-fit">
                        <DollarSign size={14} /> Revenue Asset
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] leading-none">
                        Estimated Annual Growth
                      </div>
                      <div className="text-5xl lg:text-6xl font-black font-heading text-alloro-navy tracking-tighter tabular-nums leading-none group-hover:text-alloro-orange transition-colors duration-500">
                        ${Math.round(estimatedRevenue / 3 / 1000)}K+
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto space-y-8 relative z-10">
                    <div className="space-y-3">
                      <h4 className="text-xl lg:text-2xl font-black font-heading text-alloro-navy leading-tight tracking-tight">
                        Fix #{idx + 1}
                      </h4>
                      <p className="text-[15px] text-slate-500 font-bold leading-relaxed tracking-tight line-clamp-2">
                        {fix}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <button
                        onClick={() =>
                          setSelectedFix({ index: idx + 1, text: fix })
                        }
                        className="flex items-center gap-3 text-[10px] font-black text-alloro-navy uppercase tracking-[0.3em] group-hover:text-alloro-orange transition-colors cursor-pointer hover:gap-4"
                      >
                        View More <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Strategic Growth Fix Modal */}
        {selectedFix && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedFix(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 lg:p-10 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-alloro-orange uppercase tracking-[0.3em] bg-alloro-orange/5 px-4 py-2 rounded-xl border border-alloro-orange/10 w-fit">
                      <DollarSign size={14} /> Revenue Asset
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-black font-heading text-alloro-navy tracking-tight">
                      Fix #{selectedFix.index}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedFix(null)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
                    Estimated Annual Growth
                  </div>
                  <div className="text-4xl font-black font-heading text-alloro-orange tracking-tighter">
                    {estimatedRevenue
                      ? `$${Math.round(estimatedRevenue / 3 / 1000)}K+`
                      : "N/A"}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <p className="text-lg text-slate-600 font-medium leading-relaxed">
                    {selectedFix.text}
                  </p>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setSelectedFix(null)}
                    className="px-6 py-3 bg-alloro-navy text-white rounded-xl text-sm font-bold hover:bg-black transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HUB COLLAPSIBLE TRIGGER - matches newdesign */}
        <div className="pt-10 text-center">
          <button
            onClick={() => setShowDataHub(!showDataHub)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-12 py-7 bg-white border border-alloro-orange/20 text-alloro-orange text-[12px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-alloro-orange hover:text-white transition-all shadow-premium active:scale-95 group"
          >
            {showDataHub
              ? "Hide Detailed Intelligence"
              : "Enter Practice Intelligence Hub"}
            <div
              className={`ml-4 transition-transform duration-500 ${
                showDataHub ? "rotate-180" : "group-hover:translate-y-1"
              }`}
            >
              <ChevronDown size={20} />
            </div>
          </button>

          {showDataHub && (
            <div className="mt-16 text-left animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-forwards">
              <ReferralMatrices
                referralData={referralData}
                isLoading={referralLoading}
                isPending={referralPending}
              />
            </div>
          )}
        </div>

        {/* Footer Branding - matches newdesign exactly */}
        <footer className="pt-24 pb-12 flex flex-col items-center gap-10 text-center">
          <div className="w-16 h-16 bg-alloro-orange text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-2xl">
            A
          </div>
          <div className="space-y-4">
            <p className="text-[11px] text-alloro-textDark/20 font-black tracking-[0.4em] uppercase">
              Alloro Practice Intelligence • v2.6.0
            </p>
            <div className="flex items-center justify-center gap-10 text-[10px] font-black text-alloro-textDark/30 uppercase tracking-[0.2em]">
              <span className="flex items-center gap-3">
                <ShieldCheck size={18} /> HIPAA SECURE
              </span>
              <span className="flex items-center gap-3">
                <Activity size={18} /> LIVE ANALYTICS
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
