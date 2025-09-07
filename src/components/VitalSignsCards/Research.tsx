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

  // Calculate trend from GA4 data
  const calculateTrend = () => {
    if (isLoading || ga4Data.activeUsers.prevMonth === 0) return 0;
    return Math.round(
      ((ga4Data.activeUsers.currMonth - ga4Data.activeUsers.prevMonth) /
        ga4Data.activeUsers.prevMonth) *
        100
    );
  };

  // Dynamic research stage data with real GA4 data
  const researchData = {
    name: "Research",
    icon: Globe,
    color: "text-blue-600",
    bgGradient: "bg-gradient-to-br from-blue-50 via-cyan-25 to-sky-50",
    borderGradient: "border-blue-200/60",
    score: 75,
    trend: calculateTrend(),
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
        className={`${researchData.bgGradient} rounded-2xl border-2 ${researchData.borderGradient} p-8 shadow-lg`}
      >
        {/* Stage Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div
                className={`w-16 h-16 rounded-xl ${getScoreGradient(
                  researchData.score
                )} p-0.5 shadow-lg`}
              >
                <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                  <researchData.icon
                    className={`w-8 h-8 ${researchData.color}`}
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {researchData.name}
              </h3>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isLoading
                      ? "bg-orange-400 animate-pulse"
                      : error
                      ? "bg-red-400"
                      : "bg-green-400"
                  }`}
                />
                <p className="text-sm font-medium text-gray-600">
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
            message={[
              "This is an aggregation of",
              "users (40%), engagement (35%), conversions (25%)",
            ]}
          >
            <div className="flex cursor-pointer items-center space-x-2">
              {!isLoading && (
                <>
                  {getTrendIcon(researchData.trend)}
                  <span
                    className={`text-lg font-semibold ${
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
        <div className="bg-gradient-to-r from-white/90 to-gray-50/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/60 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white text-lg font-bold">2</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-lg">
                {researchData.explainer}
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {researchData.whyItMatters}
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {researchData.metrics.map((metric) => (
            <div
              key={metric.label}
              className={`rounded-xl p-5 ${getMetricStatusStyle(
                metric.status
              )} transform hover:scale-105 transition-transform duration-200`}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {metric.value}
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  {metric.label}
                </div>
                {!isLoading && metric.prevValue !== undefined && (
                  <div className="text-xs text-gray-500 italic">
                    (
                    {metric.label === "Engagement Rate"
                      ? (metric.prevValue * 100).toFixed(1) + "%"
                      : formatNumber(metric.prevValue)}{" "}
                    last month)
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* AI Insight */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/50 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-lg">
                AI Insight
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {researchData.insight}
              </p>
            </div>
          </div>
        </div>

        {/* Action Step - Optional, commented out like in Awareness */}
        {/* <div className="bg-gradient-to-r from-white to-gray-50/50 rounded-xl p-6 border border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                  Recommended Action
                </h4>
                <p className="text-sm text-gray-700">{researchData.action}</p>
              </div>
            </div>
            <button className="px-6 py-4 text-sm font-semibold text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 bg-gradient-to-r from-blue-500 to-indigo-600">
              Add to Team Tasks
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
};
