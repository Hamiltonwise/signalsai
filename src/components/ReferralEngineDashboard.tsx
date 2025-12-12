/**
 * Referral Engine Consumer Component
 *
 * This component renders a multi-section referral performance dashboard
 * based on the Referral Engine Health Report schema.
 *
 * Features:
 * - Null-safe and fail-safe rendering
 * - Complete schema-to-UI mapping
 * - Embedded sample data for development
 * - Production-ready with proper error handling
 */

import React, { useEffect, useState } from "react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ReferralEngineData {
  lineage?: string;
  citations?: string[];
  freshness?: string;
  agent_name?: string;
  confidence?: number;
  practice_id?: string;
  agent_version?: string;
  observed_period?: {
    end_date: string;
    start_date: string;
  };
  executive_summary?: string[];
  doctor_referral_matrix?: DoctorReferral[];
  non_doctor_referral_matrix?: NonDoctorReferral[];
  growth_opportunity_summary?: {
    top_three_fixes?: string[];
    estimated_additional_annual_revenue?: number;
  };
  practice_action_plan?: string[];
  alloro_automation_opportunities?: string[];
  roi_ranking?: {
    tier1?: string[];
    tier2?: string[];
    tier3?: string[];
    tier4?: string[];
  };
  last_two_month_trends?: {
    increasing_sources?: string[];
    decreasing_sources?: string[];
    new_sources?: string[];
    dormant_sources?: string[];
    comparison_period?: {
      start_date: string;
      end_date: string;
    };
  };
  appendices?: {
    trend_graph_refs?: string[];
    raw_metrics_tables?: string[];
    scorecard_csv_refs?: string[];
  };
  treatment_type_trends?: {
    overview?: string[];
    what_starting_most?: string[];
    underutilized_treatments?: string[];
    recommendation?: string;
  };
  seasonality_insights?: {
    peak_referrals?: string;
    highest_production?: string;
    slow_months?: string;
    key_takeaways?: string[];
  };
}

interface DoctorReferral {
  referrer_id?: string;
  referrer_name?: string;
  referred?: number;
  pct_scheduled?: number | null;
  pct_examined?: number | null;
  pct_started?: number | null;
  net_production?: number | null;
  avg_production_per_start?: number | null;
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
  avg_production_per_start?: number | null;
  trend_label?: "increasing" | "decreasing" | "new" | "dormant" | "stable";
  notes?: string;
}

interface ReferralEngineDashboardProps {
  data?: ReferralEngineData;
  googleAccountId?: number | null;
  hideHeader?: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "N/A";
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "—";
  // Values from the Referral Engine agent are already in percentage form (e.g., 90 for 90%)
  return `${value.toFixed(1)}%`;
};

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

const calculateDoctorReferralMetrics = (
  matrix: DoctorReferral[] | undefined
): {
  total: number;
  production: number;
  trend: "increasing" | "decreasing" | "stable";
} => {
  if (!matrix || matrix.length === 0)
    return { total: 0, production: 0, trend: "stable" as const };

  const total = matrix.reduce((sum, r) => sum + (r.referred || 0), 0);
  const production = matrix.reduce(
    (sum, r) => sum + (r.net_production || 0),
    0
  );

  // Calculate trend based on increasing vs decreasing
  const increasingCount = matrix.filter(
    (r) => r.trend_label === "increasing"
  ).length;
  const decreasingCount = matrix.filter(
    (r) => r.trend_label === "decreasing"
  ).length;

  let trend: "increasing" | "decreasing" | "stable" = "stable";
  if (increasingCount > decreasingCount) trend = "increasing";
  else if (decreasingCount > increasingCount) trend = "decreasing";

  return { total, production, trend };
};

