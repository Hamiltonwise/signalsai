import React from "react";
import { TrendingUp, Brain, Lightbulb } from "lucide-react";
import { useClarity } from "../../hooks/useClarity";
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

interface DecisionProps {
  className?: string;
  selectedDomain: string;
}

export const Decision: React.FC<DecisionProps> = ({
  className = "",
  selectedDomain,
}) => {
  const { clarityData, isLoading, error } = useClarity();

  console.log("Decision component received selectedDomain:", selectedDomain);

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
    type: "sessions" | "bounceRate" | "deadClicks"
  ): "good" | "warning" | "critical" => {
    if (type === "sessions") {
      return value > 150 ? "good" : value > 75 ? "warning" : "critical";
    }
    if (type === "bounceRate") {
      return value < 0.06 ? "good" : value < 0.1 ? "warning" : "critical";
    }
    if (type === "deadClicks") {
      return value < 30 ? "good" : value < 80 ? "warning" : "critical";
    }
    return "good";
  };

  // Dynamic decision stage data with Clarity data
  const decisionData = {
    name: "Decision",
    icon: Brain,
    color: "text-green-600",
    bgGradient: "bg-gradient-to-br from-green-50 via-emerald-25 to-teal-50",
    borderGradient: "border-green-200/60",
    score: 78,
    trend: clarityData.trendScore,
    dataSource: "Microsoft Clarity",
    explainer: "When patients finalize their decision and take action to book",
    whyItMatters:
      "This is the critical conversion moment. User experience determines whether ready-to-book patients complete their appointment booking or abandon due to friction points and usability issues.",
    insight: isLoading
      ? "Loading user behavior data..."
      : error
      ? "Unable to load user behavior data at this time."
      : `Your site had ${formatNumber(
          clarityData.sessions.currMonth
        )} user sessions with ${(
          clarityData.bounceRate.currMonth * 100
        ).toFixed(1)}% bounce rate. ${
          clarityData.deadClicks.currMonth
        } dead clicks detected this month.`,
    action: "Fix conversion funnel dead clicks - can increase bookings by 35%",
    metrics: [
      {
        label: "User Sessions",
        value: isLoading ? "..." : formatNumber(clarityData.sessions.currMonth),
        prevValue: clarityData.sessions.prevMonth,
        status: isLoading
          ? ("good" as const)
          : getMetricStatus(clarityData.sessions.currMonth, "sessions"),
      },
      {
        label: "Bounce Rate",
        value: isLoading
          ? "..."
          : (clarityData.bounceRate.currMonth * 100).toFixed(1) + "%",
        prevValue: clarityData.bounceRate.prevMonth,
        status: isLoading
          ? ("good" as const)
          : getMetricStatus(clarityData.bounceRate.currMonth, "bounceRate"),
      },
      {
        label: "Dead Clicks",
        value: isLoading ? "..." : clarityData.deadClicks.currMonth.toString(),
        prevValue: clarityData.deadClicks.prevMonth,
        status: isLoading
          ? ("good" as const)
          : getMetricStatus(clarityData.deadClicks.currMonth, "deadClicks"),
      },
    ],
  };

  return (
    <div className={`${className}`}>
      <div
        className={`${decisionData.bgGradient} rounded-2xl border-2 ${decisionData.borderGradient} p-8 shadow-lg`}
      >
        {/* Stage Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div
                className={`w-16 h-16 rounded-xl ${getScoreGradient(
                  decisionData.score
                )} p-0.5 shadow-lg`}
              >
                <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                  <decisionData.icon
                    className={`w-8 h-8 ${decisionData.color}`}
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {decisionData.name}
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
                    : decisionData.dataSource}
                </p>
              </div>
            </div>
          </div>

          <Tooltip
            align="center"
            position="left"
            message={[
              "This is an aggregation of",
              "dead clicks (40%), bounce rate (35%), sessions (25%)",
            ]}
          >
            <div className="flex cursor-pointer items-center space-x-2">
              {!isLoading && (
                <>
                  {getTrendIcon(decisionData.trend)}
                  <span
                    className={`text-lg font-semibold ${
                      decisionData.trend > 0
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {decisionData.trend > 0 ? "+" : ""}
                    {decisionData.trend}%
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
              <span className="text-white text-lg font-bold">4</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-lg">
                {decisionData.explainer}
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {decisionData.whyItMatters}
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {decisionData.metrics.map((metric) => (
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
                    {metric.label === "Bounce Rate"
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
                {decisionData.insight}
              </p>
            </div>
          </div>
        </div>

        {/* Action Step - Optional, commented out like in other cards */}
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
                <p className="text-sm text-gray-700">{decisionData.action}</p>
              </div>
            </div>
            <button className="px-6 py-4 text-sm font-semibold text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 bg-gradient-to-r from-green-500 to-emerald-600">
              Add to Team Tasks
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
};
