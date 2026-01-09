/**
 * UI-specific types for the redesigned PMSLatestJobEditor component
 */

/**
 * Represents a single source/referral row in the data entry grid
 */
export interface SourceRow {
  id: number; // Unique ID for React key
  source: string; // Source name (text input)
  type: "self" | "doctor"; // Referral type (from inferred_referral_type)
  referrals: string; // String for input field (number as string)
  production: string; // String for input field (formatted money)
}

/**
 * Represents a calendar month with all its sources
 */
export interface MonthBucket {
  id: number; // Unique ID for tracking (Date.now())
  month: string; // Format: YYYY-MM
  rows: SourceRow[]; // All sources for this month
}

/**
 * Calculated summary totals for a month
 */
export interface MonthSummary {
  selfReferrals: number;
  doctorReferrals: number;
  totalReferrals: number;
  productionTotal: number;
}

/**
 * Month/Year picker temporary state
 */
export interface MonthPickerState {
  isOpen: boolean;
  step: "month" | "year";
  selectedMonth: string | null; // MM (01-12)
  selectedYear?: number;
}
