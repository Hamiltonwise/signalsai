import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, Database, Globe, Eye, Settings } from 'lucide-react';

interface DiagnosticPanelProps {
  clientId: string;
  ga4Data?: any;
  gscData?: any;
  ga4Connected: boolean;
  gscConnected: boolean;
  ga4SelectedProperty?: string;
  gscSelectedSite?: string;
}

interface DiagnosticResult {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({
  clientId,
  ga4Data,
  gscData,
  ga4Connected,
  gscConnected,
  ga4SelectedProperty,
  gscSelectedSite
}) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // 1. Environment Variables Check
    results.push({
      category: 'Environment',
      test: 'Supabase URL',
      status: import.meta.env.VITE_SUPABASE_URL ? 'pass' : 'fail',
      message: import.meta.env.VITE_SUPABASE_URL ? 'Supabase URL configured' : 'VITE_SUPABASE_URL missing',
      details: { url: import.meta.env.VITE_SUPABASE_URL }
    });

    results.push({
      category: 'Environment',
      test: 'Supabase Anon Key',
      status: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'pass' : 'fail',
      message: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Anon key configured' : 'VITE_SUPABASE_ANON_KEY missing',
      details: { keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0 }
    });

    // 2. Edge Functions Connectivity
    try {
      const healthResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-check`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        }
      });
      
      results.push({
        category: 'Connectivity',
        test: 'Edge Functions',
        status: healthResponse.ok ? 'pass' : 'fail',
        message: healthResponse.ok ? 'Edge functions accessible' : `Edge functions error: ${healthResponse.status}`,
        details: { status: healthResponse.status, url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-check` }
      });
    } catch (error) {
      results.push({
        category: 'Connectivity',
        test: 'Edge Functions',
        status: 'fail',
        message: `Edge functions unreachable: ${error.message}`,
        details: { error: error.message }
      });
    }

    // 3. GSC Specific Diagnostics
    if (gscConnected) {
      // Check stored GSC site selection
      const storedSite = localStorage.getItem(`gsc_selected_site_${clientId}`);
      const isHamiltonwise = storedSite?.includes('hamiltonwise') || false;
      
      results.push({
        category: 'GSC',
        test: 'Site Selection',
        status: isHamiltonwise ? 'pass' : 'warning',
        message: isHamiltonwise ? 'Hamiltonwise site selected' : 'Non-hamiltonwise site selected',
        details: { 
          storedSite, 
          currentSelection: gscSelectedSite,
          isHamiltonwise 
        }
      });

      // Check GSC data freshness
      if (gscData) {
        const expectedRange = { min: 20, max: 200 }; // MTD expectations for hamiltonwise
        const actualImpressions = gscData.totalImpressions || 0;
        const isRealistic = actualImpressions >= expectedRange.min && actualImpressions <= expectedRange.max;
        
        results.push({
          category: 'GSC',
          test: 'Data Validation',
          status: isRealistic ? 'pass' : 'warning',
          message: isRealistic ? 'GSC data within expected range' : `GSC impressions (${actualImpressions}) outside expected range (${expectedRange.min}-${expectedRange.max})`,
          details: { 
            actualImpressions, 
            expectedRange, 
            isRealistic,
            totalClicks: gscData.totalClicks,
            averagePosition: gscData.averagePosition
          }
        });
      }

      // Test GSC API connectivity
      try {
        const gscResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gsc-metrics?clientId=${clientId}&startDate=2024-01-01&endDate=2024-01-31`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          }
        });
        
        results.push({
          category: 'GSC',
          test: 'API Connectivity',
          status: gscResponse.ok ? 'pass' : 'fail',
          message: gscResponse.ok ? 'GSC API responding' : `GSC API error: ${gscResponse.status}`,
          details: { status: gscResponse.status }
        });
      } catch (error) {
        results.push({
          category: 'GSC',
          test: 'API Connectivity',
          status: 'fail',
          message: `GSC API unreachable: ${error.message}`,
          details: { error: error.message }
        });
      }
    }

    // 4. GA4 Diagnostics
    if (ga4Connected) {
      const storedProperty = localStorage.getItem(`ga4_selected_property_${clientId}`);
      
      results.push({
        category: 'GA4',
        test: 'Property Selection',
        status: storedProperty ? 'pass' : 'warning',
        message: storedProperty ? 'GA4 property selected' : 'No GA4 property stored',
        details: { 
          storedProperty, 
          currentSelection: ga4SelectedProperty 
        }
      });
    }

    // 5. LocalStorage Audit
    const lsKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('gsc_') || key.includes('ga4_') || key.includes('client'))) {
        lsKeys.push({
          key,
          value: localStorage.getItem(key)?.substring(0, 100) + '...'
        });
      }
    }

    results.push({
      category: 'Storage',
      test: 'LocalStorage Audit',
      status: lsKeys.length > 0 ? 'pass' : 'warning',
      message: `Found ${lsKeys.length} relevant localStorage entries`,
      details: { keys: lsKeys }
    });

    setDiagnostics(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'fail': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-50 border-green-200 text-green-800';
      case 'fail': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  const clearAllGSCData = () => {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('gsc_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    alert(`Cleared ${keysToRemove.length} GSC localStorage entries. Please reconnect GSC.`);
    window.location.reload();
  };

  useEffect(() => {
    runDiagnostics();
  }, [clientId, ga4Data, gscData, ga4Connected, gscConnected]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">System Diagnostics</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {diagnostics.map((result, index) => (
          <div key={index} className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}>
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(result.status)}
              <span className="font-medium text-sm">{result.category}: {result.test}</span>
            </div>
            <div className="text-xs">{result.message}</div>
            {showDetails && result.details && (
              <details className="mt-2">
                <summary className="text-xs cursor-pointer opacity-75">Technical Details</summary>
                <pre className="text-xs mt-1 p-2 bg-black bg-opacity-10 rounded overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
        <div className="flex gap-2">
          <button
            onClick={clearAllGSCData}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Clear All GSC Data
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              alert('All localStorage cleared. Please sign in again.');
              window.location.href = '/signin';
            }}
            className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
          >
            Reset All Data
          </button>
        </div>
      </div>

      {/* GSC Specific Debug Info */}
      {gscConnected && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">GBP Debug Information</h4>
          <div className="text-xs space-y-1 text-gray-600">
            <div><strong>Client ID:</strong> {clientId}</div>
            <div><strong>Selected Location:</strong> {gbpSelectedLocation || 'None'}</div>
            <div><strong>Stored Location:</strong> {localStorage.getItem(`gbp_selected_location_${clientId}`) || 'None'}</div>
            <div><strong>Available Locations:</strong> {gbpLocations?.length || 0}</div>
            {gbpData && (
              <>
                <div><strong>Total Views:</strong> {gbpData.totalViews}</div>
                <div><strong>Phone Calls:</strong> {gbpData.phoneCallsTotal}</div>
                <div><strong>Website Clicks:</strong> {gbpData.websiteClicksTotal}</div>
                <div><strong>Average Rating:</strong> {gbpData.averageRating?.toFixed(1)}</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};