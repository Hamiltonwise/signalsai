import { useState, useEffect, useCallback } from "react";
import {
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Target,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Activity,
  ChevronDown,
  ArrowRightCircle,
  Cpu,
  UserCheck,
  CircleCheck,
  ChevronLeft,
  MapPin,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAgentData } from "../../hooks/useAgentData";
import { useAuth } from "../../hooks/useAuth";
import { format } from "date-fns";
import { fetchPmsKeyData, type PmsKeyDataResponse } from "../../api/pms";
import { fetchClientTasks } from "../../api/tasks";
import type { ActionItem } from "../../types/tasks";
import { parseHighlightTags } from "../../utils/textFormatting";

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

// Referral Engine Data types
interface ReferralEngineData {
  executive_summary?: string[];
  doctor_referral_matrix?: DoctorReferral[];
  non_doctor_referral_matrix?: NonDoctorReferral[];
  growth_opportunity_summary?: {
    top_three_fixes?: string[];
    estimated_additional_annual_revenue?: number;
  };
  practice_action_plan?: string[];
  alloro_automation_opportunities?: string[];
}

interface DoctorReferral {
  referrer_id?: string;
  referrer_name?: string;
  referred?: number;
  pct_scheduled?: number | null;
  pct_examined?: number | null;
  pct_started?: number | null;
  net_production?: number | null;
  trend_label?: "increasing" | "decreasing" | "new" | "dormant" | "stable";
  notes?: string;
}

interface NonDoctorReferral {
  source_key?: string;
  source_label?: string;
  source_type?: "digital" | "patient" | "other";
  referred?: number;
  pct_scheduled?: number | null;
  pct_examined?: number | null;
  pct_started?: number | null;
  net_production?: number | null;
  trend_label?: "increasing" | "decreasing" | "new" | "dormant" | "stable";
  notes?: string;
}

interface DashboardOverviewProps {
  googleAccountId?: number | null;
}

/* --- Helper Components - matches newdesign exactly --- */

