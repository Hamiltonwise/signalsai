import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { useClient } from '../contexts/ClientContext';
import { useAuthReady } from '../hooks/useAuthReady';

interface ReferralSource {
  source: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

interface ReferralSourcesMatrixProps {
  monthlyData: Array<{
    month: string;
    selfReferred: number;
    drReferred: number;
    totalPatientsMonth: number;
    production: number;
  }>;
  rawData?: Array<{
    date: string;
    referral_type: string;
    referral_source?: string;
    production_amount: number;
  }>;
  isLoading?: boolean;
}

const ReferralSourcesMatrix: React.FC<ReferralSourcesMatrixProps> = ({
  monthlyData,
  rawData = [],
  isLoading = false
}) => {
  const { ready, session } = useAuthReady();
  const { clientId } = useClient();
  const [viewMode, setViewMode] = useState<'annual' | 'monthly'>('annual');
  const [annualSources, setAnnualSources] = useState<ReferralSource[]>([]);
  const [monthlySources, setMonthlySources] = useState<ReferralSource[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fetchedRawData, setFetchedRawData] = useState<any[]>([]);

  useEffect(() => {
    // Gate fetch behind auth readiness
    if (!ready || !session || !clientId) {
      console.log('ReferralSourcesMatrix: Waiting for auth ready state');
      return;
    }
    
    if (!isLoading) {
      // Always fetch fresh data to ensure we have the latest uploads
      fetchRawPMSData();
    }
  }, [ready, session, clientId, viewMode, isLoading]);

  const fetchRawPMSData = async () => {
    try {
      if (!clientId) {
        console.log('No client ID available for fetching raw PMS data');
        return;
      }

      setIsLoadingData(true);
      const currentDate = new Date();
      const startDate = new Date(currentDate.getFullYear(), 0, 1).toISOString().split('T')[0];
      const endDate = currentDate.toISOString().split('T')[0];
      
      console.log('=== ReferralSourcesMatrix: Fetching Raw PMS Data ===');
      console.log('Client ID:', clientId);
      console.log('Date range:', { startDate, endDate });
      
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/pms-raw-data?clientId=${encodeURIComponent(clientId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          console.log('=== ReferralSourcesMatrix: Raw Data Fetched ===');
          console.log('Records found:', result.data.length);
          console.log('Sample record:', result.data[0]);
          
          setFetchedRawData(result.data);
          // Update rawData state and recalculate
          calculateReferralSourcesWithData(result.data);
        } else {
          console.log('ReferralSourcesMatrix: No data returned from API');
          setFetchedRawData([]);
          calculateReferralSourcesWithData([]);
        }
      } else {
        console.error('ReferralSourcesMatrix: API request failed:', response.status);
        setFetchedRawData([]);
        calculateReferralSourcesWithData([]);
      }
    } catch (error) {
      console.error('Error fetching raw PMS data:', error);
      setFetchedRawData([]);
      calculateReferralSourcesWithData([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const calculateReferralSourcesWithData = (dataToProcess: any[]) => {
    console.log('=== ReferralSourcesMatrix: Calculating Sources ===');
    console.log('Processing', dataToProcess.length, 'records');
    console.log('Date range in data:', {
      earliest: dataToProcess.length > 0 ? Math.min(...dataToProcess.map(r => r.date)) : 'none',
      latest: dataToProcess.length > 0 ? Math.max(...dataToProcess.map(r => r.date)) : 'none'
    });
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = `${currentYear}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (dataToProcess.length > 0) {
      console.log('Sample raw data:', dataToProcess.slice(0, 3));
    }

    // Filter data for annual view (current year) - include ALL months
    const annualData = dataToProcess.filter(record => 
      record.date.startsWith(currentYear.toString())
    );

    // Filter data for monthly view (current month only)
    const monthlyDataFiltered = dataToProcess.filter(record => 
      record.date.startsWith(currentMonth)
    );
    
    console.log('=== Data Filtering Results ===');
    console.log('Annual data (current year):', annualData.length, 'records');
    console.log('Annual data months covered:', [...new Set(annualData.map(r => r.date.substring(0, 7)))].sort());
    console.log('Monthly data (current month):', monthlyDataFiltered.length, 'records');

    // Enhanced helper function to get meaningful labels without overwriting real data
    const getLabel = (val: any, fallback: string): string => {
      if (typeof val === 'string' && val.trim() !== '') {
        return val.trim();
      }
      return fallback;
    };

    // Normalize string values for consistent grouping (handles case/whitespace issues)
    const normalizeForGrouping = (val: any): string => {
      if (typeof val === 'string' && val.trim() !== '') {
        return val.trim().toLowerCase();
      }
      return '';
    };
    // Calculate annual sources
    const annualSourceMap = new Map<string, { count: number; production: number }>();
    annualData.forEach(record => {
      // Use strict fallback logic that preserves real data
      let displaySource: string;
      let groupingKey: string;
      
      // Priority order: referral_source > referral_type > appointment_type > treatment_category
      if (typeof record.referral_source === 'string' && record.referral_source.trim() !== '') {
        displaySource = getLabel(record.referral_source, '(Not Provided)');
        groupingKey = normalizeForGrouping(record.referral_source);
      } else if (typeof record.referral_type === 'string' && record.referral_type.trim() !== '') {
        displaySource = getLabel(record.referral_type, '(Not Provided)');
        groupingKey = normalizeForGrouping(record.referral_type);
      } else if (typeof record.appointment_type === 'string' && record.appointment_type.trim() !== '') {
        displaySource = `${getLabel(record.appointment_type, 'General')} (Appointment)`;
        groupingKey = normalizeForGrouping(record.appointment_type);
      } else if (typeof record.treatment_category === 'string' && record.treatment_category.trim() !== '') {
        displaySource = `${getLabel(record.treatment_category, 'General')} (Treatment)`;
        groupingKey = normalizeForGrouping(record.treatment_category);
      } else {
        displaySource = '(Not Provided)';
        groupingKey = '(not provided)';
      }
      
      // Use groupingKey for consistent grouping, displaySource for display
      const mapKey = groupingKey || '(not provided)';
      
      const existing = annualSourceMap.get(mapKey) || { count: 0, production: 0, displayName: displaySource };
      annualSourceMap.set(mapKey, {
        count: existing.count + 1,
        production: existing.production + (record.production_amount || 0),
        displayName: existing.displayName || displaySource
      });
    });

    // Calculate monthly sources
    const monthlySourceMap = new Map<string, { count: number; production: number }>();
    monthlyDataFiltered.forEach(record => {
      // Use strict fallback logic that preserves real data
      let displaySource: string;
      let groupingKey: string;
      
      // Priority order: referral_source > referral_type > appointment_type > treatment_category
      if (typeof record.referral_source === 'string' && record.referral_source.trim() !== '') {
        displaySource = getLabel(record.referral_source, '(Not Provided)');
        groupingKey = normalizeForGrouping(record.referral_source);
      } else if (typeof record.referral_type === 'string' && record.referral_type.trim() !== '') {
        displaySource = getLabel(record.referral_type, '(Not Provided)');
        groupingKey = normalizeForGrouping(record.referral_type);
      } else if (typeof record.appointment_type === 'string' && record.appointment_type.trim() !== '') {
        displaySource = `${getLabel(record.appointment_type, 'General')} (Appointment)`;
        groupingKey = normalizeForGrouping(record.appointment_type);
      } else if (typeof record.treatment_category === 'string' && record.treatment_category.trim() !== '') {
        displaySource = `${getLabel(record.treatment_category, 'General')} (Treatment)`;
        groupingKey = normalizeForGrouping(record.treatment_category);
      } else {
        displaySource = '(Not Provided)';
        groupingKey = '(not provided)';
      }
      
      // Use groupingKey for consistent grouping, displaySource for display
      const mapKey = groupingKey || '(not provided)';
      
      const existing = monthlySourceMap.get(mapKey) || { count: 0, production: 0, displayName: displaySource };
      monthlySourceMap.set(mapKey, {
        count: existing.count + 1,
        production: existing.production + (record.production_amount || 0),
        displayName: existing.displayName || displaySource
      });
    });

    // Convert to arrays and calculate percentages
    const totalAnnual = annualData.length;
    const totalMonthly = monthlyDataFiltered.length;

    const annualSourcesArray = Array.from(annualSourceMap.entries())
      .map(([groupKey, data]) => ({
        source: data.displayName,
        count: data.count,
        percentage: totalAnnual > 0 ? (data.count / totalAnnual) * 100 : 0,
        trend: 'stable' as const,
        changePercent: 0,
        production: data.production
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    const monthlySourcesArray = Array.from(monthlySourceMap.entries())
      .map(([groupKey, data]) => ({
        source: data.displayName,
        count: data.count,
        percentage: totalMonthly > 0 ? (data.count / totalMonthly) * 100 : 0,
        trend: 'stable' as const,
        changePercent: 0,
        production: data.production
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    setAnnualSources(annualSourcesArray);
    setMonthlySources(monthlySourcesArray);
    
    console.log('=== Final Referral Sources ===');
    console.log('Annual sources:', annualSourcesArray.length);
    console.log('Monthly sources:', monthlySourcesArray.length);
    if (annualSourcesArray.length > 0) {
      console.log('Top annual source:', annualSourcesArray[0]);
    }
  };

  // Use fetched data or provided rawData
  const dataToUse = fetchedRawData.length > 0 ? fetchedRawData : rawData;
  const currentSources = viewMode === 'annual' ? annualSources : monthlySources;
  const maxCount = Math.max(...currentSources.map(s => s.count), 1);

  if (isLoading || isLoadingData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Top Referral Sources</h3>
            <p className="text-sm text-gray-600">Loading referral data...</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">
            {isLoadingData ? 'Fetching referral data...' : 'Analyzing referral sources...'}
          </p>
        </div>
      </div>
    );
  }

  // Show message if no data is available
  if (dataToUse.length === 0 && !isLoading && !isLoadingData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Top Referral Sources</h3>
            <p className="text-sm text-gray-600">Practice Management System</p>
          </div>
        </div>
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No referral data available</p>
          <p className="text-sm text-gray-400">Upload PMS data to see referral source breakdown</p>
          <div className="mt-4">
            <button 
              onClick={() => window.location.href = '/upload'}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
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
          <div className="p-2 bg-purple-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Top Referral Sources</h3>
            <p className="text-sm text-gray-600">
              {viewMode === 'annual' ? 'Current year performance' : 'Current month performance'}
            </p>
          </div>
        </div>
        
        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('annual')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'annual'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'monthly'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Sources List */}
      <div className="space-y-4">
        {currentSources.length === 0 && dataToUse.length > 0 && !isLoading && !isLoadingData ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No referral sources found for {viewMode === 'annual' ? 'this year' : 'this month'}</p>
            <p className="text-sm text-gray-400">
              Data may be available for other time periods
            </p>
          </div>
        ) : (
          currentSources.map((source, index) => (
            <div key={source.source} className="relative">
              {/* Source Info */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-purple-700">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{source.source}</h4>
                    <p className="text-xs text-gray-500">
                      {source.percentage.toFixed(1)}% of total referrals
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{source.count}</div>
                  <div className="text-xs text-gray-500">referrals</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(source.count / maxCount) * 100}%` }}
                />
              </div>

              {/* Production Info */}
              {source.production > 0 && (
                <div className="text-xs text-gray-600">
                  Production: ${source.production.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {currentSources.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="mb-4 text-center">
            <span className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded-full">
              📊 Real Data • {dataToUse.length} total records processed
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {currentSources.reduce((sum, s) => sum + s.count, 0)}
              </div>
              <div className="text-xs text-gray-600">
                Total {viewMode === 'annual' ? 'Annual' : 'Monthly'} Referrals
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {currentSources.length}
              </div>
              <div className="text-xs text-gray-600">Active Sources</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {currentSources.length > 0 ? currentSources[0].percentage.toFixed(1) : 0}%
              </div>
              <div className="text-xs text-gray-600">Top Source Share</div>
            </div>
          </div>
        </div>
      )}

      {/* Period Indicator */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
        <Calendar className="w-3 h-3" />
        <span>
          {viewMode === 'annual' 
            ? `${new Date().getFullYear()} Year-to-Date` 
            : `${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          }
          {dataToUse.length > 0 && ` • ${dataToUse.length} records`}
        </span>
      </div>
    </div>
  );
};

export default ReferralSourcesMatrix;