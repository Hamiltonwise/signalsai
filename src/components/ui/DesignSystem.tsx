import React from "react";
import { ChevronRight, Zap } from "lucide-react";

/**
 * IntelligencePulse Component
 * Animated pulse indicator for live data or active states
 */
export const IntelligencePulse = () => (
  <span className="relative flex h-2.5 w-2.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alloro-orange opacity-30"></span>
    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-alloro-orange opacity-60"></span>
  </span>
);

/**
 * MetricCard Component
 * Displays a single metric with label, value, and optional trend indicator
 */
interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: string;
  isHighlighted?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  trend,
  isHighlighted = false,
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
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * CompactTag Component
 * Small status indicator with custom styling per status type
 */
interface CompactTagProps {
  status: string;
}

export const CompactTag: React.FC<CompactTagProps> = ({ status }) => {
  const styles: Record<string, string> = {
    Increasing: "text-green-700 bg-green-50 border-green-100",
    increasing: "text-green-700 bg-green-50 border-green-100",
    Decreasing: "text-red-700 bg-red-50 border-red-100",
    decreasing: "text-red-700 bg-red-50 border-red-100",
    New: "text-indigo-700 bg-indigo-50 border-indigo-100",
    new: "text-indigo-700 bg-indigo-50 border-indigo-100",
    Dormant: "text-alloro-textDark/20 bg-alloro-bg border-black/5",
    dormant: "text-alloro-textDark/20 bg-alloro-bg border-black/5",
    Stable: "text-slate-500 bg-slate-50 border-slate-200",
    stable: "text-slate-500 bg-slate-50 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border leading-none mt-1 w-fit ${
        styles[status] || styles["Stable"]
      }`}
    >
      {status}
    </span>
  );
};

/**
 * SectionHeader Component
 * Reusable section header with icon and divider
 */
interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
}) => (
  <div className="flex items-center gap-4 px-1">
    {icon && <div className="shrink-0">{icon}</div>}
    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-alloro-textDark/40 whitespace-nowrap">
      {title}
    </h3>
    <div className="h-px w-full bg-black/10"></div>
  </div>
);

/**
 * PageHeader Component
 * Sticky header with icon, title, subtitle and action button
 */
interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  title,
  subtitle,
  actionButton,
}) => (
  <header className="glass-header border-b border-black/5 lg:sticky lg:top-0 z-40">
    <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-6 flex items-center justify-between">
      <div className="flex items-center gap-5">
        <div className="w-10 h-10 bg-alloro-navy text-white rounded-xl flex items-center justify-center shadow-lg">
          {icon}
        </div>
        <div className="flex flex-col text-left">
          <h1 className="text-[11px] font-black font-heading text-alloro-textDark uppercase tracking-[0.25em] leading-none">
            {title}
          </h1>
          {subtitle && (
            <span className="text-[9px] font-bold text-alloro-textDark/40 uppercase tracking-widest mt-1.5 hidden sm:inline">
              {subtitle}
            </span>
          )}
        </div>
      </div>
      {actionButton && (
        <div className="flex items-center gap-4">{actionButton}</div>
      )}
    </div>
  </header>
);

/**
 * StatusPill Component
 * Colored status indicator
 */
interface StatusPillProps {
  label: string;
  color?: "orange" | "green" | "red" | "blue" | "gray";
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  color = "blue",
}) => {
  const colorStyles: Record<string, string> = {
    orange: "bg-amber-50 text-amber-600 border-amber-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    gray: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${colorStyles[color]}`}
    >
      {label}
    </span>
  );
};
