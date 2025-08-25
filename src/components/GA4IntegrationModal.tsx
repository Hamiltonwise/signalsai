import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Database, TrendingUp, Users, MousePointer } from 'lucide-react';
import { useGA4Integration } from '../hooks/useGA4Integration';
import { getMTDComparison } from '../utils/dateUtils';

interface GA4IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  ready: boolean;
  session: any;
  onSuccess?: () => void;
}

export const GA4IntegrationModal: React.FC<GA4IntegrationModalProps> = ({
  isOpen,
  onClose,
  clientId,
  ready,
  session,
  onSuccess
}) => {
  const {
    isConnected,
    isLoading,
    properties,
    selectedProperty,
    error,
    setSelectedProperty,
    initiateGA4Connection,
    fetchGA4Data
  } = useGA4Integration(clientId, ready, session);

  const [step, setStep] = useState<'connect' | 'select-property' | 'fetch-data' | 'success'>('connect');
  const [mtdComparison] = useState(() => getMTDComparison());

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Check current connection state when modal opens
      if (isConnected && properties.length > 0) {
        setStep('select-property');
      } else {
        setStep('connect');
      }
    } else {
      // Reset to connect step when modal closes
      setStep('connect');
    }
  }, [isOpen, isConnected, properties.length]);

  // Auto-advance to property selection when connection is successful
  useEffect(() => {
    console.log('GA4 Modal: Connection state changed', { isConnected, propertiesCount: properties.length });
    if (isConnected && properties.length > 0) {
      console.log('GA4 Modal: Auto-advancing to select-property step');
      setStep('select-property');
    }
  }, [isConnected, properties.length]);

  // Listen for popup messages from the ga4-callback function
  useEffect(() => {
    if (!isOpen) return;
    
    const handleGA4Message = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      
     console.log('🎯 GA4 Modal: Received message:', event.data);
     
      if (event.data?.type === 'GA4_AUTH_SUCCESS' && event.data?.properties) {
        console.log('🎯 GA4 Modal: Processing AUTH_SUCCESS with', event.data.properties.length, 'properties');
        
       // Directly update modal state
       const receivedProperties = event.data.properties || [];
       console.log('🎯 GA4 Modal: Setting properties directly:', receivedProperties);
       
       // Update the hook state by calling the hook's message handler
       if (window.ga4IntegrationHook) {
         window.ga4IntegrationHook.handlePropertiesReceived(receivedProperties);
       }
        
        setStep('select-property');
      } else if (event.data?.type === 'GA4_AUTH_ERROR') {
        console.log('🎯 GA4 Modal: Processing AUTH_ERROR:', event.data.error);
        // Error handling is done by the hook
      }
    };

    window.addEventListener('message', handleGA4Message);
    
    return () => {
      window.removeEventListener('message', handleGA4Message);
    };
  }, [isOpen, clientId]);

  // Listen for custom events from the modal's message handler
  useEffect(() => {
    const handlePropertiesReceived = (event: CustomEvent) => {
      console.log('🎯 GA4 Modal: Received properties via custom event', event.detail.properties);
      // This will trigger the hook to update its properties
    };

    window.addEventListener('ga4-properties-received', handlePropertiesReceived);
    
    return () => {
      window.removeEventListener('ga4-properties-received', handlePropertiesReceived);
    };
  }, []);

  // Auto-advance to property selection when connection is successful
  useEffect(() => {
    console.log('GA4 Modal: Connection state changed', { isConnected, propertiesCount: properties.length });
    if (isConnected && properties.length > 0) {
      console.log('GA4 Modal: Auto-advancing to select-property step');
      setStep('select-property');
    }
  }, [isConnected, properties.length]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Check current connection state when modal opens
      if (isConnected && properties.length > 0) {
        setStep('select-property');
      } else {
        setStep('connect');
      }
    } else {
      // Reset to connect step when modal closes
      setStep('connect');
    }
  }, [isOpen, isConnected, properties.length]);

  const handleConnect = async () => {
    try {
      console.log('🎯 GA4 Modal: Starting connection with clientId:', clientId);
      if (!clientId) {
        const error = 'No client ID available. Please refresh the page and try again.';
        console.error('🎯 GA4 Modal:', error);
        throw new Error(error);
      }
      
      console.log('🎯 GA4 Modal: Calling initiateGA4Connection...');
      await initiateGA4Connection();
      console.log('🎯 GA4 Modal: Connection initiated successfully');
      
      // Don't auto-advance here - wait for the message from popup
      console.log('🎯 GA4 Modal: Waiting for popup callback...');
    } catch (error) {
      console.error('🎯 GA4 Modal: Connection failed:', error);
      // Error is handled by the hook, just log it
    }
  };

  const handlePropertySelect = () => {
    console.log('🎯 GA4 Modal: Property select clicked', { selectedProperty });
    if (selectedProperty) {
      setStep('fetch-data');
    }
  };

  const handleFetchData = async () => {
    console.log('🎯 GA4 Modal: Fetch data clicked', { selectedProperty });
    if (!selectedProperty) return;

    console.log('GA4 Modal: Starting data fetch for property:', selectedProperty);
    console.log('GA4 Modal: MTD comparison:', mtdComparison);

    try {
      // Validate property ID format
      if (!selectedProperty.match(/^\d+$/)) {
        throw new Error('Invalid property ID format. Please select a different property.');
      }
      
      await fetchGA4Data(selectedProperty, mtdComparison.current.startDate, mtdComparison.current.endDate);
      console.log('GA4 Modal: Data fetch completed successfully');
      setStep('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('GA4 Modal: Data fetch failed:', err);
      
      // Show specific error message for permission issues
      if (err.message.includes('403') || err.message.includes('PERMISSION_DENIED')) {
        console.error('GA4 Modal: Permission denied - this property may not be accessible');
      }
      // Error is handled by the hook
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Connect Google Analytics 4</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-600">
                <p className="font-medium mb-2">Connection Error:</p>
                <p>{error}</p>
                {error.includes('environment variables') && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800">
                    <p className="font-medium">Setup Required:</p>
                    <ol className="list-decimal list-inside mt-1 space-y-1 text-xs">
                      <li>Go to Supabase Dashboard → Project Settings → Edge Functions</li>
                      <li>Add environment variables: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET</li>
                      <li>Set up Google OAuth in Google Cloud Console</li>
                      <li>Add redirect URI: <code className="bg-white px-1 rounded">{`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ga4-callback`}</code></li>
                      <li>Ensure OAuth consent screen is configured</li>
                      <li>Add test users if app is in testing mode</li>
                    </ol>
                  </div>
                )}
                {error.includes('verification process') && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                    <p className="font-medium">Google App in Testing Mode:</p>
                    <ol className="list-decimal list-inside mt-1 space-y-1 text-xs">
                      <li>Go to <a href="https://console.cloud.google.com/" target="_blank" className="underline">Google Cloud Console</a></li>
                      <li>Navigate to APIs & Services → OAuth consent screen</li>
                      <li>Scroll to "Test users" section</li>
                      <li>Click "+ ADD USERS" and add your Google email (must be exact match)</li>
                      <li>Save and try connecting again</li>
                    </ol>
                    <p className="mt-2 text-xs">Your app is in testing mode - you need to add yourself as a test user to access it.</p>
                  </div>
                )}
                {error.includes('authorization header') && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-800">
                    <p className="font-medium">Environment Variable Issue:</p>
                    <ol className="list-decimal list-inside mt-1 space-y-1 text-xs">
                      <li>Check your <code className="bg-white px-1 rounded">.env</code> file exists in the root directory</li>
                      <li>Verify <code className="bg-white px-1 rounded">VITE_SUPABASE_URL</code> is set</li>
                      <li>Verify <code className="bg-white px-1 rounded">VITE_SUPABASE_ANON_KEY</code> is set</li>
                      <li>Restart your development server after changing .env</li>
                      <li>Check browser console for environment variable debug info</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'connect' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Connect Your Google Analytics
                </h3>
                <p className="text-gray-600 mb-6">
                  Connect your Google Analytics 4 property to start tracking website performance metrics.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-700">Track new and returning users</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">Monitor engagement and conversions</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MousePointer className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-700">Analyze user behavior patterns</span>
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ExternalLink className="w-5 h-5" />
                )}
                {isLoading ? 'Connecting...' : 'Connect with Google'}
              </button>
            </div>
          )}

          {step === 'select-property' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select GA4 Property
                </h3>
                <p className="text-gray-600">
                  Found {properties.length} properties. Choose the one for your dental practice.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Available GA4 Properties
                </label>
                <div className="text-xs text-gray-500 mb-2">
                  Select the property that matches your website domain
                </div>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Select a property...</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.displayName} - {property.accountName}
                      {property.domainHint && property.domainHint !== 'unknown' ? ` [${property.domainHint}]` : ''}
                    </option>
                  ))}
                </select>
                
                {/* Property Selection Helper */}
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">💡 Property Selection Tips:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Look for properties containing "hamiltonwise" in the name</li>
                      <li>Check the account name to ensure it's the correct Google account</li>
                      <li>If unsure, select the property and check the data preview</li>
                    </ul>
                  </div>
                </div>
              </div>

              {properties.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    No GA4 properties found. Make sure you have access to Google Analytics properties with this account.
                  </p>
                </div>
              )}

              <button
                onClick={handlePropertySelect}
                disabled={!selectedProperty}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {step === 'fetch-data' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Fetch Month-to-Date Data
                </h3>
                <p className="text-gray-600">
                  Fetching standardized Month-to-Date data for accurate reporting.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Date Range</h4>
                <div className="text-sm text-blue-800">
                  <p><strong>Current Period:</strong> {mtdComparison.current.description}</p>
                  <p><strong>Comparison Period:</strong> {mtdComparison.previous.description}</p>
                  <p className="text-xs mt-2 text-blue-600">
                    This standardized MTD approach ensures accurate month-over-month comparisons.
                  </p>
                </div>
              </div>

              <button
                onClick={handleFetchData}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Database className="w-5 h-5" />
                )}
                {isLoading ? 'Fetching Data...' : 'Fetch Data'}
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                GA4 Connected Successfully!
              </h3>
              <p className="text-gray-600">
                Your Google Analytics data is now being integrated into your dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};