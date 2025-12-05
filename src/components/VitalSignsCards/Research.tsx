import React from "react";
import { TrendingUp, Globe, Lightbulb } from "lucide-react";
import { useGA4 } from "../../hooks/useGA4";
import Tooltip from "../Tooltip";

// Helper functions from VitalSignsCard
function getScoreGradient(score: number) {
  if (score >= 85) return "bg-gradient-to-br from-emerald-500 to-green-600";
  if (score >= 70) return "bg-gradient-to-br from-blue-500 to-indigo-600";
  if (score >= 55) return "bg-gradient-to-br from-orange-500 to-red-500";
  return "bg-gradient-to-br from-red-500 to-pink-600";
}

function getMetricStatusStyle(status: string) {
  switch (status) {
    case "good":
      return "text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50";
    case "warning":
      return "text-orange-700 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50";
    case "critical":
      return "text-red-700 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50";
    default:
      return "text-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200/50";
  }
}

function getTrendIcon(trend: number) {
  return trend > 0 ? (
    <TrendingUp className="w-4 h-4 text-emerald-600" />
  ) : (
    <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
  );
}

interface ResearchProps {
  className?: string;
  selectedDomain: string;
}

export const Research: React.FC<ResearchProps> = ({
  className = "",
  selectedDomain,
}) => {
  const { ga4Data, isLoading, error } = useGA4();

  // selectedDomain is passed as prop - GA4Context automatically handles data fetching when domain changes
  console.log("Research component received selectedDomain:", selectedDomain);

  // Helper function to format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  // Helper function to determine metric status
  const getMetricStatus = (
    value: number,
    type: "users" | "engagement" | "conversions"
  ): "good" | "warning" | "critical" => {
    if (type === "users") {
      return value > 1000 ? "good" : "warning";
    }
    if (type === "engagement") {
      return value > 0.5 ? "good" : value > 0.3 ? "warning" : "critical";
    }
    if (type === "conversions") {
      return value > 50 ? "good" : "warning";
    }
    return "good";
  };

  // Use dynamic trend score from API
  const getTrendScore = () => {
    return isLoading ? 0 : ga4Data.trendScore;
  };

  // Dynamic research stage data with real GA4 data
  const researchData = {
    name: "Research",
    icon: Globe,
    color: "text-blue-600",
    bgGradient: "bg-gradient-to-br from-blue-50 via-cyan-25 to-sky-50",
    borderGradient: "border-blue-200/60",
    score: 75,
    trend: getTrendScore(),
    dataSource: "Google Analytics 4",
    explainer:
      "When patients explore your services and evaluate your expertise",
    whyItMatters:
      "This is where trust begins. Patients research your credentials, services, and approach. A strong research experience builds confidence and moves patients toward booking.",
    insight: isLoading
      ? "Loading website analytics data..."
      : error
      ? "Unable to load analytics data at this time."
      : `Your website had ${formatNumber(
          ga4Data.activeUsers.currMonth
        )} active users with ${(ga4Data.engagementRate.currMonth * 100).toFixed(
          1
        )}% engagement rate. ${
          ga4Data.conversions.currMonth
        } goal completions this month.`,
    action:
      "Add video testimonials to service pages - proven 40% engagement boost",
    metrics: [
      {
        label: "Active Users",
        value: isLoading ? "..." : formatNumber(ga4Data.activeUsers.currMonth),
        prevValue: ga4Data.activeUsers.prevMonth,
        status: isLoading
          ? ("good" as const)
          : getMetricStatus(ga4Data.activeUsers.currMonth, "users"),
      },
      {
        label: "Engagement Rate",
        value: isLoading
          ? "..."
          : (ga4Data.engagementRate.currMonth * 100).toFixed(1) + "%",
        prevValue: ga4Data.engagementRate.prevMonth,
        status: isLoading
          ? ("good" as const)
          : getMetricStatus(ga4Data.engagementRate.currMonth, "engagement"),
      },
      {
        label: "Conversions",
        value: isLoading ? "..." : ga4Data.conversions.currMonth.toString(),
        prevValue: ga4Data.conversions.prevMonth,
        status: isLoading
          ? ("good" as const)
          : getMetricStatus(ga4Data.conversions.currMonth, "conversions"),
      },
    ],
  };

  return (
    <div className={`${className}`}>
      <div
        className={`${researchData.bgGradient} rounded-xl border ${researchData.borderGradient} p-6`}
      >
        {/* Stage Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-lg ${getScoreGradient(
                researchData.score
              )} p-0.5`}
            >
              <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                <researchData.icon
                  className={`w-6 h-6 ${researchData.color}`}
                />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-normal text-gray-900">
                {researchData.name}
              </h3>
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isLoading
                      ? "bg-orange-400 animate-pulse"
                      : error
                      ? "bg-red-400"
                      : "bg-green-400"
                  }`}
                />
                <p className="text-sm text-gray-500">
                  {isLoading
                    ? "Loading data..."
                    : error
                    ? "Error loading data"
                    : researchData.dataSource}
                </p>
              </div>
            </div>
          </div>

          <Tooltip
            align="center"
            position="left"
            message={[
              "This is an aggregation of",
              "conversion (70%), engagement rate (20%), active users (10%)",
            ]}
          >
            <div className="flex cursor-pointer items-center gap-1.5">
              {!isLoading && (
                <>
                  {getTrendIcon(researchData.trend)}
                  <span
                    className={`text-sm font-medium ${
                      researchData.trend > 0
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {researchData.trend > 0 ? "+" : ""}
                    {researchData.trend}%
                  </span>
                </>
              )}
            </div>
          </Tooltip>
        </div>

        {/* Stage Explainer */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 mb-5 border border-white/50">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">2</span>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">
                {researchData.explainer}
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {researchData.whyItMatters}
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {researchData.metrics.map((metric) => (
            <div
              key={metric.label}
              className={`rounded-lg p-4 ${getMetricStatusStyle(
                metric.status
              )} transition-all duration-200 hover:scale-[1.02]`}
            >
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900 mb-1">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-600 mb-1">{metric.label}</div>
                {!isLoading && metric.prevValue !== undefined && (
                  <div className="text-xs text-gray-400">
                    {metric.label === "Engagement Rate"
                      ? (metric.prevValue * 100).toFixed(1) + "%"
                      : formatNumber(metric.prevValue)}{" "}
                    last month
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* AI Insight */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">AI Insight</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {researchData.insight}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
