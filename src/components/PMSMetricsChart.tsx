import React, { useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, UserCheck, Calendar } from 'lucide-react';

interface MonthlyPMSData {
  month: string;
  selfReferred: number; // Count of self-referred patients for the month
  drReferred: number; // Count of doctor-referred patients for the month
  totalPatientsMonth: number; // Total patients for the month
  production: number; // Total production for the month
}

interface PMSMetricsChartProps {
  monthlyData: MonthlyPMSData[];
  totalPatients: number; // Total referral events
  totalProduction: number; // Renamed from totalRevenue
  trend: 'up' | 'down' | 'stable';
  changePercent: string;
  isLoading?: boolean;
}

const PMSMetricsChart: React.FC<PMSMetricsChartProps> = ({
  monthlyData,
  totalPatients,
  totalProduction,
  trend,
  changePercent,
  isLoading = false
}) => {
  // Ensure monthlyData is always an array to prevent undefined errors
  const safeMonthlyData = monthlyData || [];

  // Debug the incoming data
  useEffect(() => {
    console.log('=== PMSMetricsChart: Props Debug ===');
    console.log('monthlyData received:', safeMonthlyData);
    console.log('monthlyData length:', safeMonthlyData.length);
    console.log('totalPatients:', totalPatients);
    console.log('totalProduction:', totalProduction);
    console.log('isLoading:', isLoading);
    
    if (safeMonthlyData.length > 0) {
      console.log('Sample monthlyData item:', safeMonthlyData[0]);
      console.log('All months in data:', safeMonthlyData.map(d => d.month));
    }
  }, [safeMonthlyData, totalPatients, totalProduction, isLoading]);

  // Generate full year data (Jan-Dec) with zeros for missing months
  const generateFullYearData = (): MonthlyPMSData[] => {
    const currentYear = new Date().getFullYear();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    console.log('=== PMSMetricsChart: Generating Full Year Data ===');
    console.log('Monthly data provided:', safeMonthlyData.length, 'months');
    console.log('Monthly data keys:', safeMonthlyData.map(d => d.month));

    return months.map((month, index) => {
      const monthKey = `${currentYear}-${(index + 1).toString().padStart(2, '0')}`;
      const existingData = safeMonthlyData.find(d => d.month === monthKey);
      
      console.log(`Processing ${month} (${monthKey}):`, {
        hasData: !!existingData,
        selfReferred: existingData?.selfReferred || 0,
        drReferred: existingData?.drReferred || 0,
        totalPatientsMonth: existingData?.totalPatientsMonth || 0,
        production: existingData?.production || 0
      });
      
      return {
        month: month,
        selfReferred: existingData?.selfReferred || 0, // Monthly self-referred count
        drReferred: existingData?.drReferred || 0, // Monthly doctor-referred count
        totalPatientsMonth: existingData?.totalPatientsMonth || 0, // Monthly total patients
        production: existingData?.production || 0 // Monthly production
      };
    });
  };

  const fullYearData = generateFullYearData();
  
  // Calculate max value for scaling bars
  const maxValue = Math.max(
    ...fullYearData.map(d => d.totalPatientsMonth),
    1 // Minimum of 1 to avoid division by zero
  );

  // Calculate totals for summary
  const totalSelfReferred = fullYearData.reduce((sum, d) => sum + d.selfReferred, 0);
  const totalDrReferred = fullYearData.reduce((sum, d) => sum + d.drReferred, 0);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Monthly Patient Referrals</h3>
            <p className="text-sm text-gray-600">Loading PMS data...</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading practice data...</p>
        </div>
      </div>
    );
  }


  // Show message if no data is available - fix the condition
  if (totalPatients === 0 && !isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Monthly Patient Referrals</h3>
            <p className="text-sm text-gray-600">Practice Management System • {new Date().getFullYear()}</p>
          </div>
        </div>
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No PMS data available</p>
          <p className="text-sm text-gray-400">Upload your practice management data to see patient referral trends</p>
          <div className="mt-4">
            <button 
              onClick={() => window.location.href = '/upload'}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Upload PMS Data
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Monthly Patient Referrals</h3>
            <p className="text-sm text-gray-600">Practice Management System • {new Date().getFullYear()}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{totalPatients}</div>
          <div className="text-sm text-gray-600">Total Referral Events</div>
          <div className={`flex items-center gap-1 text-sm ${getTrendColor()} mt-1`}>
            {getTrendIcon()}
            <span>{trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{changePercent}%</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm font-medium text-gray-700">Self-Referrals</span>
          <span className="text-sm text-gray-500">({totalSelfReferred})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm font-medium text-gray-700">Doctor Referrals</span>
          <span className="text-sm text-gray-500">({totalDrReferred})</span>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {fullYearData.map((monthData, index) => {
          const selfPercent = maxValue > 0 ? (monthData.selfReferred / maxValue) * 100 : 0;
          const drPercent = maxValue > 0 ? (monthData.drReferred / maxValue) * 100 : 0;
          const hasData = monthData.selfReferred > 0 || monthData.drReferred > 0;
          const currentMonth = new Date().getMonth();
          const isCurrentMonth = index === currentMonth;
          const isFutureMonth = index > currentMonth;


          return (
            <div key={monthData.month} className={`relative ${isFutureMonth ? 'opacity-40' : ''}`}>
              {/* Month Label */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium w-8 ${
                    isCurrentMonth ? 'text-indigo-600 font-bold' : 'text-gray-700'
                  }`}>
                    {monthData.month}
                  </span>
                  {isCurrentMonth && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  {hasData && (
                    <>
                      <span>Self: {monthData.selfReferred}</span>
                      <span>Dr: {monthData.drReferred}</span>
                      <span>Total: {monthData.totalPatientsMonth}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Horizontal Bars */}
              <div className="space-y-1">
                {/* Self-Referrals Bar */}
                <div className="relative">
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-700 ease-out relative"
                      style={{ width: `${selfPercent}%` }}
                    >
                      {monthData.selfReferred > 0 && (
                        <div className="absolute right-2 top-0 h-full flex items-center">
                          <span className="text-white text-xs font-medium">
                            {monthData.selfReferred}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Doctor Referrals Bar */}
                <div className="relative">
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-700 ease-out relative"
                      style={{ width: `${drPercent}%` }}
                    >
                      {monthData.drReferred > 0 && (
                        <div className="absolute right-2 top-0 h-full flex items-center">
                          <span className="text-white text-xs font-medium">
                            {monthData.drReferred}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* No Data Indicator */}
              {!hasData && !isFutureMonth && (
                <div className="text-center py-2">
                  <span className="text-xs text-gray-400">No data</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{totalSelfReferred}</div>
            <div className="text-xs text-gray-600">Self-Referrals YTD</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{totalDrReferred}</div>
            <div className="text-xs text-gray-600">Dr Referrals YTD</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{totalPatients}</div>
            <div className="text-xs text-gray-600">Total Referral Events</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              ${totalProduction > 0 ? (totalProduction / 1000).toFixed(0) + 'K' : '0'}
            </div>
            <div className="text-xs text-gray-600">Revenue YTD</div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {totalPatients > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Referral Insights</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <strong>Self-referral rate:</strong> {((totalSelfReferred / totalPatients) * 100).toFixed(1)}% 
                  ({totalSelfReferred} of {totalPatients} referral events)
                </p>
                <p>
                  <strong>Doctor referral rate:</strong> {((totalDrReferred / totalPatients) * 100).toFixed(1)}%
                  ({totalDrReferred} of {totalPatients} referral events)
                </p>
                {totalProduction > 0 && (
                  <p>
                    <strong>Average production per referral event:</strong> ${(totalProduction / totalPatients).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
                <p>
                  <strong>Month-to-Date Performance:</strong> Comparing {new Date().toLocaleDateString('en-US', { month: 'long' })} 1-{new Date().getDate()} vs same period last month
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {totalPatients === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No PMS data available</p>
          <p className="text-sm text-gray-400">Upload your practice management data to see patient referral trends</p>
        </div>
      )}
    </div>
  );
};

export default PMSMetricsChart;