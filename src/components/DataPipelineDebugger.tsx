import React, { useState } from 'react';
import { Bug, Database, Search, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface DataPipelineDebuggerProps {
  clientId: string | null;
}

const DataPipelineDebugger: React.FC<DataPipelineDebuggerProps> = ({ clientId }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Early return after all hooks are called to maintain consistent hook order
  if (process.env.NODE_ENV === 'production' || !clientId) {
    return null;
  }

  const testBasicFunction = async () => {
    setIsRunning(true);
    try {
      console.log('=== TESTING BASIC FUNCTION ===');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/test-verify-function`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      });

      console.log('Test function response status:', response.status);
      const result = await response.json();
      console.log('Test function result:', result);
      setTestResults(result);
    } catch (error) {
      console.error('Test function failed:', error);
      setTestResults({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const runDatabaseVerification = async () => {
    setIsRunning(true);
    try {
      console.log('=== RUNNING DATABASE VERIFICATION ===');
      console.log('Using URL:', `${SUPABASE_URL}/functions/v1/verify-pms-data?clientId=${clientId}`);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-pms-data?clientId=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      });

      console.log('Verify function response status:', response.status);
      console.log('Verify function response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Verify function raw response:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        result = { error: `Invalid JSON response: ${responseText}` };
      }
      
      console.log('Database verification result:', result);
      setDebugResults(result);
    } catch (error) {
      console.error('Database verification failed:', error);
      setDebugResults({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const runRawDataCheck = async () => {
    try {
      console.log('=== RUNNING RAW DATA CHECK ===');
      
      const currentDate = new Date();
      const startDate = new Date(currentDate.getFullYear(), 0, 1).toISOString().split('T')[0];
      const endDate = currentDate.toISOString().split('T')[0];
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/pms-raw-data?clientId=${clientId}&startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      console.log('Raw data check result:', result);
      
      // Analyze the raw data for category fields
      if (result.success && result.data) {
        const categoryStats = {
          total: result.data.length,
          withReferralSource: result.data.filter(r => r.referral_source && r.referral_source.trim() !== '').length,
          withAppointmentType: result.data.filter(r => r.appointment_type && r.appointment_type.trim() !== '').length,
          withTreatmentCategory: result.data.filter(r => r.treatment_category && r.treatment_category.trim() !== '').length,
          sampleSources: [...new Set(result.data.filter(r => r.referral_source).map(r => r.referral_source))].slice(0, 5),
          sampleAppointments: [...new Set(result.data.filter(r => r.appointment_type).map(r => r.appointment_type))].slice(0, 5),
          sampleTreatments: [...new Set(result.data.filter(r => r.treatment_category).map(r => r.treatment_category))].slice(0, 5)
        };
        
        console.log('=== RAW DATA CATEGORY ANALYSIS ===', categoryStats);
      }
    } catch (error) {
      console.error('Raw data check failed:', error);
    }
  };

  const runDirectDatabaseQuery = async () => {
    try {
      console.log('=== RUNNING DIRECT DATABASE QUERY ===');
      
      // Query the last 10 records directly
      const response = await fetch(`${SUPABASE_URL}/functions/v1/pms-raw-data?clientId=${clientId}&startDate=2025-01-01&endDate=2025-12-31`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      console.log('Direct database query result:', result);
      
      if (result.success && result.data) {
        console.log('=== DIRECT DATABASE ANALYSIS ===');
        console.log('Total records found:', result.data.length);
        console.log('Sample records with category fields:', result.data.slice(0, 5).map(r => ({
          date: r.date,
          referral_source: r.referral_source,
          appointment_type: r.appointment_type,
          treatment_category: r.treatment_category
        })));
      }
    } catch (error) {
      console.error('Direct database query failed:', error);
    }
  };

  const runFullDiagnostic = async () => {
    await runDatabaseVerification();
    await runRawDataCheck();
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors"
        title="Data Pipeline Debugger"
      >
        <Bug className="w-5 h-5" />
      </button>
      
      {isVisible && (
        <div className="absolute bottom-16 left-0 bg-white border border-gray-300 rounded-lg shadow-xl p-6 w-96 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Pipeline Debugger
            </h4>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="text-sm">
              <strong>Client ID:</strong> {clientId}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={testBasicFunction}
                disabled={isRunning}
                className="flex-1 bg-gray-600 text-white py-2 px-3 rounded text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isRunning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                Test Function
              </button>
              
              <button
                onClick={runDatabaseVerification}
                disabled={isRunning}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isRunning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                DB Check
              </button>
              
              <button
                onClick={runRawDataCheck}
                className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 flex items-center justify-center gap-1"
              >
                <Search className="w-3 h-3" />
                Raw Data
              </button>
              
              <button
                onClick={runDirectDatabaseQuery}
                className="flex-1 bg-yellow-600 text-white py-2 px-3 rounded text-sm hover:bg-yellow-700 flex items-center justify-center gap-1"
              >
                <Database className="w-3 h-3" />
                Direct Query
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={runFullDiagnostic}
                disabled={isRunning}
                className="flex-1 bg-purple-600 text-white py-2 px-3 rounded text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Bug className="w-3 h-3" />
                Full Test
              </button>
            </div>
            
            {testResults && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
                <div className="font-medium mb-2">Test Function Results:</div>
                {testResults.error ? (
                  <div className="text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Error: {testResults.error}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Function Working: {testResults.success ? 'Yes' : 'No'}
                    </div>
                    <div>Message: {testResults.message}</div>
                    <div>Timestamp: {testResults.timestamp}</div>
                  </div>
                )}
                
                <details className="mt-2">
                  <summary className="cursor-pointer text-gray-600">Raw Test Results</summary>
                  <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </details>
              </div>
            )}
            
            {debugResults && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
                <div className="font-medium mb-2">Debug Results:</div>
                {debugResults.error ? (
                  <div className="text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Error: {debugResults.error}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Total Records: {debugResults.data?.total_count || 0}
                    </div>
                    
                    {debugResults.data?.category_analysis && (
                      <div className="space-y-1">
                        <div>Records with referral_source: {debugResults.data.category_analysis.records_with_referral_source}</div>
                        <div>Records with appointment_type: {debugResults.data.category_analysis.records_with_appointment_type}</div>
                        <div>Records with treatment_category: {debugResults.data.category_analysis.records_with_treatment_category}</div>
                        
                        {debugResults.data.category_analysis.sample_referral_sources.length > 0 && (
                          <div>
                            <strong>Sample Sources:</strong>
                            <div className="ml-2 text-gray-600">
                              {debugResults.data.category_analysis.sample_referral_sources.slice(0, 3).join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <details className="mt-2">
                  <summary className="cursor-pointer text-gray-600">Raw Results</summary>
                  <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                    {JSON.stringify(debugResults, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            Check browser console for detailed logs
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPipelineDebugger;