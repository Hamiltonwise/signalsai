import React from 'react';
import { Calendar } from 'lucide-react';

interface DateRangeSelectorProps {
  selectedRange: '30d' | '90d' | 'custom';
  onRangeChange: (range: '30d' | '90d' | 'custom') => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDateChange?: (startDate: string, endDate: string) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  customStartDate,
  customEndDate,
  onCustomDateChange
}) => {
  const ranges = [
    { value: '30d' as const, label: 'Last 30 days' },
    { value: '90d' as const, label: 'Last 90 days' },
    { value: 'custom' as const, label: 'Custom range' }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-3">
        <Calendar className="w-5 h-5 text-gray-600" />
        <h3 className="font-medium text-gray-900">Date Range</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          {ranges.map((range) => (
            <button
              key={range.value}
              onClick={() => onRangeChange(range.value)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                selectedRange === range.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {selectedRange === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate || ''}
                onChange={(e) => onCustomDateChange?.(e.target.value, customEndDate || '')}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customEndDate || ''}
                onChange={(e) => onCustomDateChange?.(customStartDate || '', e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        Comparing current period vs previous period of same length
      </div>
    </div>
  );
};