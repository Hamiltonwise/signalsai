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

export const KPIPillars: React.FC = () => {
  const pillars: PillarData[] = [
    {
      name: 'Search Visibility',
      icon: Search,
      score: 85,
      trend: 'up',
      value: '1.2K',
      change: '+15%',
      metrics: [
        { name: 'Keyword Rankings', value: '24 in top 10', status: 'good' },
        { name: 'Organic Traffic', value: '1,247 visits', status: 'good' },
        { name: 'Click-through Rate', value: '3.2%', status: 'warning' }
      ]
    },
    {
      name: 'Website Performance',
      icon: Globe,
      score: 72,
      trend: 'stable',
      value: '2.1s',
      change: '0%',
      metrics: [
        { name: 'Page Load Speed', value: '2.1 seconds', status: 'warning' },
        { name: 'Mobile Friendly', value: '98% score', status: 'good' },
        { name: 'Bounce Rate', value: '32%', status: 'good' }
      ]
    },
    {
      name: 'Local Presence',
      icon: MapPin,
      score: 91,
      trend: 'up',
      value: '4.9',
      change: '+8%',
      metrics: [
        { name: 'Google Reviews', value: '4.9 stars (127)', status: 'good' },
        { name: 'Local Rankings', value: '#1 in 3 areas', status: 'good' },
        { name: 'Review Response', value: '95% rate', status: 'good' }
      ]
    },
    {
      name: 'User Experience',
      icon: MousePointer,
      score: 68,
      trend: 'down',
      value: '65%',
      change: '-5%',
      metrics: [
        { name: 'Conversion Rate', value: '4.2%', status: 'warning' },
        { name: 'Form Completion', value: '78%', status: 'warning' },
        { name: 'Appointment Bookings', value: '23 this week', status: 'critical' }
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