const IntelligencePulse = () => (
  <span className="relative flex h-2.5 w-2.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alloro-cobalt opacity-40"></span>
    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-alloro-cobalt shadow-[0_0_8px_rgba(36,78,230,0.5)]"></span>
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
}) => (
  <div
    className={`flex flex-col p-6 rounded-2xl border transition-all duration-300 ${
      isHighlighted
        ? "bg-white border-alloro-cobalt/20 shadow-premium"
        : "bg-white/60 border-slate-100 hover:bg-white hover:border-slate-200"
    }`}
  >
    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.15em] mb-3 leading-none">
      {label}
    </span>
    <div className="flex items-center justify-between">
      <span
        className={`text-3xl font-extrabold font-heading tracking-tighter leading-none ${
          isHighlighted ? "text-alloro-cobalt" : "text-alloro-navy"
        }`}
      >
        {value}
      </span>
      {trend && (
        <span
          className={`text-[10px] font-extrabold px-2 py-1 rounded-lg flex items-center gap-0.5 ${
            trend.startsWith("+")
              ? "text-green-600 bg-green-50"
              : "text-red-500 bg-red-50"
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
  </div>
);

const CompactTag = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Increasing: "text-green-600 bg-green-50 border-green-100",
    increasing: "text-green-600 bg-green-50 border-green-100",
    Decreasing: "text-red-600 bg-red-50 border-red-100",
    decreasing: "text-red-600 bg-red-50 border-red-100",
    New: "text-purple-600 bg-purple-50 border-purple-100",
    new: "text-purple-600 bg-purple-50 border-purple-100",
    Dormant: "text-slate-400 bg-slate-50 border-slate-100",
    dormant: "text-slate-400 bg-slate-50 border-slate-100",
    Stable: "text-blue-600 bg-blue-50 border-blue-100",
    stable: "text-blue-600 bg-blue-50 border-blue-100",
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border leading-none mt-1 w-fit ${
        styles[status] || styles["Stable"]
      }`}
    >
      {status}
    </span>
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
  const { data, loading, error, refetch } = useAgentData(
    googleAccountId || null
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDataHub, setShowDataHub] = useState(false);
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);

  // PMS data state
  const [pmsData, setPmsData] = useState<PmsKeyDataResponse["data"] | null>(
    null
  );
  const [pmsLoading, setPmsLoading] = useState(true);
  const [, setPmsError] = useState<string | null>(null);

  // Tasks data state
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [, setAllUserTasks] = useState<ActionItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [, setTasksError] = useState<string | null>(null);

  // Ranking data state
  const [rankingData, setRankingData] = useState<RankingResult[] | null>(null);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [, setRankingError] = useState<string | null>(null);

  // Referral Engine data state
  const [referralData, setReferralData] = useState<ReferralEngineData | null>(
    null
  );
  const [, setReferralLoading] = useState(true);

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
          return;
        }

        const result = await response.json();
        if (result.success && result.data) {
          const dataToSet = Array.isArray(result.data)
            ? result.data[0]
            : result.data;
          setReferralData(dataToSet);
        }
      } catch (err) {
        console.error("Failed to fetch referral engine data:", err);
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

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  // Extract agent data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summaryData = data?.agents?.summary?.results?.[0] as any;

  // Get current date formatted
  const currentDate = format(new Date(), "MMMM d, yyyy");

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Get critical actions count
  const criticalActionsCount =
    tasks.filter((t) => {
      try {
        const metadata =
          typeof t.metadata === "string" ? JSON.parse(t.metadata) : t.metadata;
        return (
          metadata?.urgency === "Immediate" || metadata?.urgency === "High"
        );
      } catch {
        return false;
      }
    }).length || 3; // Default to 3 if no data

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
    <div
      className={`bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-xl animate-pulse ${className}`}
    ></div>
  );

  // Loading state - show skeleton when any critical data is still loading
  const isInitialLoading =
    loading || pmsLoading || rankingLoading || tasksLoading;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-10 lg:space-y-16 animate-pulse">
          {/* Header skeleton */}
          <div className="h-16 bg-slate-200 rounded-2xl"></div>
          {/* Greeting skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-32 bg-slate-200 rounded-lg"></div>
            <div className="h-12 w-96 max-w-full bg-slate-200 rounded-xl"></div>
            <div className="h-6 w-80 max-w-full bg-slate-200 rounded-lg"></div>
          </div>
          {/* Intelligence briefing skeleton */}
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          {/* Market Authority skeleton */}
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
          {/* Metrics grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            <div className="h-28 bg-slate-200 rounded-2xl"></div>
            <div className="h-28 bg-slate-200 rounded-2xl"></div>
            <div className="h-28 bg-slate-200 rounded-2xl"></div>
            <div className="h-28 bg-slate-200 rounded-2xl"></div>
          </div>
          {/* Wins/Risks skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="h-48 bg-slate-200 rounded-2xl"></div>
            <div className="h-48 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

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
          className="px-6 py-2.5 bg-alloro-cobalt text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto font-semibold text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-alloro-navy selection:bg-alloro-cobalt/10">
      {/* Professional Header - Responsive with Glass effect - matches newdesign */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/60 lg:sticky lg:top-0 z-40 transition-all duration-300">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <IntelligencePulse />
            <div className="flex flex-col">
              <h1 className="text-[11px] font-extrabold font-heading text-alloro-navy uppercase tracking-[0.2em] leading-none">
                Growth Intelligence
              </h1>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-1 hidden sm:inline">
                Engine Live • Global Market Data
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-6">
            <div className="hidden md:flex items-center gap-2 text-slate-400 font-semibold text-[9px] uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <ShieldCheck size={14} className="text-green-500" /> HIPAA Secure
              Verification
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 hover:bg-slate-100 rounded-xl transition-all active:scale-95 disabled:opacity-50 border border-transparent hover:border-slate-200"
            >
              <RefreshCw
                size={18}
                className={`text-slate-500 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - matches newdesign responsive structure */}
      <main className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-10 lg:space-y-16">
        {/* DOCTOR GREETING SECTION - matches newdesign exactly */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-1">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-alloro-cobalt/5 text-alloro-cobalt text-[10px] font-extrabold uppercase tracking-[0.2em] rounded-lg">
                {currentDate}
              </span>
              <div className="flex items-center gap-1.5 text-green-600 text-[10px] font-extrabold uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>{" "}
                Verified Ledger
              </div>
            </div>
            {userProfile?.lastName ? (
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-alloro-navy tracking-tight leading-none">
                {getGreeting()}, Dr. {userProfile.lastName}.
              </h2>
            ) : (
              <LoadingSkeleton className="h-12 w-96 max-w-full" />
            )}
          </div>
        </section>

        {/* 1. DAILY INTELLIGENCE BRIEFING - matches newdesign exactly */}
        <section className="animate-in fade-in slide-in-from-top-6 duration-1000 ease-out">
          <div className="bg-alloro-navy rounded-2xl p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl border-t border-white/5">
            <div className="absolute top-0 right-0 p-64 bg-alloro-cobalt/10 rounded-full -mr-32 -mt-32 blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="flex items-start sm:items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner shrink-0 group hover:border-alloro-teal transition-colors">
                  <Zap
                    size={28}
                    className="text-alloro-teal drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight leading-none">
                    Intelligence Briefing
                  </h3>
                  {tasksLoading ? (
                    <div className="space-y-2">
                      <div className="h-5 w-64 bg-white/10 rounded-lg animate-pulse"></div>
                      <div className="h-5 w-48 bg-white/10 rounded-lg animate-pulse"></div>
                    </div>
                  ) : (
                    <p className="text-slate-300 text-base sm:text-lg font-normal tracking-tight max-w-lg leading-relaxed">
                      Alloro has detected{" "}
                      <span className="text-white font-extrabold underline decoration-alloro-teal underline-offset-4">
                        {criticalActionsCount} critical actions
                      </span>{" "}
                      to secure revenue.
                    </p>
                  )}
                </div>
              </div>
              {tasksLoading ? (
                <div className="w-full sm:w-48 h-14 bg-white/10 rounded-xl animate-pulse"></div>
              ) : (
                <button
                  onClick={() => navigate("/tasks")}
                  className="w-full sm:w-auto px-10 py-5 bg-alloro-cobalt text-white rounded-xl text-[12px] font-extrabold uppercase tracking-[0.2em] shadow-xl hover:shadow-alloro-cobalt/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shrink-0"
                >
                  REVIEW ACTIONS <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 2. PRACTICE STATUS + MARKET AUTHORITY - CAROUSEL - matches newdesign */}
        <section className="relative group">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-premium overflow-hidden transition-all hover:shadow-2xl hover:border-slate-200">
            <div className="absolute top-0 right-0 p-80 bg-alloro-cobalt/[0.02] rounded-full -mr-40 -mt-40 blur-[120px] pointer-events-none"></div>

            {/* Carousel Navigation Header */}
            {totalLocations > 1 && (
              <div className="relative z-20 px-8 lg:px-14 pt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-alloro-cobalt" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
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
                            ? "bg-alloro-cobalt w-6"
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

            <div className="relative z-10 p-8 lg:p-14 space-y-12">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                <div className="max-w-xl space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-alloro-cobalt flex items-center justify-center border border-indigo-100/50 shadow-sm">
                      <Sparkles size={18} />
                    </div>
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-alloro-cobalt leading-none">
                      Market Authority Status
                    </span>
                  </div>
                  {currentLocationData ? (
                    <div
                      className="animate-in fade-in duration-500"
                      key={currentLocationIndex}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin size={18} className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-500">
                          {currentLocationData.locationName}
                        </span>
                        {currentLocationData.location && (
                          <span className="text-xs text-slate-400">
                            • {currentLocationData.location}
                          </span>
                        )}
                      </div>
                      <h2 className="text-4xl lg:text-5xl font-extrabold font-heading text-alloro-navy tracking-tight leading-[1.05]">
                        Ranked{" "}
                        <span className="text-alloro-cobalt">
                          #{currentLocationData.rank} of{" "}
                          {currentLocationData.totalCompetitors}
                        </span>{" "}
                        locally — momentum is{" "}
                        <span
                          className={`${
                            sentiment.label === "High"
                              ? "text-green-500"
                              : sentiment.label === "Okay"
                              ? "text-yellow-500"
                              : sentiment.label === "Low"
                              ? "text-red-500"
                              : "text-alloro-teal"
                          }`}
                        >
                          {sentiment.label === "High"
                            ? "Peak"
                            : sentiment.label === "Okay"
                            ? "Steady"
                            : sentiment.label === "Low"
                            ? "Declining"
                            : "N/A"}
                        </span>
                        .
                      </h2>
                      <p className="text-lg lg:text-xl text-slate-500 font-normal tracking-tight leading-relaxed mt-6">
                        You are currently outperforming{" "}
                        {Math.round(
                          ((currentLocationData.totalCompetitors -
                            currentLocationData.rank) /
                            currentLocationData.totalCompetitors) *
                            100
                        )}
                        % of local competitors. Acquire 5 patient reviews this
                        month to secure the next position.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <LoadingSkeleton className="h-6 w-48" />
                      <LoadingSkeleton className="h-16 w-full max-w-xl" />
                      <LoadingSkeleton className="h-8 w-96 max-w-full" />
                    </div>
                  )}
                </div>

                {/* MARKET AUTHORITY & SENTIMENT WIDGET - matches newdesign */}
                <div className="grid grid-cols-2 gap-8 sm:gap-12 bg-slate-50/50 border border-slate-100 p-8 sm:p-10 rounded-2xl shrink-0">
                  <div className="space-y-3">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] leading-none">
                      AUTHORITY SCORE
                    </p>
                    {currentLocationData ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-extrabold font-heading text-alloro-navy leading-none tracking-tighter transition-all duration-500">
                          {currentLocationData.score}
                        </span>
                        <span className="text-lg font-semibold text-slate-300">
                          /100
                        </span>
                      </div>
                    ) : (
                      <LoadingSkeleton className="h-12 w-24" />
                    )}
                  </div>
                  <div className="space-y-3 relative">
                    <div className="absolute -left-6 top-0 bottom-0 w-px bg-slate-200 hidden sm:block"></div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] leading-none">
                      SENTIMENT
                    </p>
                    {currentLocationData ? (
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-2xl font-extrabold font-heading leading-none tracking-tight transition-all duration-500 ${
                            sentiment.label === "High"
                              ? "text-green-600"
                              : sentiment.label === "Okay"
                              ? "text-yellow-600"
                              : sentiment.label === "Low"
                              ? "text-red-600"
                              : "text-alloro-navy"
                          }`}
                        >
                          {sentiment.label}
                        </span>
                        <div
                          className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${
                            sentiment.label === "High"
                              ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]"
                              : sentiment.label === "Okay"
                              ? "bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.6)]"
                              : sentiment.label === "Low"
                              ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                              : "bg-slate-400"
                          } ${sentiment.pulse ? "animate-pulse" : ""}`}
                        ></div>
                      </div>
                    ) : (
                      <LoadingSkeleton className="h-8 w-20" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. MONTHLY VITALS - Adaptive Grid - matches newdesign */}
        <section className="space-y-6">
          <div className="flex items-center gap-5 px-1">
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-slate-400 whitespace-nowrap">
              Operational Performance
            </h3>
            <div className="h-px w-full bg-slate-100/80"></div>
          </div>
          {pmsLoading || rankingLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-alloro-cobalt mx-auto mb-2" />
              <p className="text-sm text-slate-500">Loading practice data...</p>
            </div>
          ) : pmsMetrics ? (
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              <MetricCard label="Monthly Starts" value="--" isHighlighted />
              <MetricCard label="Source Referrals" value="--" />
              <MetricCard label="Production" value="--" />
              <MetricCard label="Market Coverage" value="--" />
            </div>
          )}
        </section>

        {/* 4. PERFORMANCE SIGNALS - Wins & Risks - matches newdesign */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="relative bg-green-50/20 rounded-2xl p-8 space-y-6 transition-all hover:bg-green-50/40 border border-green-100/60">
            <div className="flex items-center gap-3 text-green-600 font-extrabold text-[11px] uppercase tracking-[0.2em]">
              <div className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-200">
                <TrendingUp size={16} />
              </div>
              Growth Momentum (Wins)
            </div>
            {wins ? (
              <ul className="space-y-4">
                {wins.map((win: string, idx: number) => (
                  <li
                    key={idx}
                    className="flex gap-4 text-sm sm:text-[15px] font-semibold text-slate-600 leading-tight tracking-tight items-start group"
                  >
                    <CheckCircle2
                      className="text-green-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform"
                      size={16}
                    />
                    <span>{win}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-4">
                <LoadingSkeleton className="h-5 w-full" />
                <LoadingSkeleton className="h-5 w-4/5" />
                <LoadingSkeleton className="h-5 w-3/4" />
              </div>
            )}
          </div>

          <div className="relative bg-red-50/20 rounded-2xl p-8 space-y-6 transition-all hover:bg-red-50/40 border border-red-100/60">
            <div className="flex items-center gap-3 text-red-600 font-extrabold text-[11px] uppercase tracking-[0.2em]">
              <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-200">
                <AlertTriangle size={16} />
              </div>
              Stability Risks
            </div>
            {risks ? (
              <ul className="space-y-4">
                {risks.map((risk: string, idx: number) => (
                  <li
                    key={idx}
                    className="flex gap-4 text-sm sm:text-[15px] font-semibold text-slate-600 leading-tight tracking-tight items-start group"
                  >
                    <div className="w-2 h-2 bg-red-400 rounded-full shrink-0 mt-2 transition-transform group-hover:scale-125"></div>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-4">
                <LoadingSkeleton className="h-5 w-full" />
                <LoadingSkeleton className="h-5 w-4/5" />
                <LoadingSkeleton className="h-5 w-3/4" />
              </div>
            )}
          </div>
        </section>

        {/* 5. NEXT STEPS - Action Roadmap - matches newdesign */}
        <section className="bg-white rounded-2xl border border-slate-200/60 shadow-premium overflow-hidden">
          <div className="px-8 sm:px-10 py-10 border-b border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold font-heading text-alloro-navy tracking-tight leading-none">
                Action Roadmap
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-2">
                Tactical Execution Plan • Verified Priority
              </p>
            </div>
            <button
              onClick={() => navigate("/tasks")}
              className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-xl text-[10px] font-extrabold text-alloro-cobalt uppercase tracking-widest hover:bg-alloro-cobalt hover:text-white transition-all border border-slate-100 hover:border-alloro-cobalt shadow-sm"
            >
              Strategic Hub <ChevronRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {tasksLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-alloro-cobalt mx-auto" />
              </div>
            ) : tasks.length > 0 ? (
              tasks.slice(0, 3).map((task) => {
                let urgency = "Normal";
                try {
                  const metadata =
                    typeof task.metadata === "string"
                      ? JSON.parse(task.metadata)
                      : task.metadata;
                  urgency = metadata?.urgency || "Normal";
                } catch {
                  // Default urgency
                }
                const isUrgent =
                  urgency === "Immediate" || urgency === "IMMEDIATE";

                return (
                  <div
                    key={task.id}
                    className="group p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 hover:bg-slate-50/50 transition-all cursor-pointer"
                  >
                    <div className="flex gap-6 items-start flex-1">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all shadow-sm ${
                          isUrgent
                            ? "bg-red-50 text-red-500 border-red-100 group-hover:bg-red-500 group-hover:text-white"
                            : "bg-alloro-cobalt/5 text-alloro-cobalt border-alloro-cobalt/10 group-hover:bg-alloro-cobalt group-hover:text-white"
                        }`}
                      >
                        <ArrowRight
                          size={20}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-[17px] font-extrabold text-alloro-navy tracking-tight leading-none transition-colors group-hover:text-alloro-cobalt">
                          {parseHighlightTags(task.title, "underline")}
                        </h4>
                        <p className="text-[14px] font-medium text-slate-500 leading-relaxed tracking-tight max-w-2xl">
                          {task.description
                            ? parseHighlightTags(task.description, "underline")
                            : "No description provided."}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border shrink-0 transition-all ${
                        isUrgent
                          ? "bg-red-50 text-red-600 border-red-100 shadow-[0_4px_10px_rgba(239,68,68,0.1)]"
                          : "bg-slate-100 text-slate-400 border-slate-200 group-hover:bg-alloro-cobalt/10 group-hover:text-alloro-cobalt"
                      }`}
                    >
                      {isUrgent ? "IMMEDIATE" : task.category}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400">
                No priority actions at this time.
              </div>
            )}
          </div>
        </section>

        {/* 6. URGENT INTERVENTION - High Visual Impact - matches newdesign */}
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

          if (!immediateTask) return null;

          // Extract potential risk amount from metadata if available
          let potentialRisk = "$50,000";
          try {
            const metadata =
              typeof immediateTask.metadata === "string"
                ? JSON.parse(immediateTask.metadata)
                : immediateTask.metadata;
            if (metadata?.potential_risk) {
              potentialRisk = metadata.potential_risk;
            }
          } catch {
            // Use default
          }

          return (
            <section className="bg-white rounded-2xl border-2 border-red-100 shadow-2xl overflow-hidden group relative">
              <div className="absolute top-0 right-0 p-40 bg-red-50 rounded-full -mr-20 -mt-20 blur-[80px] pointer-events-none opacity-60 transition-opacity group-hover:opacity-100"></div>
              <div className="p-8 lg:p-14 relative flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="space-y-5 flex-1 text-center lg:text-left">
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-2">
                    <span className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-widest shadow-lg shadow-red-200">
                      Critical Priority
                    </span>
                    <span className="flex items-center gap-2 text-alloro-navy font-extrabold text-[10px] uppercase tracking-widest opacity-70">
                      <DollarSign size={14} className="text-green-600" />{" "}
                      {potentialRisk} Potential Risk
                    </span>
                  </div>
                  <h4 className="text-4xl sm:text-5xl font-extrabold font-heading leading-[1.1] tracking-tighter text-alloro-navy">
                    {parseHighlightTags(immediateTask.title, "highlight-red")}
                  </h4>
                  <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed tracking-tight max-w-2xl mx-auto lg:mx-0">
                    {immediateTask.description
                      ? parseHighlightTags(
                          immediateTask.description,
                          "highlight-red"
                        )
                      : "Immediate clinical outreach recommended to preserve business health."}
                  </p>
                </div>
                <button
                  onClick={() => navigate("/tasks")}
                  className="w-full sm:w-auto px-12 py-7 bg-alloro-navy text-white rounded-xl text-[13px] font-extrabold uppercase tracking-[0.25em] shadow-2xl hover:bg-alloro-cobalt hover:shadow-alloro-cobalt/30 transition-all hover:-translate-y-1 active:scale-95 shrink-0 flex items-center justify-center gap-4"
                >
                  EXECUTE CALL PROTOCOL <ArrowRightCircle size={20} />
                </button>
              </div>
            </section>
          );
        })()}

        {/* 7. INTELLIGENCE HUB TOGGLE - matches newdesign */}
        <section className="pt-12 text-center border-t border-slate-100/80">
          <button
            onClick={() => setShowDataHub(!showDataHub)}
            className="w-full sm:w-auto group inline-flex items-center justify-center px-10 py-6 bg-white border border-slate-200 text-slate-400 text-[11px] font-extrabold uppercase tracking-[0.3em] rounded-2xl hover:border-alloro-cobalt hover:text-alloro-cobalt transition-all shadow-sm hover:shadow-xl hover:scale-[1.02] active:scale-95"
          >
            {showDataHub ? "Hide Intelligence Hub" : "Enter Intelligence Hub"}
            <div
              className={`ml-4 transition-transform duration-500 ${
                showDataHub ? "rotate-180" : ""
              }`}
            >
              <ChevronDown size={18} />
            </div>
          </button>

          {showDataHub && (
            <div className="mt-16 space-y-16 text-left animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-forwards">
              {/* DOCTOR REFERRAL MATRIX */}
              {referralData?.doctor_referral_matrix &&
                referralData.doctor_referral_matrix.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-premium overflow-hidden">
                    <div className="px-8 sm:px-10 py-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <h2 className="text-xl font-extrabold font-heading text-alloro-navy tracking-tight leading-none">
                          Referring Doctor Matrix (YTD)
                        </h2>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                          Practice Management System (PMS) Verification
                        </p>
                      </div>
                      <span className="px-4 py-2 bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.15em] rounded-xl border border-slate-100">
                        Live Ledger Data
                      </span>
                    </div>
                    <div className="overflow-x-auto scrollbar-thin">
                      <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-slate-50/70 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                          <tr>
                            <th className="px-10 py-6">Medical Entity</th>
                            <th className="px-4 py-6 text-center">Ref.</th>
                            <th className="px-4 py-6 text-center">Sched %</th>
                            <th className="px-4 py-6 text-center">Exam %</th>
                            <th className="px-4 py-6 text-center">Start %</th>
                            <th className="px-4 py-6 text-right">Production</th>
                            <th className="px-10 py-6 w-[35%]">
                              Algorithmic Note
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {referralData.doctor_referral_matrix.map(
                            (doc, idx) => (
                              <tr
                                key={doc.referrer_id || idx}
                                className="hover:bg-slate-50/40 transition-all group"
                              >
                                <td className="px-10 py-6">
                                  <div className="flex flex-col">
                                    <span className="font-extrabold text-alloro-navy text-[16px] leading-tight tracking-tight group-hover:text-alloro-cobalt transition-colors">
                                      {doc.referrer_name || "Unknown"}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-semibold mb-1.5 opacity-70 uppercase tracking-wider">
                                      Specialist
                                    </span>
                                    {doc.trend_label && (
                                      <CompactTag status={doc.trend_label} />
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-6 text-center font-extrabold text-alloro-navy text-lg tabular-nums">
                                  {doc.referred || 0}
                                </td>
                                <td className="px-4 py-6 text-center font-semibold text-slate-500 text-sm tabular-nums">
                                  {doc.pct_scheduled?.toFixed(1) || 0}%
                                </td>
                                <td className="px-4 py-6 text-center font-semibold text-slate-500 text-sm tabular-nums">
                                  {doc.pct_examined?.toFixed(1) || 0}%
                                </td>
                                <td className="px-4 py-6 text-center font-semibold text-slate-500 text-sm tabular-nums">
                                  {doc.pct_started?.toFixed(1) || 0}%
                                </td>
                                <td className="px-4 py-6 text-right font-extrabold text-alloro-navy tabular-nums text-lg">
                                  {formatCurrency(doc.net_production)}
                                </td>
                                <td className="px-10 py-6">
                                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                                    <p className="text-[14px] text-slate-500 font-medium leading-relaxed tracking-tight">
                                      {doc.notes || "No notes available."}
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* NON-DOCTOR REFERRAL MATRIX */}
              {referralData?.non_doctor_referral_matrix &&
                referralData.non_doctor_referral_matrix.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-premium overflow-hidden">
                    <div className="px-8 sm:px-10 py-8 border-b border-slate-100">
                      <h2 className="text-xl font-extrabold font-heading text-alloro-navy tracking-tight leading-none">
                        Non-Doctor Referral Matrix (YTD)
                      </h2>
                    </div>
                    <div className="overflow-x-auto scrollbar-thin">
                      <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-slate-50/70 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                          <tr>
                            <th className="px-10 py-6">Source Channel</th>
                            <th className="px-4 py-6 text-center">Ref.</th>
                            <th className="px-4 py-6 text-center">Sched %</th>
                            <th className="px-4 py-6 text-center">Exam %</th>
                            <th className="px-4 py-6 text-center">Start %</th>
                            <th className="px-4 py-6 text-right">Production</th>
                            <th className="px-10 py-6 w-[35%]">
                              Performance Intelligence
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {referralData.non_doctor_referral_matrix
                            .filter((s) => (s.referred || 0) > 0)
                            .map((source, idx) => (
                              <tr
                                key={source.source_key || idx}
                                className="hover:bg-slate-50/40 transition-all group"
                              >
                                <td className="px-10 py-6">
                                  <div className="flex flex-col">
                                    <span className="font-extrabold text-alloro-navy text-[16px] leading-tight tracking-tight group-hover:text-alloro-cobalt transition-colors">
                                      {source.source_label ||
                                        source.source_key ||
                                        "Unknown"}
                                    </span>
                                    {source.trend_label && (
                                      <CompactTag status={source.trend_label} />
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-6 text-center font-extrabold text-alloro-navy text-lg tabular-nums">
                                  {source.referred || 0}
                                </td>
                                <td className="px-4 py-6 text-center font-semibold text-slate-500 text-sm tabular-nums">
                                  {source.pct_scheduled?.toFixed(1) || 0}%
                                </td>
                                <td className="px-4 py-6 text-center font-semibold text-slate-500 text-sm tabular-nums">
                                  {source.pct_examined?.toFixed(1) || 0}%
                                </td>
                                <td className="px-4 py-6 text-center font-semibold text-slate-500 text-sm tabular-nums">
                                  {source.pct_started?.toFixed(1) || 0}%
                                </td>
                                <td className="px-4 py-6 text-right font-extrabold text-alloro-navy tabular-nums text-lg">
                                  {formatCurrency(source.net_production)}
                                </td>
                                <td className="px-10 py-6">
                                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                                    <p className="text-[14px] text-slate-500 font-medium leading-relaxed tracking-tight">
                                      {source.notes ||
                                        (source.source_type === "digital"
                                          ? "High-intent digital lead. Focus on GBP visibility."
                                          : "Key peer-to-peer referral source.")}
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* RESPONSIBILITY SPLIT SECTION */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-premium overflow-hidden transition-all hover:shadow-2xl">
                <div className="px-8 sm:px-10 py-10 border-b border-slate-100 bg-slate-50/30">
                  <h2 className="text-2xl font-extrabold font-heading text-alloro-navy tracking-tight leading-none">
                    Operational Responsibilities
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-2">
                    Ownership • System vs. Human Execution
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="relative p-10 sm:p-12 border-b md:border-b-0 md:border-r border-slate-100 space-y-10 group bg-white hover:bg-slate-50/30 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-alloro-cobalt rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
                        <Cpu size={28} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-extrabold font-heading text-alloro-navy leading-none">
                          Handled by Alloro
                        </h3>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                          Autonomous Systems
                        </p>
                      </div>
                    </div>
                    {alloroOpportunities ? (
                      <div className="space-y-5">
                        {alloroOpportunities
                          .slice(0, 5)
                          .map((item: string, i: number) => (
                            <div
                              key={i}
                              className="flex items-start gap-4 animate-in fade-in slide-in-from-left duration-500"
                              style={{ animationDelay: `${i * 100}ms` }}
                            >
                              <div className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 shrink-0">
                                <CheckCircle2
                                  size={14}
                                  className="text-alloro-cobalt"
                                />
                              </div>
                              <span className="text-[15px] font-semibold text-slate-600 tracking-tight leading-snug">
                                {item.length > 50
                                  ? item.substring(0, 50) + "..."
                                  : item}
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <LoadingSkeleton className="h-6 w-full" />
                        <LoadingSkeleton className="h-6 w-4/5" />
                        <LoadingSkeleton className="h-6 w-full" />
                        <LoadingSkeleton className="h-6 w-3/4" />
                        <LoadingSkeleton className="h-6 w-4/5" />
                      </div>
                    )}
                  </div>

                  <div className="relative p-10 sm:p-12 space-y-10 group bg-white hover:bg-slate-50/30 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-alloro-navy rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/10 group-hover:scale-110 transition-transform">
                        <UserCheck size={28} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-extrabold font-heading text-alloro-navy leading-none">
                          Handled by Practice
                        </h3>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                          Human Clinical Excellence
                        </p>
                      </div>
                    </div>
                    {practiceActionPlan ? (
                      <div className="space-y-5">
                        {practiceActionPlan
                          .slice(0, 5)
                          .map((item: string, i: number) => (
                            <div
                              key={i}
                              className="flex items-start gap-4 animate-in fade-in slide-in-from-right duration-500"
                              style={{ animationDelay: `${i * 100}ms` }}
                            >
                              <div className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 border border-slate-200 shrink-0">
                                <CircleCheck
                                  size={14}
                                  className="text-alloro-navy"
                                />
                              </div>
                              <span className="text-[15px] font-semibold text-slate-600 tracking-tight leading-snug">
                                {item.length > 50
                                  ? item.substring(0, 50) + "..."
                                  : item}
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <LoadingSkeleton className="h-6 w-full" />
                        <LoadingSkeleton className="h-6 w-4/5" />
                        <LoadingSkeleton className="h-6 w-full" />
                        <LoadingSkeleton className="h-6 w-3/4" />
                        <LoadingSkeleton className="h-6 w-4/5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TOP 3 GROWTH FIXES */}
              {topFixes && estimatedRevenue ? (
                <section className="relative bg-alloro-navy rounded-2xl p-10 lg:p-16 text-white overflow-hidden shadow-2xl border-t border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-alloro-cobalt/20 to-transparent pointer-events-none opacity-40"></div>
                  <div className="absolute top-0 right-0 p-80 bg-alloro-cobalt/10 rounded-full -mr-40 -mt-40 blur-[150px] pointer-events-none opacity-50"></div>

                  <div className="relative z-10 space-y-14">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
                      <div className="space-y-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-alloro-cobalt/20 text-alloro-teal flex items-center justify-center border border-alloro-teal/20 backdrop-blur-md shadow-lg">
                            <Target size={24} />
                          </div>
                          <span className="text-[11px] font-extrabold uppercase tracking-[0.4em] text-alloro-teal leading-none">
                            AI Practice Roadmap
                          </span>
                        </div>
                        <h2 className="text-4xl lg:text-6xl font-extrabold font-heading tracking-tight leading-[0.95]">
                          Top 3 Fixes to Add{" "}
                          <span className="text-alloro-teal shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                            {formatCurrency(estimatedRevenue)}+
                          </span>
                        </h2>
                        <p className="text-blue-100/60 font-medium text-xl sm:text-2xl max-w-3xl leading-relaxed">
                          Verified production potential unlocked via algorithmic
                          leak analysis of current referral funnels.
                        </p>
                      </div>
                      <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 backdrop-blur-sm shadow-xl">
                        <Activity
                          size={22}
                          className="text-alloro-teal animate-pulse"
                        />
                        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-100/80 leading-none">
                          Real-time Performance Projection
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {topFixes.map((fix: string, idx: number) => (
                        <div
                          key={idx}
                          className="relative group perspective-1000"
                        >
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 h-full flex flex-col transition-all duration-500 hover:bg-white/10 hover:-translate-y-3 hover:shadow-2xl hover:border-alloro-teal/30 backdrop-blur-sm group">
                            <div className="flex items-center justify-between mb-10">
                              <div className="w-14 h-14 rounded-full bg-alloro-cobalt text-white flex items-center justify-center text-2xl font-extrabold shadow-[0_10px_20px_rgba(36,78,230,0.4)] group-hover:scale-110 transition-transform">
                                {idx + 1}
                              </div>
                              <ArrowRightCircle
                                size={28}
                                className="text-white/20 group-hover:text-alloro-teal transition-all group-hover:rotate-45"
                              />
                            </div>
                            <p className="text-[16px] font-normal text-blue-100/50 leading-relaxed tracking-tight flex-1">
                              {fix}
                            </p>
                            <div className="mt-10 pt-8 border-t border-white/10 flex items-center justify-between">
                              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-100/30">
                                Optimization Impact
                              </span>
                              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-alloro-teal">
                                Critical Priority
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ) : (
                <section className="relative bg-alloro-navy rounded-2xl p-10 lg:p-16 text-white overflow-hidden shadow-2xl border-t border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-alloro-cobalt/20 to-transparent pointer-events-none opacity-40"></div>
                  <div className="relative z-10 space-y-14">
                    <div className="space-y-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-alloro-cobalt/20 text-alloro-teal flex items-center justify-center border border-alloro-teal/20 backdrop-blur-md shadow-lg">
                          <Target size={24} />
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-[0.4em] text-alloro-teal leading-none">
                          AI Practice Roadmap
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div className="h-16 bg-white/10 rounded-xl animate-pulse"></div>
                        <div className="h-8 w-3/4 bg-white/10 rounded-lg animate-pulse"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[1, 2, 3].map((idx) => (
                        <div
                          key={idx}
                          className="bg-white/5 border border-white/10 rounded-2xl p-10 h-64 animate-pulse"
                        >
                          <div className="h-14 w-14 rounded-full bg-white/10 mb-10"></div>
                          <div className="space-y-3">
                            <div className="h-4 bg-white/10 rounded"></div>
                            <div className="h-4 w-4/5 bg-white/10 rounded"></div>
                            <div className="h-4 w-3/4 bg-white/10 rounded"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </section>

        {/* Footer Branding - matches newdesign */}
        <footer className="pt-32 pb-16 border-t border-slate-100/80 flex flex-col items-center gap-10 text-center">
          <div className="w-16 h-16 bg-alloro-navy text-white rounded-2xl flex items-center justify-center text-2xl font-extrabold shadow-2xl transition-transform hover:rotate-12 cursor-pointer">
            A
          </div>
          <div className="space-y-4 px-4">
            <p className="text-[11px] text-slate-400 font-extrabold tracking-[0.5em] uppercase leading-none">
              Alloro Practice Growth Engine • v2.5.0
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 text-[9px] font-semibold text-slate-300 uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2 group cursor-help">
                <ShieldCheck
                  size={14}
                  className="group-hover:text-green-500 transition-colors"
                />{" "}
                HIPAA COMPLIANT
              </span>
              <span className="flex items-center gap-2 group cursor-help">
                <Lock
                  size={14}
                  className="group-hover:text-alloro-cobalt transition-colors"
                />{" "}
                AES-256 SECURE
              </span>
              <span className="flex items-center gap-2 group cursor-help">
                <Activity
                  size={14}
                  className="group-hover:text-alloro-teal transition-colors"
                />{" "}
                CONTINUOUS SYNC
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