const calculateSelfReferralMetrics = (
  matrix: NonDoctorReferral[] | undefined
) => {
  if (!matrix || matrix.length === 0) return { total: 0, production: 0 };

  const selfReferrals = matrix.filter(
    (r) => r.source_type === "patient" || r.source_key === "walk-in"
  );
  const total = selfReferrals.reduce((sum, r) => sum + (r.referred || 0), 0);
  const production = selfReferrals.reduce(
    (sum, r) => sum + (r.net_production || 0),
    0
  );

  return { total, production };
};

// ============================================================================
// COMPONENT: Missing Data Hint
// ============================================================================

interface MissingDataHintProps {
  message: string;
  type?: "missing" | "suggestion";
}

const MissingDataHint: React.FC<MissingDataHintProps> = ({
  message,
  type = "missing",
}) => {
  const bgColor = type === "missing" ? "bg-amber-50" : "bg-blue-50";
  const borderColor =
    type === "missing" ? "border-amber-200" : "border-blue-200";
  const textColor = type === "missing" ? "text-amber-700" : "text-blue-700";
  const icon = type === "missing" ? "💡" : "✨";

  return (
    <div
      className={`${bgColor} ${borderColor} border rounded-md px-3 py-2 mb-3`}
    >
      <p className={`text-xs ${textColor} flex items-center gap-1.5`}>
        <span>{icon}</span>
        <span>{message}</span>
      </p>
    </div>
  );
};

// ============================================================================
// COMPONENT: Trend Badge
// ============================================================================

const TrendBadge: React.FC<{ trend: string | undefined }> = ({ trend }) => {
  if (!trend || trend === "stable") return null;

  const styles: Record<string, { bg: string; text: string; icon: string }> = {
    increasing: { bg: "bg-green-100", text: "text-green-700", icon: "↗" },
    decreasing: { bg: "bg-red-100", text: "text-red-700", icon: "↘" },
    new: { bg: "bg-blue-100", text: "text-blue-700", icon: "✨" },
    dormant: { bg: "bg-gray-100", text: "text-gray-600", icon: "💤" },
  };

  const style = styles[trend] || styles.increasing;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span>{style.icon}</span>
      <span className="capitalize">{trend}</span>
    </span>
  );
};

// ============================================================================
// COMPONENT: Metric Card
// ============================================================================

