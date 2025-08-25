import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Database, TrendingUp, Users, MousePointer, Search, Star, BarChart3, Eye, CheckCircle } from 'lucide-react';
import { useIntegrations } from '../hooks/useIntegrations';
import { useGBPIntegration } from '../hooks/useGBPIntegration';
import { useGSCIntegration } from '../hooks/useGSCIntegration';
import { useClarityIntegration } from '../hooks/useClarityIntegration';
import { getMTDComparison } from '../utils/dateUtils';

interface BaseIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess?: () => void;
  ready?: boolean;
  session?: any;
}

// Google Business Profile Integration Modal
export const GBPIntegrationModal: React.FC<BaseIntegrationModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onSuccess,
  ready,
  session
}) => {
  const { 
    isConnected,
    isLoading, 
    error, 
    locations, 
    selectedLocations, 
    setSelectedLocations, 
    initiateGBPConnection,
    fetchGBPData
  } = useGBPIntegration(clientId, ready, session);
  const [step, setStep] = useState<'connect' | 'select-location' | 'fetch-data' | 'success'>('connect');
  const [mtdComparison] = useState(() => getMTDComparison());

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('connect');
    }
  }, [isOpen]);

  // Auto-advance to location selection when connected
  useEffect(() => {
    if (isConnected && locations.length > 0 && step === 'connect') {
      setStep('select-location');
    }
  }, [isConnected, locations]);

  // Listen for popup messages from the gbp-callback function
  useEffect(() => {
    const handleGBPMessage = (event: MessageEvent) => {
      console.log('🏢 GBP Modal: Received message', { type: event.data.type, origin: event.origin });
      
      if (event.data.type === 'GBP_AUTH_SUCCESS') {
        console.log('🏢 GBP Modal: AUTH_SUCCESS received', {
          locationsCount: event.data.locations?.length || 0,
          locations: event.data.locations?.map(l => ({ id: l.id, name: l.displayName })) || []
        });
        // The hook will handle the state updates, just move to location selection
        setStep('select-location');
      } else if (event.data.type === 'GBP_AUTH_ERROR') {
        console.log('🏢 GBP Modal: AUTH_ERROR received', { error: event.data.error });
        // Error is handled by the hook
      }
    };

    window.addEventListener('message', handleGBPMessage);
    
    return () => {
      window.removeEventListener('message', handleGBPMessage);
    };
  }, []);

  const handleConnect = async () => {
    console.log('GBP Modal: Starting connection with clientId:', clientId)
    if (!clientId) {
      throw new Error('No client ID available. Please refresh the page and try again.')
    }
    console.log('🏢 GBP Modal: Connect button clicked');
    try {
      await initiateGBPConnection();
      console.log('🏢 GBP Modal: Connection initiated successfully');
    } catch (err) {
      console.error('🏢 GBP Modal: Connection failed', err);
      // Error is handled by the hook
    }
  };

  const handleLocationSelect = () => {
    console.log('🏢 GBP Modal: Location select clicked', { selectedLocations });
    if (selectedLocations.length > 0) {
      setStep('fetch-data');
    }
  };

  const handleFetchData = async () => {
    console.log('🏢 GBP Modal: Fetch data clicked', { selectedLocations });
    if (selectedLocations.length === 0) return;

    try {
      await fetchGBPData(selectedLocations, mtdComparison.current.startDate, mtdComparison.current.endDate);
      console.log('🏢 GBP Modal: Data fetch completed successfully');
      setStep('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('🏢 GBP Modal: Data fetch failed', err);
      // Error is handled by the hook
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Connect Google Business Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" /> 
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p> 
            </div>
          )}

          {step === 'connect' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Connect Your Google Business Profile
                </h3>
                <p className="text-gray-600 mb-6">
                  Track your local search performance, reviews, and customer interactions.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">Monitor customer calls and visits</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-gray-700">Track reviews and ratings</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Search className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-700">Analyze local search visibility</span>
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
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

          {step === 'select-location' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select GBP Location(s)
                </h3>
                <p className="text-gray-600">
                  Found {locations.length} location(s). You can select one location or multiple locations.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Available Locations
                </label>
                
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {locations.map((location) => (
                    <label key={location.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLocations.includes(location.id)}
                        onChange={(e) => {
                          console.log('🏢 GBP Modal: Location checkbox changed:', {
                            locationId: location.id,
                            locationName: location.displayName,
                            checked: e.target.checked,
                            currentSelected: selectedLocations
                          });
                          if (e.target.checked) {
                            setSelectedLocations([...selectedLocations, location.id]);
                          } else {
                            setSelectedLocations(selectedLocations.filter(id => id !== location.id));
                          }
                        }}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{location.displayName}</div>
                        <div className="text-sm text-gray-500">{location.accountName}</div>
                      </div>
                    </label>
                  ))}
                </div>
                
                {selectedLocations.length > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>{selectedLocations.length} location(s) selected:</strong> 
                      {selectedLocations.length === 1 
                        ? ' Data will be fetched for this location.'
                        : ' Data will be aggregated across all selected locations for unified reporting.'
                      }
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedLocations(locations.map(l => l.id))}
                    className="flex-1 px-3 py-2 text-sm text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedLocations([])}
                    className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {locations.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    No GBP locations found. Make sure you have access to Google Business Profile locations with this account.
                  </p>
                </div>
              )}

              <button
                onClick={handleLocationSelect}
                disabled={selectedLocations.length === 0}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {selectedLocations.length === 1 
                  ? `Continue with ${locations.find(l => l.id === selectedLocations[0])?.displayName || 'selected location'}`
                  : `Continue with ${selectedLocations.length} locations`
                }
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
                  Fetching and aggregating Month-to-Date data from {selectedLocations.length} location(s).
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Date Range</h4>
                <div className="text-sm text-blue-800">
                  <p><strong>Current Period:</strong> {mtdComparison.current.description}</p>
                  <p><strong>Comparison Period:</strong> {mtdComparison.previous.description}</p>
                  <p><strong>Locations:</strong> {selectedLocations.length} selected 
                    {selectedLocations.length === 1 ? ' (single location data)' : ' (aggregated data)'}
                  </p>
                  <p className="text-xs mt-2 text-blue-600">
                    {selectedLocations.length === 1 
                      ? 'Data will be fetched specifically for your selected location.'
                      : 'Data from all selected locations will be aggregated for unified reporting.'
                    }
                  </p>
                </div>
              </div>

              <button
                onClick={handleFetchData}
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
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
                GBP Connected Successfully!
              </h3>
              <p className="text-gray-600">
                Your Google Business Profile data from {selectedLocations.length === 1 
                  ? 'your selected location is' 
                  : `${selectedLocations.length} locations are`
                } now being integrated into your dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Google Search Console Integration Modal
export const GSCIntegrationModal: React.FC<BaseIntegrationModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onSuccess,
  ready,
  session
}) => {
  const { 
    isConnected,
    isLoading,
    sites,
    selectedSite, 
    setSelectedSite, 
    error,
    initiateGSCConnection,
    fetchAndStoreGSCData, 
    getStoredGSCMetrics
  } = useGSCIntegration(clientId, ready, session);

  const [step, setStep] = useState<'connect' | 'select-site' | 'fetch-data' | 'success'>('connect');
  const [mtdComparison] = useState(() => getMTDComparison());

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('connect');
      setSelectedSite('');
    }
  }, [isOpen]);

  // Auto-advance to property selection when connected
  useEffect(() => {
    if (isConnected && sites.length > 0) {
      setStep('select-site');
    }
  }, [isConnected, sites]);

  // Listen for popup messages from the gsc-callback function
  useEffect(() => {
    const handleGSCMessage = (event: MessageEvent) => {
      if (event.data.type === 'GSC_AUTH_SUCCESS') {
        console.log('Modal received GSC_AUTH_SUCCESS:', event.data);
        // The hook will handle the state updates, just move to property selection
        setStep('select-site');
      } else if (event.data.type === 'GSC_AUTH_ERROR') {
        console.log('Received GSC_AUTH_ERROR message:', event.data);
        // Error is handled by the hook
      }
    };

    window.addEventListener('message', handleGSCMessage);
    
    return () => {
      window.removeEventListener('message', handleGSCMessage);
    };
  }, []);

  const handleConnect = async () => {
    console.log('GSC Modal: Starting connection with clientId:', clientId)
    if (!clientId) {
      throw new Error('No client ID available. Please refresh the page and try again.')
    }
    try {
      await initiateGSCConnection();
    } catch (err) {
      console.error('GSC connection failed:', err);
      // Error is handled by the hook
    }
  };

  const handleSiteSelect = () => {
    if (selectedSite) {
      setStep('fetch-data');
    }
  };

  const handleFetchData = async () => {
    if (!selectedSite) return;

    try {
      await fetchAndStoreGSCData(selectedSite, mtdComparison.current.startDate, mtdComparison.current.endDate);
      setStep('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Connect Google Search Console</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
                      <li>Add redirect URI: <code className="bg-white px-1 rounded">{`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gsc-callback`}</code></li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'connect' && (
            <div className="space-y-4">
            <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Connect Your Search Console
              </h3>
              <p className="text-gray-600 mb-6">
                Monitor your website's search performance and discover optimization opportunities.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Eye className="w-5 h-5 text-red-600" />
                <span className="text-sm text-gray-700">Track search impressions and clicks</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">Monitor keyword rankings</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-700">Analyze click-through rates</span>
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ExternalLink className="w-5 h-5" />
              )}
              {isLoading ? 'Connecting...' : 'Connect with Google'}
            </button>
            </div>
            </div>
          )}

          {step === 'select-site' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select GSC Site
                </h3>
                <p className="text-gray-600">
                  Found {sites.length} sites. Choose the one for your website.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Available Sites
                </label>
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Select a site...</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {sites.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    No GSC sites found. Make sure you have access to Google Search Console properties with this account.
                  </p>
                </div>
              )}

              <button
                onClick={handleSiteSelect}
                disabled={!selectedSite}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
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
                GSC Connected Successfully!
              </h3>
              <p className="text-gray-600">
                Your Google Search Console data is now being integrated into your dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Microsoft Clarity Integration Modal
