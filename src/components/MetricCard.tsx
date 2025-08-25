import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
  description?: string;
  dataSource?: 'GA4' | 'GSC' | 'GBP' | 'Clarity';
  isInverse?: boolean; // For metrics like Average Position where lower is better
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon, 
  color, 
  description,
  dataSource,
  isInverse = false
}) => {
  const getTrendColor = () => {
    if (trend === 'stable') return 'text-gray-600';
    
    // For inverse metrics (like Average Position), flip the color logic
    if (isInverse) {
      return trend === 'up' ? 'text-red-600' : 'text-green-600';
    }
    
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = () => {
    if (trend === 'stable') return <Minus className="w-4 h-4" />;
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const getDataSourceBadge = () => {
    if (!dataSource) return null;
    
    const badgeColors = {
      GA4: 'bg-blue-100 text-blue-800',
      GSC: 'bg-red-100 text-red-800',
      GBP: 'bg-green-100 text-green-800',
      Clarity: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={cn('px-2 py-1 text-xs rounded-full font-medium', badgeColors[dataSource])}>
        {dataSource}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={cn('p-3 rounded-lg', color)}>
          {icon}
        </div>
        <div className="flex items-center gap-2">
          {getDataSourceBadge()}
          <div className={cn('flex items-center gap-1 text-sm font-medium', getTrendColor())}>
            {getTrendIcon()}
            <span>{change}</span>
          </div>
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
      {description && (
        <div className="text-xs text-gray-500 mt-1">{description}</div>
      )}
    </div>
  );
};