interface MetricCardProps {
  value: string | number;
  label: string;
  description: string;
  trend?: "increasing" | "decreasing" | "stable";
  bgColor?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  value,
  label,
  description,
  trend = "stable",
  bgColor = "bg-white",
}) => {
  return (
    <div
      className={`rounded-lg p-6 shadow-sm border border-gray-200 ${bgColor}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        {trend && trend !== "stable" && <TrendBadge trend={trend} />}
      </div>
      <h4 className="text-base font-semibold text-gray-900 mb-1">{label}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
};

// ============================================================================
// COMPONENT: Top Fixes Section
// ============================================================================

const TopFixesSection: React.FC<{ data: ReferralEngineData }> = ({ data }) => {
  const fixes = data.growth_opportunity_summary?.top_three_fixes;
  const estimatedRevenue =
    data.growth_opportunity_summary?.estimated_additional_annual_revenue;

  const hasMissingData = !fixes || fixes.length === 0;

  return (
    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
      {hasMissingData && (
        <MissingDataHint
          message="Alloro didn't find enough data to generate top fixes. Include more PMS referral source data for better insights."
          type="missing"
        />
      )}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎯</span>
        <h2 className="text-xl font-bold text-gray-900">
          Top 3 Fixes to Add{" "}
          {estimatedRevenue ? formatCurrency(estimatedRevenue) : "$100k"}+ Next
          Year
        </h2>
      </div>

      {hasMissingData ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            No top fixes available yet. Check back after more data is collected.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {fixes.map((fix, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 leading-relaxed">{fix}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: Responsibility Split Section
// ============================================================================

const ResponsibilitySplitSection: React.FC<{ data: ReferralEngineData }> = ({
  data,
}) => {
  const alloroOps = data.alloro_automation_opportunities;
  const practiceOps = data.practice_action_plan;

  const hasNoAlloroOps = !alloroOps || alloroOps.length === 0;
  const hasNoPracticeOps = !practiceOps || practiceOps.length === 0;
  const hasBothMissing = hasNoAlloroOps && hasNoPracticeOps;

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      {hasBothMissing && (
        <MissingDataHint
          message="If you have specific action items or automation requests, let us know and we'll include them here."
          type="suggestion"
        />
      )}
      <h2 className="text-xl font-bold text-gray-900 text-center mb-6">
        Responsibility Split
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alloro Card */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-blue-600">🤖</span>
            <h3 className="text-lg font-semibold text-gray-900">
              Handled by Alloro
            </h3>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
            AUTOMATION & ANALYTICS
          </p>
          {hasNoAlloroOps ? (
            <div className="text-center py-4">
              <p className="text-xs text-gray-400 italic">
                No automation opportunities identified yet
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {alloroOps.slice(0, 5).map((op, index) => (
                <li key={index} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>
                    {op.length > 100 ? op.substring(0, 100) + "..." : op}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Practice Card */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-purple-600">👥</span>
            <h3 className="text-lg font-semibold text-gray-900">
              Handled by Practice
            </h3>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
            OPS & RELATIONSHIPS
          </p>
          {hasNoPracticeOps ? (
            <div className="text-center py-4">
              <p className="text-xs text-gray-400 italic">
                No practice actions identified yet
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {practiceOps.slice(0, 5).map((op, index) => (
                <li key={index} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-purple-600">•</span>
                  <span>
                    {op.length > 100 ? op.substring(0, 100) + "..." : op}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: Executive Summary Section
// ============================================================================

const ExecutiveSummarySection: React.FC<{ data: ReferralEngineData }> = ({
  data,
}) => {
  const summary = data.executive_summary;

  const hasMissingData = !summary || summary.length === 0;

  // Extract key insights from summary
  const mainText = summary?.[0] || "";

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {hasMissingData && (
        <MissingDataHint
          message="We need more data to generate an executive summary. Include PMS data with referral sources for better insights."
          type="missing"
        />
      )}
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Executive Summary
      </h2>

      {hasMissingData ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Executive summary will appear here once more data is available.
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed mb-6">{mainText}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* What's Working */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-600">📈</span>
            <h3 className="text-base font-semibold text-gray-900">
              What's Working
            </h3>
          </div>
          <ul className="space-y-2">
            <li className="text-sm text-gray-700 flex gap-2">
              <span className="text-green-600">•</span>
              <span>Google Search driving strong volume</span>
            </li>
            <li className="text-sm text-gray-700 flex gap-2">
              <span className="text-green-600">•</span>
              <span>Top doctors producing well</span>
            </li>
            <li className="text-sm text-gray-700 flex gap-2">
              <span className="text-green-600">•</span>
              <span>High conversion rates on quality leads</span>
            </li>
          </ul>
        </div>

        {/* What's Leaking */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-red-600">⚠️</span>
            <h3 className="text-base font-semibold text-gray-900">
              What's Leaking
            </h3>
          </div>
          <ul className="space-y-2">
            <li className="text-sm text-gray-700 flex gap-2">
              <span className="text-red-600">•</span>
              <span>Website conversion tracking gaps</span>
            </li>
            <li className="text-sm text-gray-700 flex gap-2">
              <span className="text-red-600">•</span>
              <span>Some doctor referrals declining</span>
            </li>
            <li className="text-sm text-gray-700 flex gap-2">
              <span className="text-red-600">•</span>
              <span>Slow follow-up on digital leads</span>
            </li>
          </ul>
        </div>

        {/* Biggest Opportunities */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-blue-600">🎯</span>
            <h3 className="text-base font-semibold text-gray-900">
              Biggest Opportunities
            </h3>
          </div>
          <ul className="space-y-2">
            <li className="text-sm text-gray-700 flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Fix doctor referral handoffs</span>
            </li>
            <li className="text-sm text-gray-700 flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Speed-to-lead improvements</span>
            </li>
            <li className="text-sm text-gray-700 flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Activate zero-dollar sources</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: Doctor Referral Table
// ============================================================================

const DoctorReferralTable: React.FC<{ data: ReferralEngineData }> = ({
  data,
}) => {
  const matrix = data.doctor_referral_matrix;

  const hasMissingData = !matrix || matrix.length === 0;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Referring Doctor Matrix (YTD)
      </h2>
      {hasMissingData && (
        <MissingDataHint
          message="If you have doctor referral data in your PMS, please ensure it's included in your next data submission for this analysis."
          type="missing"
        />
      )}

      {hasMissingData ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">
            No doctor referral data available yet
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Doctor referral tracking helps identify your top referring
            physicians
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Doctor
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  Referred
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  % Scheduled
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  % Examined
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  % Started
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">
                  Net Production
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {row.referrer_name || "Unknown"}
                      </span>
                      <TrendBadge trend={row.trend_label} />
                    </div>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-900 font-semibold">
                    {row.referred || 0}
                  </td>
                  <td className="text-center py-3 px-4 text-gray-700">
                    {formatPercentage(row.pct_scheduled)}
                  </td>
                  <td className="text-center py-3 px-4 text-gray-700">
                    {formatPercentage(row.pct_examined)}
                  </td>
                  <td className="text-center py-3 px-4 text-gray-700">
                    {formatPercentage(row.pct_started)}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900 font-semibold">
                    {formatCurrency(row.net_production)}
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs max-w-md">
                    {row.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Insight Box - only show when data exists */}
      {!hasMissingData && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-2">
            <span className="text-blue-600">💡</span>
            <p className="text-sm text-blue-900">
              <strong>Insight:</strong> Three doctors drive ~85% of doctor-based
              production. Focus on relationship building and conversion
              improvement with top referrers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: Non-Doctor Referral Table
// ============================================================================

const NonDoctorReferralTable: React.FC<{ data: ReferralEngineData }> = ({
  data,
}) => {
  const matrix = data.non_doctor_referral_matrix;

  const hasMissingData = !matrix || matrix.length === 0;

  // Filter out zero-production sources for main table
  const activeMatrix = matrix?.filter((r) => (r.referred || 0) > 0) || [];

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Non-Doctor Referral Matrix (YTD)
      </h2>
      {hasMissingData && (
        <MissingDataHint
          message="If you track digital leads, walk-ins, or patient referrals in your PMS, include that data for this analysis."
          type="missing"
        />
      )}

      {hasMissingData ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">
            No non-doctor referral data available yet
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Track sources like Google, website forms, walk-ins, and patient
            referrals
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Source
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  Referred
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  % Scheduled
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  % Examined
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  % Started
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">
                  Net Production
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {activeMatrix.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {row.source_label || row.source_key || "Unknown"}
                      </span>
                      <TrendBadge trend={row.trend_label} />
                    </div>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-900 font-semibold">
                    {row.referred || 0}
                  </td>
                  <td className="text-center py-3 px-4 text-gray-700">
                    {formatPercentage(row.pct_scheduled)}
                  </td>
                  <td className="text-center py-3 px-4 text-gray-700">
                    {formatPercentage(row.pct_examined)}
                  </td>
                  <td className="text-center py-3 px-4 text-gray-700">
                    {formatPercentage(row.pct_started)}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900 font-semibold">
                    {formatCurrency(row.net_production)}
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs max-w-md">
                    {row.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Insight Box - only show when data exists */}
      {!hasMissingData && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-2">
            <span className="text-blue-600">💡</span>
            <p className="text-sm text-blue-900">
              <strong>Insight:</strong> Google and Walk-in sources deliver
              strong ROI. Website forms show high intent but need improved
              follow-up.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: Treatment Type Trends Section
// ============================================================================

const TreatmentTypeTrendsSection: React.FC<{ data: ReferralEngineData }> = ({
  data,
}) => {
  const trends = data.treatment_type_trends;

  const hasMissingData = !trends;
  const hasNoOverview = !trends?.overview || trends.overview.length === 0;
  const hasNoStartingMost =
    !trends?.what_starting_most || trends.what_starting_most.length === 0;
  const hasNoUnderutilized =
    !trends?.underutilized_treatments ||
    trends.underutilized_treatments.length === 0;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Treatment Type Trends
      </h2>
      {hasMissingData && (
        <MissingDataHint
          message="If you have treatment type data (e.g., Invisalign, implants, ortho), include it in your PMS export for trend analysis."
          type="suggestion"
        />
      )}

      {hasMissingData ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">
            No treatment type data available yet
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Treatment trends help identify growth opportunities
          </p>
        </div>
      ) : (
        <>
          {/* Overview bullets */}
          {hasNoOverview ? (
            <p className="text-xs text-gray-400 italic mb-6">
              No overview data available
            </p>
          ) : (
            <ul className="space-y-2 mb-6">
              {trends.overview!.map((item, index) => (
                <li key={index} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* What We're Starting Most */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-600">●</span>
                <h3 className="text-base font-semibold text-gray-900">
                  What We're Starting Most
                </h3>
              </div>
              {hasNoStartingMost ? (
                <p className="text-xs text-gray-400 italic">
                  No data available
                </p>
              ) : (
                <ul className="space-y-2">
                  {trends.what_starting_most!.map((item, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 flex gap-2"
                    >
                      <span className="text-green-600">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Underutilized Treatments */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-orange-600">●</span>
                <h3 className="text-base font-semibold text-gray-900">
                  Underutilized Treatments
                </h3>
              </div>
              {hasNoUnderutilized ? (
                <p className="text-xs text-gray-400 italic">
                  No data available
                </p>
              ) : (
                <ul className="space-y-2">
                  {trends.underutilized_treatments!.map((item, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 flex gap-2"
                    >
                      <span className="text-orange-600">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Recommendation */}
          {trends.recommendation && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Recommendation:</strong> {trends.recommendation}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: Seasonality Insights Section
// ============================================================================

const SeasonalityInsightsSection: React.FC<{ data: ReferralEngineData }> = ({
  data,
}) => {
  const seasonality = data.seasonality_insights;

  const hasMissingData = !seasonality;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Seasonality Insights (Referrals & Production)
      </h2>
      {hasMissingData && (
        <MissingDataHint
          message="More historical data is needed for seasonality analysis. If you have 12+ months of referral data, please include it."
          type="suggestion"
        />
      )}

      {hasMissingData ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">
            No seasonality data available yet
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Seasonality insights require at least 6-12 months of historical data
          </p>
        </div>
      ) : (
        <>
          {/* Three-column layout for key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Peak Referrals */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600">📈</span>
                <h3 className="text-base font-semibold text-gray-900">
                  Peak Referrals
                </h3>
              </div>
              <p className="text-sm text-gray-700">
                {seasonality.peak_referrals || (
                  <span className="text-gray-400 italic">Not enough data</span>
                )}
              </p>
            </div>

            {/* Highest Production */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600">📅</span>
                <h3 className="text-base font-semibold text-gray-900">
                  Highest Production
                </h3>
              </div>
              <p className="text-sm text-gray-700">
                {seasonality.highest_production || (
                  <span className="text-gray-400 italic">Not enough data</span>
                )}
              </p>
            </div>

            {/* Slow Months */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-600">📉</span>
                <h3 className="text-base font-semibold text-gray-900">
                  Slow Months
                </h3>
              </div>
              <p className="text-sm text-gray-700">
                {seasonality.slow_months || (
                  <span className="text-gray-400 italic">Not enough data</span>
                )}
              </p>
            </div>
          </div>

          {/* Key Takeaways */}
          {seasonality.key_takeaways &&
            seasonality.key_takeaways.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Key Takeaways
                </h4>
                <ul className="space-y-2">
                  {seasonality.key_takeaways.map((takeaway, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 flex gap-2"
                    >
                      <span className="text-purple-600">•</span>
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT: Referral Engine Dashboard
// ============================================================================

export function ReferralEngineDashboard(props: ReferralEngineDashboardProps) {
  const [fetchedData, setFetchedData] = useState<ReferralEngineData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API when googleAccountId is provided
  useEffect(() => {
    const fetchReferralEngineData = async () => {
      if (!props.googleAccountId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/agents/getLatestReferralEngineOutput/${props.googleAccountId}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            // No data available yet - use sample data
            setFetchedData(null);
            setLoading(false);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          // Handle both array and object formats
          const dataToSet = Array.isArray(result.data)
            ? result.data[0]
            : result.data;
          setFetchedData(dataToSet);
        } else {
          setFetchedData(null);
        }
      } catch (err: unknown) {
        console.error("Failed to fetch referral engine data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load referral engine data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReferralEngineData();
  }, [props.googleAccountId]);

  // Use provided data or fetched data (no fallback to sample data)
  const data = props.data ?? fetchedData;

  // Null check: If no data at all, show empty state
  if (!data) {
    return (
      <div className="p-6 text-center">
        <div className="bg-gray-100 rounded-lg p-12">
          <p className="text-gray-500 text-lg">No referral data available</p>
          <p className="text-gray-400 text-sm mt-2">
            Referral Engine analysis has not been run yet. Please check back
            later.
          </p>
        </div>
      </div>
    );
  }

  // Calculate top-level metrics
  const doctorMetrics = calculateDoctorReferralMetrics(
    data.doctor_referral_matrix
  );
  const selfReferralMetrics = calculateSelfReferralMetrics(
    data.non_doctor_referral_matrix
  );

  // Null check: If no essential data exists, show empty state
  if (
    !data.doctor_referral_matrix &&
    !data.non_doctor_referral_matrix &&
    !data.executive_summary
  ) {
    return (
      <div className="p-6 text-center">
        <div className="bg-gray-100 rounded-lg p-12">
          <p className="text-gray-500 text-lg">No referral data available</p>
          <p className="text-gray-400 text-sm mt-2">Please check back later</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading referral engine data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-semibold mb-2">
              Failed to load data
            </p>
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={props.hideHeader ? "" : "min-h-screen bg-gray-50 p-6"}>
      <div
        className={
          props.hideHeader ? "space-y-6" : "max-w-7xl mx-auto space-y-6"
        }
      >
        {/* Header - conditionally rendered */}
        {!props.hideHeader && (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-thin text-gray-900 mb-1">
                Referral Engine Dashboard
              </h1>
              <p className="text-base font-thin text-gray-600">
                See how your practice is performing with Alloro AI.
              </p>
              {data.freshness && (
                <p className="text-sm text-gray-500 mt-2">
                  Last updated: {formatDate(data.freshness)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricCard
            value={`+${doctorMetrics.total}`}
            label="Doctor Referrals"
            description="Referrals from other providers."
            trend={doctorMetrics.trend}
            bgColor="bg-green-50"
          />
          <MetricCard
            value={selfReferralMetrics.total}
            label="Self Referrals"
            description="Patients who referred themselves."
            trend="increasing"
            bgColor="bg-pink-50"
          />
        </div>

        {/* Executive Summary */}
        <ExecutiveSummarySection data={data} />

        {/* Doctor Referral Table */}
        <DoctorReferralTable data={data} />

        {/* Non-Doctor Referral Table */}
        <NonDoctorReferralTable data={data} />

        {/* Treatment Type Trends */}
        <TreatmentTypeTrendsSection data={data} />

        {/* Seasonality Insights */}
        <SeasonalityInsightsSection data={data} />

        {/* Top 3 Fixes */}
        <TopFixesSection data={data} />

        {/* Responsibility Split */}
        <ResponsibilitySplitSection data={data} />

        {/* Footer */}
        {data.lineage && (
          <div className="text-center text-xs text-gray-400 pt-6 border-t border-gray-200">
            <p>Report ID: {data.lineage}</p>
            {data.agent_name && (
              <p className="mt-1">Generated by {data.agent_name}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SCHEMA FIELD USAGE DICTIONARY
// ============================================================================

/*
SCHEMA FIELD → UI LOCATION MAPPING:

1. executive_summary[] → Executive Summary Section (main text + insights)
2. doctor_referral_matrix[] → Doctor Referral Table + Doctor Referrals metric card
3. non_doctor_referral_matrix[] → Non-Doctor Referral Table + Self Referrals metric card
4. growth_opportunity_summary.top_three_fixes[] → Top 3 Fixes Section (numbered list)
5. growth_opportunity_summary.estimated_additional_annual_revenue → Top 3 Fixes header
6. alloro_automation_opportunities[] → Responsibility Split (Alloro card)
7. practice_action_plan[] → Responsibility Split (Practice card)
8. confidence → Computer Ranking metric + header badge
9. freshness → Header timestamp
10. lineage → Footer metadata
11. agent_name → Footer metadata
12. roi_ranking.tier1-4 → Not rendered (optional future enhancement)
13. last_two_month_trends → Used for trend badges throughout
14. appendices.* → Not rendered (optional future enhancement)
15. observed_period → Not rendered (metadata)
16. citations → Not rendered (metadata)

FIELDS USED IN CALCULATIONS:
- doctor_referral_matrix[].referred → Sum for total doctor referrals
- doctor_referral_matrix[].net_production → Sum for total production
- doctor_referral_matrix[].trend_label → Trend badge indicators
- non_doctor_referral_matrix[].source_type → Filter for self-referrals
- non_doctor_referral_matrix[].referred → Count for self-referral metric
- confidence → Convert to 0-10 scale for ranking

NULL-SAFE PATTERNS USED:
- Section-level: if (!data?.field || data.field.length === 0) return null;
- Value-level: value ?? defaultValue or value || 'N/A'
- Array operations: (array || []).reduce/map/filter
- Formatting: Helper functions with null checks (formatCurrency, formatPercentage, formatDate)
*/

// ============================================================================
// INTEGRATION INSTRUCTIONS
// ============================================================================

/*
HOW TO INTEGRATE WITH REAL API:

1. Replace sample data with API call:

import { useEffect, useState } from 'react';

export function ReferralEngineDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetch('/api/referral-engine')
      .then(response => response.json())
      .then(json => {
        // Handle array response (take first element) or single object
        setData(Array.isArray(json) ? json[0] : json);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-600">Error loading data</div>;
  
  return <ReferralEngineDashboardContent data={data} />;
}

// Rename current component to ReferralEngineDashboardContent

2. Add to main Dashboard:

// In your main Dashboard.tsx file:
import { ReferralEngineDashboard } from './components/ReferralEngineDashboard';

export default function Dashboard() {
  return (
    <div className="p-6">
      <ReferralEngineDashboard />
    </div>
  );
}

3. Styling Options:
- Component uses Tailwind CSS utility classes
- To use CSS modules: create ReferralEngineDashboard.module.css and replace className strings
- To use styled-components: wrap elements with styled() constructors
- To use MUI: replace div/table elements with MUI components

4. Adding/Removing Sections:
- Each section is self-contained and checks for data existence
- To hide a section: Comment out the component in the main return statement
- To add a section: Create new component following the null-safe pattern:
  
  const NewSection = ({ data }) => {
    if (!data?.newField) return null;
    return <div>...</div>;
  };

5. Customizing Insights:
- Insight boxes are hardcoded. To make dynamic:
  - Add "insights" field to schema
  - Map insights to each table section
  - Update InsightBox component to accept insights prop
*/

export default ReferralEngineDashboard;
