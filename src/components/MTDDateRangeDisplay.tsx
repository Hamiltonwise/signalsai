import React from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { type MTDComparison, getMTDDescription } from '../utils/dateUtils';

interface MTDDateRangeDisplayProps {
  comparison: MTDComparison;
  className?: string;
  showDescription?: boolean;
  compact?: boolean;
}

export const MTDDateRangeDisplay: React.FC<MTDDateRangeDisplayProps> = ({
  comparison,
  className = '',
  showDescription = true,
  compact = false
}) => {
  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-xs text-gray-600 ${className}`}>
        <Calendar className="w-3 h-3" />
        <span>{comparison.current.label} vs {comparison.previous.label}</span>
      </div>
    );
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h4 className="font-medium text-blue-900">Month-to-Date Comparison</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div className="bg-white rounded-lg p-3 border border-blue-200">
          <div className="text-xs font-medium text-blue-700 mb-1">Current Period</div>
          <div className="text-sm font-semibold text-gray-900">{comparison.current.label}</div>
          <div className="text-xs text-gray-600">{comparison.current.description}</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-blue-200">
          <div className="text-xs font-medium text-blue-700 mb-1">Previous Period</div>
          <div className="text-sm font-semibold text-gray-900">{comparison.previous.label}</div>
          <div className="text-xs text-gray-600">{comparison.previous.description}</div>
        </div>
      </div>

      {showDescription && (
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">Why Month-to-Date (MTD)?</p>
            <p>MTD comparison eliminates date range confusion by always comparing the same number of days in each month, providing accurate month-over-month performance insights.</p>
          </div>
        </div>
      )}
    </div>
  );
};