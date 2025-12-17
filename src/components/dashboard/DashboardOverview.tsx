import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  ArrowRight,
  MapPin,
  Trophy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAgentData } from "../../hooks/useAgentData";
import { useAuth } from "../../hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { fetchPmsKeyData, type PmsKeyDataResponse } from "../../api/pms";
import { fetchClientTasks } from "../../api/tasks";
import type { ActionItem } from "../../types/tasks";
import { NotificationWidget } from "./NotificationWidget";
import { ReferralEngineDashboard } from "../ReferralEngineDashboard";

// Ranking data types (matching API response from /latest endpoint)
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

export function DashboardOverview({ googleAccountId }: DashboardOverviewProps) {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { data, loading, error, refetch } = useAgentData(
    googleAccountId || null
  );

  // PMS data state
  const [pmsData, setPmsData] = useState<PmsKeyDataResponse["data"] | null>(
    null
  );
  const [pmsLoading, setPmsLoading] = useState(true);
  const [pmsError, setPmsError] = useState<string | null>(null);

  // Tasks data state
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [allUserTasks, setAllUserTasks] = useState<ActionItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);

  // Ranking data state
  const [rankingData, setRankingData] = useState<RankingResult[] | null>(null);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [rankingError, setRankingError] = useState<string | null>(null);

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
        console.log("[DashboardOverview] Ranking API response:", result);
        if (result.success && result.rankings) {
          // Handle both array and single object
          const rankings = Array.isArray(result.rankings)
            ? result.rankings
            : [result.rankings];
          console.log("[DashboardOverview] Parsed rankings:", rankings);
          setRankingData(rankings);
        } else {
          console.log("[DashboardOverview] No rankings in response");
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
          // Combine ALLORO and USER tasks, filter for OPPORTUNITY agent type
          const allTasks = [...response.tasks.ALLORO, ...response.tasks.USER];
          const opportunityTasks = allTasks.filter(
            (task) => task.agent_type === "OPPORTUNITY"
          );
          setTasks(opportunityTasks);

          // Store all tasks for count calculation
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

  // Get ranking summary for display
  const getRankingSummary = () => {
    if (!rankingData || rankingData.length === 0) return null;

    const firstRanking = rankingData[0];
    const locationCount = rankingData.length;

    console.log("[DashboardOverview] First ranking:", firstRanking);

    return {
      score: Math.round(firstRanking.rankScore || 0),
      rank: firstRanking.rankPosition || 0,
      totalCompetitors: firstRanking.totalCompetitors || 0,
      locationName:
        firstRanking.gbpLocationName || firstRanking.domain || "Unknown",
      locationCount,
      updatedAt: firstRanking.createdAt,
    };
  };

  const rankingSummary = getRankingSummary();

  // Get the latest update date between PMS and ranking
  const getLatestUpdateDate = () => {
    const dates: Date[] = [];

    if (pmsData?.stats?.latestJobTimestamp) {
      dates.push(new Date(pmsData.stats.latestJobTimestamp));
    }

    if (rankingData && rankingData.length > 0 && rankingData[0].createdAt) {
      dates.push(new Date(rankingData[0].createdAt));
    }

    if (dates.length === 0) return null;

    const latestDate = dates.reduce((a, b) => (a > b ? a : b));
    return latestDate.toLocaleDateString();
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-slate-200 rounded-xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-6">
              <div className="h-24 bg-slate-200 rounded-xl"></div>
              <div className="h-48 bg-slate-200 rounded-xl"></div>
            </div>
            <div className="lg:col-span-7 h-72 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="h-64 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-alloro-navy font-heading mb-2">
          Failed to Load Data
        </h3>
        <p className="text-slate-600 mb-6">{error}</p>
        <button
          onClick={refetch}
          className="px-6 py-2.5 bg-alloro-cobalt text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto font-bold text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // Extract agent data with type guards
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prooflineData = data?.agents?.proofline?.results?.[0] as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summaryData = data?.agents?.summary?.results?.[0] as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opportunityData = data?.agents?.opportunity?.results?.[0] as any;

  // Format time ago
  const formatTimeAgo = (dateString: string | undefined) => {
    if (!dateString) return "Unknown";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading text-alloro-navy tracking-tight">
              Hi Dr. {userProfile?.lastName || "Smith"}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              System Operational • Your practice runs itself.
            </p>
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-bold text-alloro-navy hover:text-alloro-cobalt transition-all bg-white border border-slate-200 hover:border-alloro-cobalt/30 shadow-sm hover:shadow active:scale-95 px-4 py-2 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Top Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Status & Insights (Span 4) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Notification Widget Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <NotificationWidget googleAccountId={googleAccountId ?? null} />
          </div>

          {/* Featured Insight Card */}
          <div className="bg-gradient-to-br from-alloro-cobalt to-[#1a3dbf] rounded-xl p-6 shadow-lg shadow-blue-900/20 text-white relative overflow-hidden group flex-1">
            <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/10 transition-colors"></div>

            {prooflineData ? (
              <>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3 opacity-90">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest border border-white/20 px-2 py-0.5 rounded-full">
                        Fresh Insight
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold font-heading tracking-tight mb-2">
                    {prooflineData.title}
                  </h3>
                  <p className="text-blue-100 text-sm leading-relaxed opacity-90">
                    {prooflineData.explanation}
                  </p>
                </div>

                <div className="relative z-10 flex items-center justify-between text-xs font-medium text-blue-200 border-t border-white/10 pt-4 mt-4">
                  <span>
                    Updated{" "}
                    {formatTimeAgo(data?.agents?.proofline?.lastUpdated)}
                  </span>
                </div>
              </>
            ) : (
              <div className="relative z-10 text-center py-4">
                <p className="text-blue-100 opacity-90">
                  No proofline data available yet.
                </p>
                <p className="text-xs text-blue-200 mt-2 opacity-70">
                  Data will appear after the first agent run completes.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Practice Performance (Span 7) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col">
          <div className="p-6 flex-1">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-alloro-navy font-heading tracking-tight">
                  Practice Performance
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Live from PMS • {pmsMetrics?.month || "Current Month"}
                </p>
              </div>
              <div className="flex gap-2">
                <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] uppercase font-bold tracking-wide rounded-md border border-green-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>{" "}
                  Live
                </span>
              </div>
            </div>

            {pmsLoading || rankingLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-alloro-cobalt mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  Loading practice data...
                </p>
              </div>
            ) : pmsError && rankingError ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-600 mb-1">Failed to load data</p>
                <p className="text-xs text-slate-500">
                  {pmsError || rankingError}
                </p>
              </div>
            ) : pmsMetrics || rankingSummary ? (
              <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-4 gap-4 divide-x divide-slate-100">
                  {pmsMetrics && (
                    <>
                      <div className="p-4">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Total Referrals
                        </div>
                        <div className="text-2xl font-bold font-heading tabular-nums tracking-tight text-alloro-navy">
                          {pmsMetrics.totalReferrals.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 mt-1.5">
                          {pmsMetrics.referralChange !== 0 && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                                pmsMetrics.referralChange >= 0
                                  ? "text-green-700 bg-green-50"
                                  : "text-red-700 bg-red-50"
                              }`}
                            >
                              {pmsMetrics.referralChange >= 0 ? "+" : ""}
                              {pmsMetrics.referralChange.toFixed(0)}%
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 ml-1">
                            vs last mo
                          </span>
                        </div>
                      </div>
                      <div className="p-4 bg-alloro-cobalt/5 rounded-lg">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Self Referrals
                        </div>
                        <div className="text-2xl font-bold font-heading tabular-nums tracking-tight text-alloro-cobalt">
                          {pmsMetrics.selfReferrals.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 mt-1.5">
                          {pmsMetrics.selfReferralChange !== 0 && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                                pmsMetrics.selfReferralChange >= 0
                                  ? "text-green-700 bg-green-50"
                                  : "text-red-700 bg-red-50"
                              }`}
                            >
                              {pmsMetrics.selfReferralChange >= 0 ? "+" : ""}
                              {pmsMetrics.selfReferralChange.toFixed(0)}%
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 ml-1">
                            vs last mo
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Production
                        </div>
                        <div className="text-2xl font-bold font-heading tabular-nums tracking-tight text-alloro-navy">
                          ${(pmsMetrics.production / 1000).toFixed(0)}K
                        </div>
                        <div className="flex items-center gap-1 mt-1.5">
                          {pmsMetrics.productionChange !== 0 && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                                pmsMetrics.productionChange >= 0
                                  ? "text-green-700 bg-green-50"
                                  : "text-red-700 bg-red-50"
                              }`}
                            >
                              {pmsMetrics.productionChange >= 0 ? "+" : ""}
                              {pmsMetrics.productionChange.toFixed(0)}%
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 ml-1">
                            vs last mo
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Doc Referrals
                        </div>
                        <div className="text-2xl font-bold font-heading tabular-nums tracking-tight text-alloro-navy">
                          {pmsMetrics.doctorReferrals.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 mt-1.5">
                          {pmsMetrics.doctorReferralChange !== 0 ? (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                                pmsMetrics.doctorReferralChange >= 0
                                  ? "text-green-700 bg-green-50"
                                  : "text-red-700 bg-red-50"
                              }`}
                            >
                              {pmsMetrics.doctorReferralChange >= 0 ? "+" : ""}
                              {pmsMetrics.doctorReferralChange.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              Stable
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Ranking Summary */}
                {rankingSummary && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span className="text-xl font-bold font-heading text-alloro-navy">
                            #{rankingSummary.rank}
                          </span>
                          <span className="text-sm text-slate-500">
                            of {rankingSummary.totalCompetitors}
                          </span>
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                          <span className="text-lg font-bold text-alloro-navy">
                            {rankingSummary.score}
                          </span>
                          <span className="text-xs text-slate-500 ml-1">
                            score
                          </span>
                        </div>
                      </div>
                      {rankingSummary.locationCount > 1 ? (
                        <button
                          onClick={() => navigate("/rankings")}
                          className="flex items-center gap-1 text-xs text-alloro-cobalt hover:text-blue-700 font-medium"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>
                            {rankingSummary.locationCount} locations ranked
                          </span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {rankingSummary.locationName}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500">
                  No practice data available yet.
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  Upload PMS data or run ranking analysis to see your practice
                  metrics.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50/50 px-6 py-3 border-t border-slate-200 flex justify-between items-center">
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              {getLatestUpdateDate()
                ? `Updated ${getLatestUpdateDate()}`
                : "Data available"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/pmsStatistics")}
                className="text-alloro-cobalt hover:text-blue-700 text-xs font-bold flex items-center gap-1 transition-colors uppercase tracking-wide"
              >
                Full Report <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Summary Section */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h2 className="text-lg font-bold text-alloro-navy font-heading tracking-tight">
              Monthly Snapshot
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-alloro-teal bg-cyan-50 px-2 py-1 rounded border border-cyan-100">
              AI Analysis
            </span>
            <span className="text-xs text-slate-400 tabular-nums">
              {formatTimeAgo(data?.agents?.summary?.lastUpdated)}
            </span>
          </div>
        </div>

        {summaryData || opportunityData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Wins */}
            <div className="p-8 hover:bg-green-50/10 transition-colors">
              <h4 className="flex items-center gap-2 text-sm font-bold text-alloro-navy mb-5 uppercase tracking-wider">
                <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <ArrowUpRight size={14} />
                </span>
                Wins
              </h4>
              {summaryData?.wins && summaryData.wins.length > 0 ? (
                <ul className="space-y-4">
                  {summaryData.wins.map((win: string, index: number) => (
                    <li key={index} className="flex gap-3 items-start group">
                      <div className="mt-1.5 w-1 h-1 rounded-full bg-green-400 group-hover:scale-150 transition-transform"></div>
                      <span className="text-sm text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">
                        {win}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">
                  No wins data available yet.
                </p>
              )}
            </div>

            {/* Risks */}
            <div className="p-8 hover:bg-orange-50/10 transition-colors">
              <h4 className="flex items-center gap-2 text-sm font-bold text-alloro-navy mb-5 uppercase tracking-wider">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <AlertCircle size={14} />
                </span>
                Risks
              </h4>
              {summaryData?.risks && summaryData.risks.length > 0 ? (
                <ul className="space-y-4">
                  {summaryData.risks.map((risk: string, index: number) => (
                    <li key={index} className="flex gap-3 items-start group">
                      <div className="mt-1.5 w-1 h-1 rounded-full bg-orange-400 group-hover:scale-150 transition-transform"></div>
                      <span className="text-sm text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">
                        {risk}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No risks identified.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 px-8">
            <p className="text-slate-500">No summary data available yet.</p>
            <p className="text-sm text-slate-400 mt-2">
              Monthly summaries will appear after the first monthly agent run.
            </p>
          </div>
        )}
      </section>

      {/* Next Steps Section - Tasks */}
      {(tasks.length > 0 || tasksLoading || tasksError) && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <div>
              <h2 className="text-lg font-bold text-alloro-navy font-heading tracking-tight">
                Next Steps
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Action items from your opportunity analysis
              </p>
            </div>
            {allUserTasks.length > 0 && (
              <button
                onClick={() => navigate("/tasks")}
                className="text-alloro-cobalt hover:text-blue-700 text-xs font-bold flex items-center gap-1 transition-colors uppercase tracking-wide"
              >
                View All ({allUserTasks.length}) <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div className="p-6">
            {tasksLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-alloro-cobalt mx-auto mb-2" />
                <p className="text-sm text-slate-500">Loading tasks...</p>
              </div>
            ) : tasksError ? (
              <div className="text-center py-8">
                <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-600">{tasksError}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  // Parse metadata to get urgency
                  let urgency = "Normal";
                  try {
                    const metadata =
                      typeof task.metadata === "string"
                        ? JSON.parse(task.metadata)
                        : task.metadata;
                    urgency = metadata?.urgency || "Normal";
                  } catch {
                    // If parsing fails, use default
                  }

                  return (
                    <div
                      key={task.id}
                      className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-colors group cursor-pointer"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          urgency === "Immediate"
                            ? "bg-red-100 text-red-600 border border-red-200"
                            : "bg-alloro-cobalt/10 text-alloro-cobalt border border-alloro-cobalt/20"
                        }`}
                      >
                        <ArrowRight size={14} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-alloro-navy group-hover:text-alloro-cobalt transition-colors">
                            {task.title}
                          </p>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                              urgency === "Immediate"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {urgency}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          Category: {task.category}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Referral Engine Dashboard Content - Without Heading */}
      <div className="mt-8">
        <ReferralEngineDashboard
          googleAccountId={googleAccountId}
          hideHeader={true}
        />
      </div>
    </div>
  );
}
