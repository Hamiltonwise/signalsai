import React from 'react';
import { Search, Globe, MapPin, MousePointer, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PillarData {
  name: string;
  icon: any;
  score: number;
  trend: 'up' | 'down' | 'stable';
  value: string;
  change: string;
  metrics: Array<{ name: string; value: string; status: 'good' | 'warning' | 'critical' }>;
}

interface KPIPillarsProps {
  ga4Data?: any;
  gscData?: any;
  gbpData?: any;
  clarityData?: any;
  connectionStatus?: {
    ga4: boolean;
    gbp: boolean;
    gsc: boolean;
    clarity: boolean;
  };
}

export const KPIPillars: React.FC<KPIPillarsProps> = ({
  ga4Data,
  gscData,
  gbpData,
  clarityData,
  connectionStatus = { ga4: false, gbp: false, gsc: false, clarity: false }
}) => {
  const pillars: PillarData[] = [
    {
      name: 'Search Visibility',
      icon: Search,
      score: connectionStatus.gsc ? (gscData?.calculatedScore || 0) : 85,
      trend: connectionStatus.gsc ? (gscData?.trend || 'stable') : 'up',
      value: connectionStatus.gsc ? (gscData?.totalClicks?.toLocaleString() || '0') : '1.2K',
      change: connectionStatus.gsc ? `${gscData?.changePercent || '0'}%` : '+15%',
      metrics: [
        { 
          name: 'Total Clicks', 
          value: connectionStatus.gsc ? `${(gscData?.totalClicks || 0).toLocaleString()} clicks` : '1,247 clicks', 
          status: connectionStatus.gsc ? ((gscData?.totalClicks || 0) > 50 ? 'good' : 'warning') : 'good' 
        },
        { 
          name: 'Impressions', 
          value: connectionStatus.gsc ? `${(gscData?.totalImpressions || 0).toLocaleString()} impressions` : '12.4K impressions', 
          status: connectionStatus.gsc ? ((gscData?.totalImpressions || 0) > 1000 ? 'good' : 'warning') : 'good' 
        },
        { 
          name: 'Click-through Rate', 
          value: connectionStatus.gsc ? `${((gscData?.totalClicks || 0) / Math.max(gscData?.totalImpressions || 1, 1) * 100).toFixed(1)}%` : '3.2%', 
          status: connectionStatus.gsc ? (((gscData?.totalClicks || 0) / Math.max(gscData?.totalImpressions || 1, 1) * 100) > 2 ? 'good' : 'warning') : 'warning' 
        }
      ]
    },
    {
      name: 'Website Performance',
      icon: Globe,
      score: connectionStatus.ga4 ? (ga4Data?.calculatedScore || 0) : 72,
      trend: connectionStatus.ga4 ? (ga4Data?.trend || 'stable') : 'stable',
      value: connectionStatus.ga4 ? `${Math.floor((ga4Data?.avgSessionDuration || 0) / 60)}:${Math.floor((ga4Data?.avgSessionDuration || 0) % 60).toString().padStart(2, '0')}` : '2.1s',
      change: connectionStatus.ga4 ? `${ga4Data?.changePercent || '0'}%` : '0%',
      metrics: [
        { 
          name: 'Total Users', 
          value: connectionStatus.ga4 ? (ga4Data?.totalUsers?.toLocaleString() || '0') : '24.5K', 
          status: connectionStatus.ga4 ? (ga4Data?.totalUsers > 1000 ? 'good' : 'warning') : 'good' 
        },
        { 
          name: 'Engagement Rate', 
          value: connectionStatus.ga4 ? `${ga4Data?.engagementRate?.toFixed(1) || '0'}%` : '57.7%', 
          status: connectionStatus.ga4 ? (ga4Data?.engagementRate > 50 ? 'good' : 'warning') : 'good' 
        },
        { 
          name: 'Conversions', 
          value: connectionStatus.ga4 ? (ga4Data?.conversions?.toString() || '0') : '126', 
          status: connectionStatus.ga4 ? (ga4Data?.conversions > 10 ? 'good' : 'warning') : 'good' 
        }
      ]
    },
    {
      name: 'Local Presence',
      icon: MapPin,
      score: connectionStatus.gbp ? (gbpData?.calculatedScore || 0) : 91,
      trend: connectionStatus.gbp ? (gbpData?.trend || 'stable') : 'up',
      value: connectionStatus.gbp ? `${(gbpData?.averageRating || 0).toFixed(1)}★` : '4.9★',
      change: connectionStatus.gbp ? `${gbpData?.changePercent || '0'}%` : '+8%',
      metrics: [
        { 
          name: 'Average Rating', 
          value: connectionStatus.gbp ? `${(gbpData?.averageRating || 0).toFixed(1)}★` : '4.9★', 
          status: connectionStatus.gbp ? (Number(gbpData?.averageRating || 0) >= 4.5 ? 'good' : 'warning') : 'good' 
        },
        { 
          name: 'Total Reviews', 
          value: connectionStatus.gbp ? (gbpData?.totalReviews?.toString() || '0') : '127', 
          status: connectionStatus.gbp ? (Number(gbpData?.totalReviews || 0) > 20 ? 'good' : 'warning') : 'good' 
        },
        { 
          name: 'Phone Calls', 
          value: connectionStatus.gbp && typeof gbpData?.phoneCallsTotal === 'number' ? gbpData.phoneCallsTotal.toString() : '8', 
          status: connectionStatus.gbp ? (Number(gbpData?.phoneCallsTotal || 0) > 5 ? 'good' : 'warning') : 'good' 
        }
      ]
    },
    {
      name: 'User Experience',
      icon: MousePointer,
      score: connectionStatus.clarity ? (clarityData?.calculatedScore || 0) : 68,
      trend: connectionStatus.clarity ? (clarityData?.trend || 'stable') : 'down',
      value: connectionStatus.clarity ? `${clarityData?.bounceRate?.toFixed(1) || '0'}%` : '65%',
      change: connectionStatus.clarity ? `${clarityData?.changePercent || '0'}%` : '-5%',
      metrics: [
        { 
          name: 'Total Sessions', 
          value: connectionStatus.clarity ? (clarityData?.totalSessions?.toLocaleString() || '0') : '15.4K', 
          status: connectionStatus.clarity ? (clarityData?.totalSessions > 1000 ? 'good' : 'warning') : 'good' 
        },
        { 
          name: 'Bounce Rate', 
          value: connectionStatus.clarity ? `${clarityData?.bounceRate?.toFixed(1) || '0'}%` : '32%', 
          status: connectionStatus.clarity ? (clarityData?.bounceRate < 40 ? 'good' : 'warning') : 'good' 
        },
        { 
          name: 'Dead Clicks', 
          value: connectionStatus.clarity ? (clarityData?.deadClicks?.toString() || '0') : '45', 
          status: connectionStatus.clarity ? (clarityData?.deadClicks < 20 ? 'good' : 'critical') : 'warning' 
        }
      ]
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-orange-600 bg-orange-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Performance Pillars</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div key={pillar.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getScoreBg(pillar.score)}`}>
                    <Icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{pillar.name}</h3>
                    <div className="flex items-center space-x-1">
                      <span className={`text-2xl font-bold ${getScoreColor(pillar.score)}`}>
                        {pillar.score}
                      </span>
                      <span className="text-sm text-gray-500">/100</span>
                    </div>
                  </div>
                </div>
                {getTrendIcon(pillar.trend)}
              </div>
              
              <div className="space-y-2">
                {pillar.metrics.map((metric) => (
                  <div key={metric.name} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{metric.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(metric.status)}`}>
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};