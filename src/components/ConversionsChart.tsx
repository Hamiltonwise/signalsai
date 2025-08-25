import React from 'react';
import { BarChart3, Target, MousePointer, Phone, Mail } from 'lucide-react';

interface ConversionData {
  goalName: string;
  conversions: number;
  percentage: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface ConversionsChartProps {
  totalConversions: number;
  conversionData: ConversionData[];
  isConnected: boolean;
  dataSource: 'GA4';
}

export const ConversionsChart: React.FC<ConversionsChartProps> = ({
  totalConversions,
  conversionData,
  isConnected,
  dataSource
}) => {
  const getIcon = (goalName: string) => {
    if (goalName.toLowerCase().includes('form')) return <Mail className="w-4 h-4" />;
    if (goalName.toLowerCase().includes('phone') || goalName.toLowerCase().includes('call')) return <Phone className="w-4 h-4" />;
    if (goalName.toLowerCase().includes('click')) return <MousePointer className="w-4 h-4" />;
    return <Target className="w-4 h-4" />;
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Conversions by Goal</h3>
            <p className="text-sm text-gray-600">Google Analytics 4 • Last 30 days vs previous 30 days</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{totalConversions}</div>
          <div className="text-sm text-gray-600">Total Conversions</div>
        </div>
      </div>

      {!isConnected && (
        <div className="mb-4">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Using demo data - Connect GA4 for live conversion tracking
          </span>
        </div>
      )}

      <div className="space-y-4">
        {conversionData.map((goal, index) => (
          <div key={index} className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-gray-100 rounded">
                  {getIcon(goal.goalName)}
                </div>
                <span className="font-medium text-gray-900">{goal.goalName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">{goal.conversions}</span>
                <span className={`text-sm font-medium ${getTrendColor(goal.trend)}`}>
                  {goal.change > 0 ? '+' : ''}{goal.change}%
                </span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${goal.percentage}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{goal.percentage.toFixed(1)}% of total</span>
              <span>{goal.conversions} conversions</span>
            </div>
          </div>
        ))}
      </div>

      {conversionData.length === 0 && (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No conversion goals configured</p>
          <p className="text-sm text-gray-400">Set up goals in Google Analytics to track conversions</p>
        </div>
      )}
    </div>
  );
};