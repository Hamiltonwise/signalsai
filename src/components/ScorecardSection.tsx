import React from 'react';
import { BarChart3, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScorecardMetric {
  title: string;
  value: string;
  score: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  dataSource: 'GA4' | 'GSC';
}

interface ScorecardSectionProps {
  ga4Metrics?: {
    totalUsers: number;
    engagementRate: number;
    calculatedScore: number;
    trend: 'up' | 'down' | 'stable';
    changePercent: string;
  };
  gscMetrics?: {
    totalClicks: number;
    calculatedScore: number;
    trend: 'up' | 'down' | 'stable';
    changePercent: string;
  };
  isGA4Connected: boolean;
  isGSCConnected: boolean;
}

export const ScorecardSection: React.FC<ScorecardSectionProps> = ({
  ga4Metrics,
  gscMetrics,
  isGA4Connected,
  isGSCConnected
}) => {
  const getScoreGrade = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  // Default values for demo/disconnected state
  const defaultGA4 = {
    totalUsers: 24567,
    engagementRate: 57.7,
    calculatedScore: 75,
    trend: 'up' as const,
    changePercent: '12.4'
  };

  const defaultGSC = {
    totalClicks: 5782,
    totalImpressions: 187000,
    averageCTR: 3.1,
    averagePosition: 4.2,
    totalQueries: 1200,
    calculatedScore: 68,
    trend: 'up' as const,
    changePercent: '18.7'
  };

  const ga4Data = isGA4Connected ? (ga4Metrics || defaultGA4) : defaultGA4;
  const gscData = isGSCConnected ? (gscMetrics || defaultGSC) : defaultGSC;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Performance Scorecard</h2>
        <p className="text-gray-600">Key performance indicators with month-over-month comparisons</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GA4 Scorecard */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Website Performance</h3>
                <p className="text-sm text-gray-600">Google Analytics 4</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', getScoreColor(ga4Data.calculatedScore))}>
                <span className="text-white font-bold text-lg">{getScoreGrade(ga4Data.calculatedScore)}</span>
              </div>
            </div>
          </div>

          {!isGA4Connected && (
            <div className="mb-3">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Using demo data - Connect GA4 for live metrics
              </span>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Sessions</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{ga4Data.totalUsers.toLocaleString()}</span>
                <div className={cn('flex items-center gap-1 text-xs', getTrendColor(ga4Data.trend))}>
                  {getTrendIcon(ga4Data.trend)}
                  <span>{ga4Data.trend === 'up' ? '+' : ga4Data.trend === 'down' ? '-' : ''}{ga4Data.changePercent}%</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Engagement Rate</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{ga4Data.engagementRate.toFixed(1)}%</span>
                <div className={cn('flex items-center gap-1 text-xs', getTrendColor(ga4Data.trend))}>
                  {getTrendIcon(ga4Data.trend)}
                  <span>{ga4Data.trend === 'up' ? '+' : ga4Data.trend === 'down' ? '-' : ''}{ga4Data.changePercent}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Performance Score</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{ga4Data.calculatedScore}/100</span>
                <div className={cn('flex items-center gap-1 text-xs', getTrendColor(ga4Data.trend))}>
                  {getTrendIcon(ga4Data.trend)}
                  <span>{ga4Data.trend === 'up' ? '+' : ga4Data.trend === 'down' ? '-' : ''}{Math.round(parseFloat(ga4Data.changePercent) * 0.3)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GSC Scorecard */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Search className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Search Visibility</h3>
                <p className="text-sm text-gray-600">Google Search Console</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', getScoreColor(gscData.calculatedScore))}>
                <span className="text-white font-bold text-lg">{getScoreGrade(gscData.calculatedScore)}</span>
              </div>
            </div>
          </div>

          {!isGSCConnected && (
            <div className="mb-3">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Using demo data - Connect GSC for live metrics
              </span>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Clicks</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{gscData.totalClicks.toLocaleString()}</span>
                <div className={cn('flex items-center gap-1 text-xs', getTrendColor(gscData.trend))}>
                  {getTrendIcon(gscData.trend)}
                  <span>{gscData.trend === 'up' ? '+' : gscData.trend === 'down' ? '-' : ''}{gscData.changePercent}%</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Visibility Score</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{gscData.calculatedScore}/100</span>
                <div className={cn('flex items-center gap-1 text-xs', getTrendColor(gscData.trend))}>
                  {getTrendIcon(gscData.trend)}
                  <span>{gscData.trend === 'up' ? '+' : gscData.trend === 'down' ? '-' : ''}{Math.round(parseFloat(gscData.changePercent) * 0.4)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Performance Grade</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Grade {getScoreGrade(gscData.calculatedScore)}</span>
                <div className={cn('flex items-center gap-1 text-xs', getTrendColor(gscData.trend))}>
                  {getTrendIcon(gscData.trend)}
                  <span>vs last month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};