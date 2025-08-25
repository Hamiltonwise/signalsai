/**
 * Standardized Date Range Utilities for MTD Reporting
 * 
 * This module provides consistent date range calculations for Month-to-Date (MTD)
 * reporting across all integrations and dashboard components.
 */

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
  description: string;
}

export interface MTDComparison {
  current: DateRange;
  previous: DateRange;
  comparisonType: 'MTD';
  todayDate: string;
  daysInPeriod: number;
}

/**
 * Get standardized MTD comparison periods
 * Current month from day 1 to today vs. same period in previous month
 */
export const getMTDComparison = (referenceDate?: Date): MTDComparison => {
  const today = referenceDate || new Date();
  const currentDay = today.getDate();
  
  // Current MTD period (1st of current month to today)
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentPeriod: DateRange = {
    startDate: formatDateForAPI(currentMonthStart),
    endDate: formatDateForAPI(today),
    label: `${getMonthName(today)} 1-${currentDay}`,
    description: `${getMonthName(today)} ${today.getFullYear()} (Days 1-${currentDay})`
  };

  // Previous MTD period (1st of previous month to same day in previous month)
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousMonthSameDay = new Date(today.getFullYear(), today.getMonth() - 1, currentDay);
  
  // Handle edge case where previous month has fewer days
  const lastDayOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  const adjustedDay = Math.min(currentDay, lastDayOfPreviousMonth);
  const adjustedPreviousDate = new Date(today.getFullYear(), today.getMonth() - 1, adjustedDay);
  
  const previousPeriod: DateRange = {
    startDate: formatDateForAPI(previousMonth),
    endDate: formatDateForAPI(adjustedPreviousDate),
    label: `${getMonthName(previousMonth)} 1-${adjustedDay}`,
    description: `${getMonthName(previousMonth)} ${previousMonth.getFullYear()} (Days 1-${adjustedDay})`
  };

  return {
    current: currentPeriod,
    previous: previousPeriod,
    comparisonType: 'MTD',
    todayDate: formatDateForAPI(today),
    daysInPeriod: currentDay
  };
};

/**
 * Get last 30 days period (for backward compatibility)
 */
export const getLast30Days = (referenceDate?: Date): DateRange => {
  const today = referenceDate || new Date();
  const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  return {
    startDate: formatDateForAPI(thirtyDaysAgo),
    endDate: formatDateForAPI(today),
    label: 'Last 30 Days',
    description: `${formatDateForDisplay(thirtyDaysAgo)} - ${formatDateForDisplay(today)}`
  };
};

/**
 * Get last 30 days vs previous 30 days comparison for detailed analytics
 */
export const getLast30DaysComparison = (referenceDate?: Date): {
  current: DateRange;
  previous: DateRange;
  comparisonType: 'L30D';
} => {
  const today = referenceDate || new Date();
  
  // Current period: Last 30 days
  const currentStart = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
  const current: DateRange = {
    startDate: formatDateForAPI(currentStart),
    endDate: formatDateForAPI(today),
    label: 'Last 30 Days',
    description: `${formatDateForDisplay(currentStart)} - ${formatDateForDisplay(today)}`
  };

  // Previous period: 30 days before that (days 31-60 ago)
  const previousEnd = new Date(currentStart.getTime() - (1 * 24 * 60 * 60 * 1000)); // Day before current period
  const previousStart = new Date(previousEnd.getTime() - (29 * 24 * 60 * 60 * 1000)); // 30 days before that
  const previous: DateRange = {
    startDate: formatDateForAPI(previousStart),
    endDate: formatDateForAPI(previousEnd),
    label: 'Previous 30 Days',
    description: `${formatDateForDisplay(previousStart)} - ${formatDateForDisplay(previousEnd)}`
  };

  return {
    current,
    previous,
    comparisonType: 'L30D'
  };
};

/**
 * Get last full month data for vital signs reporting
 */
export const getLastFullMonth = (referenceDate?: Date): DateRange => {
  const today = referenceDate || new Date();
  
  // Get first day of last month
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  
  // Get last day of last month
  const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  
  return {
    startDate: formatDateForAPI(lastMonth),
    endDate: formatDateForAPI(lastDayOfLastMonth),
    label: getMonthName(lastMonth),
    description: `${getMonthName(lastMonth)} ${lastMonth.getFullYear()} (Full Month)`
  };
};

/**
 * Get 12 months of data for performance indicators trend
 */
export const getLast12Months = (referenceDate?: Date): DateRange => {
  const today = referenceDate || new Date();
  const twelveMonthsAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  
  return {
    startDate: formatDateForAPI(twelveMonthsAgo),
    endDate: formatDateForAPI(today),
    label: 'Last 12 Months',
    description: `${formatDateForDisplay(twelveMonthsAgo)} - ${formatDateForDisplay(today)}`
  };
};
/**
 * Format date for API calls (YYYY-MM-DD)
 */
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Format date for display (MMM DD, YYYY)
 */
export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Get month name from date
 */
export const getMonthName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'long' });
};

/**
 * Calculate percentage change between current and previous periods
 */
export const calculateMTDChange = (currentValue: number, previousValue: number): {
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  changeText: string;
} => {
  if (previousValue === 0) {
    return {
      changePercent: currentValue > 0 ? 100 : 0,
      trend: currentValue > 0 ? 'up' : 'stable',
      changeText: currentValue > 0 ? '+100%' : '0%'
    };
  }

  const changePercent = ((currentValue - previousValue) / previousValue) * 100;
  const trend = changePercent > 2 ? 'up' : changePercent < -2 ? 'down' : 'stable';
  const changeText = `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`;

  return {
    changePercent: Math.abs(changePercent),
    trend,
    changeText
  };
};

/**
 * Validate that date ranges are MTD compliant
 */
export const validateMTDPeriod = (startDate: string, endDate: string): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check if start date is first of month
  if (start.getDate() !== 1) {
    issues.push('Start date should be the 1st of the month for MTD reporting');
    suggestions.push('Use the 1st of the month as start date');
  }

  // Check if end date is not in the future
  if (end > today) {
    issues.push('End date cannot be in the future');
    suggestions.push('Use today\'s date or earlier');
  }

  // Check if date range is within same month
  if (start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear()) {
    issues.push('Date range spans multiple months');
    suggestions.push('Keep date range within a single month for MTD reporting');
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
};

/**
 * Get human-readable description of MTD comparison
 */
export const getMTDDescription = (comparison: MTDComparison): string => {
  return `Comparing ${comparison.current.description} vs ${comparison.previous.description} (${comparison.daysInPeriod} days each)`;
};