export const ClarityIntegrationModal: React.FC<BaseIntegrationModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onSuccess
}) => {
  const { connectClarity, isLoading, error } = useIntegrations(clientId);
  const clarityIntegration = useClarityIntegration(clientId);
  const [apiToken, setApiToken] = useState('');
  const [projectId, setProjectId] = useState('');
  const [step, setStep] = useState<'connect' | 'success'>('connect');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('connect');
      setApiToken('');
      setProjectId('');
    }
  }, [isOpen]);
  const handleConnect = async () => {
    try {
      if (!apiToken.trim()) {
        throw new Error('API token is required');
      }
      
      await clarityIntegration.connectClarity(apiToken, projectId);
      setStep('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Clarity connection failed:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Connect Microsoft Clarity</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {step === 'connect' && (
            <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MousePointer className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Connect Microsoft Clarity
              </h3>
              <p className="text-gray-600 mb-6">
                Analyze user behavior with heatmaps and session recordings.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MousePointer className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-700">Track user interactions and clicks</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-700">View session recordings</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-gray-700">Generate heatmaps</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clarity API Token
              </label>
              <input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter your Clarity API token"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find your API token in your Clarity dashboard under Settings → API
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project ID (Optional)
              </label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter your Clarity project ID"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Specify which Clarity project to connect
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={isLoading || !apiToken.trim()}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Database className="w-5 h-5" />
              )}
              {isLoading ? 'Connecting...' : 'Connect Clarity'}
            </button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Clarity Connected Successfully!
              </h3>
              <p className="text-gray-600">
                Your Microsoft Clarity integration is now active and will start collecting user experience data.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Connection established</span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  User experience insights will appear in your dashboard within 24 hours
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};