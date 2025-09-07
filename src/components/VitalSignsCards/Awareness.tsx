import React from "react";
import { TrendingUp, Search, Lightbulb } from "lucide-react";
import { useGSC } from "../../hooks/useGSC";
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

interface AwarenessProps {
  className?: string;
  selectedDomain: string;
}

export const Awareness: React.FC<AwarenessProps> = ({ className = "" }) => {
  const { gscData, isLoading, error } = useGSC();

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
    type: "impressions" | "position" | "clicks"
  ): "good" | "warning" | "critical" => {
    if (type === "impressions") {
      return value > 1000 ? "good" : "warning";
    }
    if (type === "position") {
      return value < 5 ? "good" : value < 10 ? "warning" : "critical";
    }
    if (type === "clicks") {
      return value > 50 ? "good" : "warning";
    }
    return "good";
  };

  // Dynamic awareness stage data
  const awarenessData = {
    name: "Awareness",
    icon: Search,
    color: "text-purple-600",
    bgGradient: "bg-gradient-to-br from-purple-50 via-purple-25 to-indigo-50",
    borderGradient: "border-purple-200/60",
    score: 82,
    trend: gscData.trendScore,
    dataSource: "Google Search Console",
    explainer:
      "The first moment potential patients discover your practice exists",
    whyItMatters:
      "Without visibility, even the best dental practice remains unknown. This stage determines your practice's discoverability when patients search for dental care in your area.",
    insight: isLoading
      ? "Loading search performance data..."
      : error
      ? "Unable to load search data at this time."
      : `Your practice has ${formatNumber(
          gscData.impressions.currMonth
        )} search impressions with ${formatNumber(
          gscData.clicks.currMonth
        )} clicks. Average position: ${gscData.avgPosition.currMonth.toFixed(
          1
        )}.`,
    action:
      'Target "emergency dentist" keywords - 340% higher conversion potential',
    metrics: [
      {
        label: "Search Impressions",
        value: isLoading ? "..." : formatNumber(gscData.impressions.currMonth),
        prevValue: gscData.impressions.prevMonth,
        status: isLoading
          ? ("good" as const)
          : getMetricStatus(gscData.impressions.currMonth, "impressions"),
      },
      {
        label: "Avg. Position",
        value: isLoading ? "..." : gscData.avgPosition.currMonth.toFixed(1),
        prevValue: gscData.avgPosition.prevMonth,
        status: isLoading
          ? ("good" as const)
          : getMetricStatus(gscData.avgPosition.currMonth, "position"),
      },
      {
        label: "Total Clicks",
        value: isLoading ? "..." : formatNumber(gscData.clicks.currMonth),
        prevValue: gscData.clicks.prevMonth,
        status: isLoading
          ? ("good" as const)
          : getMetricStatus(gscData.clicks.currMonth, "clicks"),
      },
    ],
  };

  return (
    <div className={`${className}`}>
      <div
        className={`${awarenessData.bgGradient} rounded-2xl border-2 ${awarenessData.borderGradient} p-8 shadow-lg`}
      >
        {/* Stage Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div
                className={`w-16 h-16 rounded-xl ${getScoreGradient(
                  awarenessData.score
                )} p-0.5 shadow-lg`}
              >
                <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                  <awarenessData.icon
                    className={`w-8 h-8 ${awarenessData.color}`}
                  />
                </div>
              </div>
              {/* <div className="absolute -top-2 -right-2 bg-white rounded-lg px-2 py-1 shadow-md border border-gray-200/50">
                <span
                  className={`text-sm font-bold ${getScoreColor(
                    awarenessData.score
                  )}`}
                >
                  {awarenessData.score}
                </span>
              </div> */}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {awarenessData.name}
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
                    : awarenessData.dataSource}
                </p>
              </div>
            </div>
          </div>

          <Tooltip
            align="center"
            message={[
              "This is an aggregation of",
              "clicks (40%), impressions (35%), position (25%)",
            ]}
          >
            <div className="flex cursor-pointer items-center space-x-2">
              {!isLoading && (
                <>
                  {getTrendIcon(awarenessData.trend)}
                  <span
                    className={`text-lg font-semibold ${
                      awarenessData.trend > 0
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {awarenessData.trend > 0 ? "+" : ""}
                    {awarenessData.trend}%
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
              <span className="text-white text-lg font-bold">1</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-lg">
                {awarenessData.explainer}
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {awarenessData.whyItMatters}
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {awarenessData.metrics.map((metric) => (
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
                    {metric.label === "Avg. Position"
                      ? metric.prevValue.toFixed(1)
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
                {awarenessData.insight}
              </p>
            </div>
          </div>
        </div>

        {/* Action Step */}
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
                <p className="text-sm text-gray-700">{awarenessData.action}</p>
              </div>
            </div>
            <button className="px-6 py-4 text-sm font-semibold text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 bg-gradient-to-r from-purple-500 to-indigo-600">
              Add to Team Tasks
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
};
