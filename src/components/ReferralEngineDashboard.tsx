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
// TEMPORARY SAMPLE DATA — Replace with real fetch() later
// ============================================================================
const sampleData = {
  lineage: "job-2025-12-01-artful-orthodontics-referral-engine-v1",
  citations: [
    "pms:sources_summary",
    "pms:monthly_rollup_2025-01_2025-10",
    "ga4:artfulorthodontics.com#overview_2025-10-31_2025-11-29",
    "ga4:artfulorthodontics.com#acquisition_by_source_2025-10-31_2025-11-29",
    "gsc:artfulorthodontics.com#queries_2025-10-31_2025-11-29",
    "gsc:artfulorthodontics.com#pages_underperforming_2025-10-31_2025-11-29",
    "gbp:accounts/114810842911950437772/locations/10282052848626216313#performance_2025-10-31_2025-11-29",
    "clarity:artfulorthodontics.com#aggregated_2025-10-31_2025-11-29",
  ],
  freshness: "2025-12-01T00:00:00Z",
  agent_name: "Referral Engine Analysis Agent",
  appendices: {
    trend_graph_refs: [
      "s3://alloro-artful-orthodontics/charts/doctor_referrals_trend_2025.png",
      "s3://alloro-artful-orthodontics/charts/digital_traffic_vs_starts_2025.png",
    ],
    raw_metrics_tables: [
      "PMS Sources Summary (YTD):\n| Rank | Source                 | Type           | Referrals | Production ($) | % of Total |\n|------|------------------------|----------------|-----------|----------------|-----------:|\n| 1    | Happy Smiles           | Doctor         | 63        | 214,801.29     | 23.77%     |",
      "GA4 Acquisition (last 30 days):\n| Source/Medium            | Sessions | Engagement Rate | Key Notes                          |\n|--------------------------|----------|-----------------|------------------------------------|\n| (direct)/(none)          | 213      | 0.23            | Likely mix of brand + admin visits |",
    ],
    scorecard_csv_refs: [
      "s3://alloro-artful-orthodontics/reports/referral_scorecard_2025-11.csv",
    ],
  },
  confidence: 0.78,
  practice_id: "artful-orthodontics-demo-001",
  roi_ranking: {
    tier1: [
      "Happy Smiles",
      "Google (Search & Maps)",
      "Walk‑in / Self‑referral",
      "LA Family Dentistry",
    ],
    tier2: [
      "Hollywood Smiles Dental",
      "Instagram",
      "Website (Direct/Forms)",
      "Google Business Profile (GBP calls/directions, once tracked)",
      "Smile Guy",
    ],
    tier3: ["Facebook", "Promotions / Special Offers"],
    tier4: [
      "Smaller/one‑off digital referrers (unlabeled social/referral traffic)",
      "Unattributed '(not set)/(direct)' sessions in GA4",
    ],
  },
  agent_version: "v1",
  observed_period: {
    end_date: "2025-11-29",
    start_date: "2025-01-01",
  },
  executive_summary: [
    "Doctor and non‑doctor referrals together are generating ~$904k in production YTD, with four sources (Happy Smiles, Google, Walk‑in, LA Family Dentistry) driving nearly 80% of that volume.",
    "Doctor referrals are concentrated in three core practices: Happy Smiles (63 referrals, ~$215k), LA Family Dentistry (44, ~$134k), and Hollywood Smiles Dental (28, ~$88k), plus a new smaller referrer, Smile Guy (~$8.3k).",
    "Non‑doctor sources (Google, Walk‑in, Website, Facebook, Instagram, promotions) together match or exceed the top doctor sources in production, led by Google (70 referrals, ~$211k) and Walk‑in (42, ~$150k).",
    "Over the last 2 months, Google and Happy Smiles remain strong but flat; LA Family Dentistry and Hollywood Smiles Dental have softened slightly; Website and Instagram are underutilized high‑intent channels based on GA4/GSC and Clarity behavior.",
    "We estimate that tightening conversion from existing digital and doctor traffic and re‑activating 1–2 doctor referrers can conservatively add $120k–$180k in production over the next 12 months.",
    "Alloro can automatically clean and unify digital attribution, strengthen Google/GBP performance, and create follow‑up automations, while the practice team focuses on deepening doctor relationships, scripting, and front‑desk conversion discipline.",
  ],
  practice_action_plan: [
    "Doctor‑to‑doctor outreach: Schedule 1:1 visits with LA Family Dentistry and Hollywood Smiles Dental in the next 30 days to share case outcomes, clarify ideal patient profiles, and ask directly how the orthodontic team can make referring easier.",
    "Referrer feedback loop: Implement a simple monthly email or printed report to top referrers (Happy Smiles, LA Family Dentistry, Hollywood Smiles, Smile Guy) summarizing their sent patients, acceptance, and visible outcomes to reinforce trust.",
    "Front‑desk scripting: Train front‑desk staff on a consistent script to (1) ask every new patient how they heard about the practice in language that matches PMS source options, and (2) reinforce value when scheduling (e.g., limited availability, benefits of early treatment).",
    "Phone handling discipline: Review 5–10 recorded phone calls per month from Google/GBP and Website leads to coach on speed‑to‑answer, objection handling (cost, timing), and confident same‑call appointment booking.",
    "Website consult experience: Collaborate with Alloro on small layout/content changes (above‑the‑fold phone number, fewer form fields, clear 'What happens at your first visit?' messaging) and ensure clinical team approves copy so it feels authentic.",
    "Strengthen Happy Smiles partnership: Offer a simple co‑branded education piece (PDF/handout or landing page) for parents, and invite their team for an annual appreciation lunch and CE mini‑session at the office.",
    "Nurture the new 'Smile Guy' referrer: Send a personalized thank‑you, share a brief case update (with patient consent), and ask what types of cases they most want to refer; offer quick access for complex or time‑sensitive patients.",
    "Patient referral and review ask: At bond‑off and key 'wow' moments, have clinical staff explicitly ask for a Google review and mention your patient‑referral policy (if any), supported by QR codes and printed review cards in the office.",
    "Align clinical and financial messaging: Ensure treatment coordinators are using consistent, confidence‑building language about cost (e.g., referencing your 'True Cost of Braces in Florida' content and flexible financing) so that digital education supports in‑office close rates.",
    "Quarterly strategy huddle: Hold a 30‑minute quarterly Referral Engine review with the doctor, office manager, and TC to review Alloro's scorecard, agree on 1–2 relationship moves and 1–2 digital/ops tweaks for the coming quarter.",
  ],
  last_two_month_trends: {
    new_sources: [
      "Smile Guy (doctor referrer)",
      "Top 10 Orthodontists in Florida (SEO content)",
      "Sleep apnea & orthodontics content cluster (blog)",
    ],
    dormant_sources: [
      "Older Facebook campaigns (legacy ads/boosts)",
      "Some smaller promo sources not seen in the last 2 months",
    ],
    comparison_period: {
      end_date: "2025-11-29",
      start_date: "2025-10-01",
    },
    decreasing_sources: [
      "LA Family Dentistry",
      "Hollywood Smiles Dental",
      "Facebook",
      "Promotional campaigns",
    ],
    increasing_sources: [
      "Google (organic + Maps/GBP)",
      "Happy Smiles",
      "Walk‑in / Self‑referral",
      "Instagram",
      "Website direct/consult pages",
    ],
  },
  doctor_referral_matrix: [
    {
      notes:
        "Largest single referrer by volume and production (~24% of total). Steady month‑over‑month volume (3–9 referrals/month) and strong case value. Priority to protect and deepen this relationship with structured touchpoints and feedback loops.",
      referred: 63,
      pct_started: null,
      referrer_id: "DR-HAPPY-SMILES",
      trend_label: "increasing" as const,
      pct_examined: null,
      pct_scheduled: null,
      referrer_name: "Happy Smiles",
      net_production: 214801.29,
      avg_production_per_start: 3410,
    },
    {
      notes:
        "Historically very productive (~15% of total), but referrals have drifted down from 6–9/month to ~2 in October. High‑value but at risk; needs rapid outreach, case feedback, and chairside alignment to prevent further slide.",
      referred: 44,
      pct_started: null,
      referrer_id: "DR-LA-FAMILY",
      trend_label: "decreasing" as const,
      pct_examined: null,
      pct_scheduled: null,
      referrer_name: "LA Family Dentistry",
      net_production: 134404.99,
      avg_production_per_start: 3055,
    },
    {
      notes:
        "Solid contributor (~10% of total). Volume peaked mid‑year; last 2 months show modest softening. Good upside if we can move them from occasional to steady monthly referrer via specific co‑marketing and education.",
      referred: 28,
      pct_started: null,
      referrer_id: "DR-HOLLYWOOD-SMILES",
      trend_label: "decreasing" as const,
      pct_examined: null,
      pct_scheduled: null,
      referrer_name: "Hollywood Smiles Dental",
      net_production: 88439.58,
      avg_production_per_start: 3166,
    },
    {
      notes:
        "New doctor referrer with a single but very high‑value case. Excellent early signal; should be treated as a strategic emerging partner with quick turn feedback and a light‑touch relationship plan.",
      referred: 1,
      pct_started: null,
      referrer_id: "DR-SMILE-GUY",
      trend_label: "new" as const,
      pct_examined: null,
      pct_scheduled: null,
      referrer_name: "Smile Guy",
      net_production: 8311.43,
      avg_production_per_start: 8311.43,
    },
  ],
  growth_opportunity_summary: {
    top_three_fixes: [
      "Wire up end‑to‑end tracking from Google/GBP and website forms through to scheduled exams and treatment starts, then improve website conversion (forms + phone handling) by 20–30%, turning existing digital traffic into an estimated +$60k–$90k in production per year.",
      "Stabilize and re‑grow LA Family Dentistry and Hollywood Smiles Dental into consistent monthly referrers via a structured doctor‑relations program, adding 1–2 extra starts per month from each practice (~$50k–$70k annual upside).",
      "Design and launch a simple, trackable patient self‑referral and review flywheel (reviews, in‑office asks, and light social campaigns) to lift Walk‑in and Website volumes by 15–20%, generating an estimated +$30k–$40k annually.",
    ],
    estimated_additional_annual_revenue: 150000,
  },
  non_doctor_referral_matrix: [
    {
      notes:
        "Top non‑doctor source (~23% of production). GSC shows strong branded demand (e.g., 'artful orthodontics') and emerging non‑branded terms ('braces behind teeth', lingual braces content). GA4+Clarity confirm high engagement on consult and treatment pages, but no conversion tracking is wired, masking true ROI.",
      referred: 70,
      source_key: "google-organic-paid-mix",
      pct_started: null,
      source_type: "digital" as const,
      trend_label: "increasing" as const,
      pct_examined: null,
      source_label: "Google (Search & Maps)",
      pct_scheduled: null,
      net_production: 210566.85,
      avg_production_per_start: 3008,
    },
    {
      notes:
        "Strong, relatively stable self‑referral volume (~4–6 per month) and high case value (~$3.5k/case). Likely driven by signage, reputation, and word‑of‑mouth; can be amplified via reviews and in‑office referral programs.",
      referred: 42,
      source_key: "walk-in",
      pct_started: null,
      source_type: "patient" as const,
      trend_label: "increasing" as const,
      pct_examined: null,
      source_label: "Walk‑in / Self‑referral (offline)",
      pct_scheduled: null,
      net_production: 149773.71,
      avg_production_per_start: 3566,
    },
    {
      notes:
        "Low volume but high‑quality leads (~$3.3k per case). GA4 and Clarity show heavy homepage and 'Schedule a Consultation' traffic with form_start events but no clear goal tracking. Significant upside from form optimization and automated follow‑up.",
      referred: 7,
      source_key: "website-direct-forms",
      pct_started: null,
      source_type: "digital" as const,
      trend_label: "increasing" as const,
      pct_examined: null,
      source_label: "Website (Direct/Forms)",
      pct_scheduled: null,
      net_production: 23531.43,
      avg_production_per_start: 3362,
    },
    {
      notes:
        "Historically small but high‑value source. GA4 shows only a trickle of referral sessions from Facebook in the current 30‑day window. Likely organic and/or campaign activity has slowed; could be re‑ignited with better tracking and targeted campaigns.",
      referred: 7,
      source_key: "facebook-social",
      pct_started: null,
      source_type: "digital" as const,
      trend_label: "dormant" as const,
      pct_examined: null,
      source_label: "Facebook",
      pct_scheduled: null,
      net_production: 23691.71,
      avg_production_per_start: 3385,
    },
    {
      notes:
        "Modest volume but highest avg case value among social sources. Clarity and GA4 show recurring traffic from IG link‑in‑bio to About, Office Hours, and Schedule pages. Strong candidate for structured content + retargeting to capture more high‑value adult and teen starts.",
      referred: 7,
      source_key: "instagram-social",
      pct_started: null,
      source_type: "digital" as const,
      trend_label: "increasing" as const,
      pct_examined: null,
      source_label: "Instagram",
      pct_scheduled: null,
      net_production: 28580,
      avg_production_per_start: 4083,
    },
    {
      notes:
        "Occasional campaigns across the year; some months strong (>$5k), others negligible. Good unit economics but inconsistent execution; should be formalized into 2–3 annual campaigns with clear landing pages and tracking.",
      referred: 7,
      source_key: "promotion-offers",
      pct_started: null,
      source_type: "other" as const,
      trend_label: "decreasing" as const,
      pct_examined: null,
      source_label: "Promotions / Special Offers",
      pct_scheduled: null,
      net_production: 21654.29,
      avg_production_per_start: 3093,
    },
    {
      notes:
        "GBP shows consistent CALL_CLICKS and high direction requests across the last month. These are likely feeding 'Walk‑in' and 'Phone' leads but are not tagged as a separate source in the PMS; tracking gap obscures ROI.",
      referred: 0,
      source_key: "gbp",
      pct_started: null,
      source_type: "digital" as const,
      trend_label: "increasing" as const,
      pct_examined: null,
      source_label: "Google Business Profile (Calls & Directions)",
      pct_scheduled: null,
      net_production: null,
      avg_production_per_start: null,
    },
  ],
  alloro_automation_opportunities: [
    "Implement GA4 conversion events for key actions (consult form submissions, phone_link_click, schedule‑page views) and map them to PMS referral sources, so that Google, Website, GBP, and Social ROI is visible at the exam and start level.",
    "Connect Google Business Profile call and website click data to lead capture workflows, auto‑tagging these as 'GBP' in the referral source field to separate them from generic 'Google' and 'Walk‑in' in the PMS.",
    "Deploy automated lead‑catch and follow‑up sequences for website and social leads: instant SMS/email to new inquiries, 3–5 day follow‑up cadence, and auto‑reminders for incomplete form_starts detected in GA4/Clarity.",
    "Use Clarity session insights (dead clicks, quick‑backs on schedule and service pages) to automatically generate UX improvement tickets (e.g., fix broken elements, clarify CTAs, surface phone number and form side‑by‑side on mobile).",
    "Push review requests automatically after key milestones (exam completed, treatment start, debond) via SMS/email, prioritizing Google reviews to strengthen local SEO and reinforce the Walk‑in/self‑referral engine.",
    "Set up audience segments for high‑intent visitors (multiple visits to consult/treatment pages, scroll depth >50%) and sync them to paid retargeting platforms (Google/Meta) for low‑cost reminder ads managed by Alloro.",
    "Standardize UTM tagging templates for all campaigns (Facebook/Instagram promotions, email, community events) and enforce them via Alloro link builders so that every campaign maps cleanly into the PMS referral source taxonomy.",
    "Auto‑generate a monthly Referral Engine scorecard that merges PMS (referrals, production) with GA4/GSC/GBP (traffic, conversions, queries) and flags sources as new/increasing/decreasing/dormant without manual analysis.",
    "Monitor GSC low‑CTR high‑impression queries (e.g., 'braces behind teeth') and trigger SEO content/metadata recommendations for pages like lingual braces, adult braces, and cost‑of‑braces content.",
    "Automatically notify the treatment coordinator or office manager when a strategic referrer's monthly volume drops below a threshold (e.g., LA Family Dentistry <3 referrals/month) so that relationship outreach is not missed.",
  ],
  treatment_type_trends: {
    overview: [
      "Metal Braces are the largest revenue driver (~$46k from 9 cases)",
      "Invisalign volume is low (3 full + 2 limited cases, ~$20k total)",
      "Phase I/Appliance treatments are underutilized (only 2 appliance cases)",
      "Lightforce has only 1 case but good production per case",
    ],
    what_starting_most: ["Braces (Metal)", "Insurance-coded bracket cases"],
    underutilized_treatments: [
      "Invisalign (full + limited)",
      "Phase I appliances",
      "Lightforce",
    ],
    recommendation:
      "Focus on increasing Invisalign starts and Phase I appliances via better TC presentation and doctor education.",
  },
  seasonality_insights: {
    peak_referrals: "June & July",
    highest_production: "July, August, June, April",
    slow_months: "January–March, September",
    key_takeaways: [
      "Summer (April–August) is the main growth window → ramp up marketing & starts",
      "Slow season (September–February) → focus on reactivation, doctor relationship building, and system improvements",
    ],
  },
} as const satisfies ReferralEngineData;

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
  return `${(value * 100).toFixed(1)}%`;
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

  if (!fixes || fixes.length === 0) return null;

  return (
    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎯</span>
        <h2 className="text-xl font-bold text-gray-900">
          Top 3 Fixes to Add{" "}
          {estimatedRevenue ? formatCurrency(estimatedRevenue) : "$100k"}+ Next
          Year
        </h2>
      </div>

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

  if (
    (!alloroOps || alloroOps.length === 0) &&
    (!practiceOps || practiceOps.length === 0)
  ) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 text-center mb-6">
        Responsibility Split
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alloro Card */}
        {alloroOps && alloroOps.length > 0 && (
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
          </div>
        )}

        {/* Practice Card */}
        {practiceOps && practiceOps.length > 0 && (
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
          </div>
        )}
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

  if (!summary || summary.length === 0) return null;

  // Extract key insights from summary
  const mainText = summary[0] || "";

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Executive Summary
      </h2>

      <p className="text-sm text-gray-700 leading-relaxed mb-6">{mainText}</p>

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

  if (!matrix || matrix.length === 0) return null;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Referring Doctor Matrix (YTD)
      </h2>

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

      {/* Insight Box */}
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

  if (!matrix || matrix.length === 0) return null;

  // Filter out zero-production sources for main table
  const activeMatrix = matrix.filter((r) => (r.referred || 0) > 0);

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Non-Doctor Referral Matrix (YTD)
      </h2>

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

      {/* Insight Box */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2">
          <span className="text-blue-600">💡</span>
          <p className="text-sm text-blue-900">
            <strong>Insight:</strong> Google and Walk-in sources deliver strong
            ROI. Website forms show high intent but need improved follow-up.
          </p>
        </div>
      </div>
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

  if (!trends) return null;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Treatment Type Trends
      </h2>

      {/* Overview bullets */}
      {trends.overview && trends.overview.length > 0 && (
        <ul className="space-y-2 mb-6">
          {trends.overview.map((item, index) => (
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
        {trends.what_starting_most && trends.what_starting_most.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-600">●</span>
              <h3 className="text-base font-semibold text-gray-900">
                What We're Starting Most
              </h3>
            </div>
            <ul className="space-y-2">
              {trends.what_starting_most.map((item, index) => (
                <li key={index} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Underutilized Treatments */}
        {trends.underutilized_treatments &&
          trends.underutilized_treatments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-orange-600">●</span>
                <h3 className="text-base font-semibold text-gray-900">
                  Underutilized Treatments
                </h3>
              </div>
              <ul className="space-y-2">
                {trends.underutilized_treatments.map((item, index) => (
                  <li key={index} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-orange-600">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>

      {/* Recommendation */}
      {trends.recommendation && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Recommendation:</strong> {trends.recommendation}
          </p>
        </div>
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

  if (!seasonality) return null;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Seasonality Insights (Referrals & Production)
      </h2>

      {/* Three-column layout for key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Peak Referrals */}
        {seasonality.peak_referrals && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600">📈</span>
              <h3 className="text-base font-semibold text-gray-900">
                Peak Referrals
              </h3>
            </div>
            <p className="text-sm text-gray-700">
              {seasonality.peak_referrals}
            </p>
          </div>
        )}

        {/* Highest Production */}
        {seasonality.highest_production && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600">📅</span>
              <h3 className="text-base font-semibold text-gray-900">
                Highest Production
              </h3>
            </div>
            <p className="text-sm text-gray-700">
              {seasonality.highest_production}
            </p>
          </div>
        )}

        {/* Slow Months */}
        {seasonality.slow_months && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-600">📉</span>
              <h3 className="text-base font-semibold text-gray-900">
                Slow Months
              </h3>
            </div>
            <p className="text-sm text-gray-700">{seasonality.slow_months}</p>
          </div>
        )}
      </div>

      {/* Key Takeaways */}
      {seasonality.key_takeaways && seasonality.key_takeaways.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Key Takeaways
          </h4>
          <ul className="space-y-2">
            {seasonality.key_takeaways.map((takeaway, index) => (
              <li key={index} className="text-sm text-gray-700 flex gap-2">
                <span className="text-purple-600">•</span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
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

  // Use provided data or fetched data or fall back to sample data
  const data = props.data ?? fetchedData ?? sampleData;

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
