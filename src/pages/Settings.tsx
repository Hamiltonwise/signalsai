import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, CreditCard, LogOut, Save, Globe, Trash2, ExternalLink, CheckCircle, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthReady } from '../hooks/useAuthReady';
import { supabase } from '../lib/supabaseClient';
import { AuthService } from '../utils/authService';
import { apiClient } from '../utils/apiClient';
import { useClient } from '../contexts/ClientContext';
import { useIntegrations } from '../hooks/useIntegrations';
import { useGA4Integration } from '../hooks/useGA4Integration';
import { useGBPIntegration } from '../hooks/useGBPIntegration';
import { useGSCIntegration } from '../hooks/useGSCIntegration';
import { useClarityIntegration } from '../hooks/useClarityIntegration';
import { GA4IntegrationModal } from '../components/GA4IntegrationModal';
import { GBPIntegrationModal, GSCIntegrationModal, ClarityIntegrationModal } from '../components/IntegrationModals';
import { MondayIntegrationModal } from '../components/MondayIntegrationModal';

// Fast loading fallback component
const FastLoader = () => (
  <div className="animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  </div>
);

export default function Settings() {
  const { ready, session } = useAuthReady();
  const { clientId } = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Integration modal states
  const [showGA4Modal, setShowGA4Modal] = useState(false);
  const [showGBPModal, setShowGBPModal] = useState(false);
  const [showGSCModal, setShowGSCModal] = useState(false);
  const [showClarityModal, setShowClarityModal] = useState(false);
  const [showMondayModal, setShowMondayModal] = useState(false);
  
  // Welcome message state for new users
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // Check for welcome state from navigation
  useEffect(() => {
    if (location.state?.showWelcome) {
      setShowWelcome(true);
      setWelcomeMessage(location.state.message || 'Welcome to your dashboard!');
      // Clear the state to prevent showing again on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state]);

  // Initialize integrations hooks
  const integrations = useIntegrations(clientId);
  const ga4Integration = useGA4Integration(clientId, ready, session);
  const gbpIntegration = useGBPIntegration(clientId, ready, session);
  const gscIntegration = useGSCIntegration(clientId, ready, session);
  const clarityIntegration = useClarityIntegration(clientId);
  const [mondayConnected, setMondayConnected] = useState(false);

  // Check Monday.com connection status
  useEffect(() => {
    if (clientId) {
      const storedConnection = localStorage.getItem(`monday_connected_${clientId}`);
      setMondayConnected(storedConnection === 'true');
    }
  }, [clientId]);
  
  // Listen for GBP connection updates
  useEffect(() => {
    const handleGBPUpdate = () => {
      // Force refresh of integration states
      setTimeout(() => {
        gbpIntegration.refreshData?.();
      }, 1000);
    };
    
    window.addEventListener('gbp-connection-updated', handleGBPUpdate);
    
    return () => {
      window.removeEventListener('gbp-connection-updated', handleGBPUpdate);
    };
  }, []);

  // Apply same loading optimization pattern as Dashboard
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 50);
    return () => clearTimeout(timer);
  }, []);

  // Optimized profile fetch - same pattern as other components
  useEffect(() => {
    if (!ready || !session) return;
    
    const fetchUserProfile = async () => {
      try {
        setIsLoadingProfile(true);
        setProfileError(null);
        
        // Fast API call with proper error handling
        const response = await apiClient.getUserProfile();

        if (response.success && response.data) {
          setUserProfile(response.data);
        } else {
          // Immediate fallback to prevent loading delays
          const authUser = session.user;
          setUserProfile({
            id: authUser.id,
            email: authUser.email,
            first_name: authUser.user_metadata?.first_name || '',
            last_name: authUser.user_metadata?.last_name || '',
            role: 'user',
            email_notifications_enabled: true,
            weekly_reports_enabled: true,
            performance_alerts_enabled: true,
            data_sharing_enabled: false,
            usage_analytics_enabled: true,
            last_login: authUser.last_sign_in_at,
            created_at: authUser.created_at
          });
        }
      } catch (error) {
        // Silent fallback for better UX
        const authUser = session.user;
        setUserProfile({
          id: authUser.id,
          email: authUser.email,
          first_name: authUser.user_metadata?.first_name || '',
          last_name: authUser.user_metadata?.last_name || '',
          role: 'user',
          email_notifications_enabled: true,
          weekly_reports_enabled: true,
          performance_alerts_enabled: true,
          data_sharing_enabled: false,
          usage_analytics_enabled: true
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [ready, session]);

  const handleSavePreferences = async (preferences: any) => {
    // Store original values for rollback
    const originalProfile = { ...userProfile };
    
    // Optimistically update UI first for better UX
    setUserProfile(prev => ({ ...prev, ...preferences }));
    
    try {
      setSaveError(null);
      setSaveSuccess(false);
      setIsSaving(true);
      
      console.log('=== Saving Preferences ===');
      console.log('Preferences to save:', preferences);
      
      const response = await apiClient.updateUserPreferences(preferences);
      
      console.log('=== Save Response ===');
      console.log('Success:', response.success);
      console.log('Data:', response.data);
      console.log('Error:', response.error);
      
      if (response.success && response.data) {
        // Update with server response to ensure consistency
        setUserProfile(prev => ({ ...prev, ...response.data }));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        // Rollback optimistic update on failure
        setUserProfile(originalProfile);
        throw new Error(response.error || 'Failed to save preferences - server error');
      }
      
    } catch (error) {
      // Rollback optimistic update on error
      setUserProfile(originalProfile);
      
      console.error('=== Save Preferences Error ===');
      console.error('Error details:', error);
      
      let errorMessage = 'Failed to save preferences';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error - please check your connection and try again';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'Connection error - please refresh the page and try again';
        } else {
          errorMessage = error.message;
        }
      }
      
      setSaveError(errorMessage);
      
      // Clear error after 5 seconds
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    // Use centralized sign-out route
    navigate('/signout', { replace: true });
  };

  const handleDisconnectIntegration = async (platform: string) => {
    try {
      console.log(`Disconnecting ${platform} integration...`);
      
      // Clear localStorage for this integration
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(`${platform}_`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log(`Cleared ${keysToRemove.length} localStorage keys for ${platform}`);
      
      // Call the disconnect API endpoint
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disconnect-integration`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform, clientId })
      });
      
      if (response.ok) {
        console.log(`Successfully disconnected ${platform}`);
      } else {
        console.log(`API disconnect failed for ${platform}, but localStorage cleared`);
      }
      
      // Force page reload to update all connection states
      window.location.reload();
    } catch (error) {
      console.error(`Error disconnecting ${platform}:`, error);
      // Still try to clear localStorage even if API call fails
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(`${platform}_`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      window.location.reload();
    }
  };

  // Fast loading state - only show while auth is being determined
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Fast redirect without showing UI
  if (!session) {
    window.location.href = '/signin';
    return null;
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Settings</h1>
          <p className="text-gray-500 text-lg font-medium">Manage your account preferences and settings</p>
        </div>

        {saveSuccess && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Settings saved successfully!
            </div>
          </div>
        )}

        {saveError && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            Error: {saveError}
          </div>
        )}

        <div className="grid gap-6">
          {/* Profile Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-gray-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
            </div>
            
            {isLoadingProfile ? (
              <FastLoader />
            ) : userProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">{userProfile.first_name} {userProfile.last_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{userProfile.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <p className="text-gray-900 capitalize">{userProfile.role}</p>
                </div>
              </div>
            ) : profileError ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">Failed to load profile</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <FastLoader />
            )}
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md">
            <div className="flex items-center mb-4">
              <Bell className="w-5 h-5 text-gray-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
              {isSaving && (
                <div className="ml-auto flex items-center gap-2 text-sm text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              )}
            </div>
            
            {!userProfile ? (
              <FastLoader />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive email updates about your account</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="email_notifications"
                      checked={userProfile?.email_notifications_enabled ?? true}
                      disabled={isSaving}
                      onChange={(e) => {
                        handleSavePreferences({ email_notifications_enabled: e.target.checked });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Weekly Reports</h3>
                    <p className="text-sm text-gray-500">Get weekly performance summaries</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="weekly_reports"
                      checked={userProfile?.weekly_reports_enabled ?? true}
                      disabled={isSaving}
                      onChange={(e) => {
                        handleSavePreferences({ weekly_reports_enabled: e.target.checked });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Performance Alerts</h3>
                    <p className="text-sm text-gray-500">Get notified about significant changes</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="performance_alerts"
                      checked={userProfile?.performance_alerts_enabled ?? true}
                      disabled={isSaving}
                      onChange={(e) => {
                        handleSavePreferences({ performance_alerts_enabled: e.target.checked });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md">
            <div className="flex items-center mb-4">
              <Shield className="w-5 h-5 text-gray-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Privacy Settings</h2>
              {isSaving && (
                <div className="ml-auto flex items-center gap-2 text-sm text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              )}
            </div>
            
            {!userProfile ? (
              <FastLoader />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Data Sharing</h3>
                    <p className="text-sm text-gray-500">Allow anonymous data sharing for service improvement</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="data_sharing"
                      checked={userProfile?.data_sharing_enabled ?? false}
                      disabled={isSaving}
                      onChange={(e) => {
                        handleSavePreferences({ data_sharing_enabled: e.target.checked });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Usage Analytics</h3>
                    <p className="text-sm text-gray-500">Help us improve by sharing usage patterns</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="usage_analytics"
                      checked={userProfile?.usage_analytics_enabled ?? true}
                      disabled={isSaving}
                      onChange={(e) => {
                        handleSavePreferences({ usage_analytics_enabled: e.target.checked });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* API Connections Management */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md">
            <div className="flex items-center mb-4">
              <Globe className="w-5 h-5 text-gray-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">API Connections</h2>
            </div>
            
            <div className="space-y-4">
              {/* Google Analytics 4 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${ga4Integration.isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Google Analytics 4</h3>
                    <p className="text-sm text-gray-500">
                      {ga4Integration.isConnected 
                        ? `✅ Connected • ${ga4Integration.properties?.length || 0} properties available`
                        : 'Track website performance and user behavior'
                      }
                    </p>
                    {ga4Integration.isConnected && ga4Integration.selectedProperty && (
                      <p className="text-xs text-blue-600 mt-1">
                        🎯 Active: {ga4Integration.properties?.find(p => p.id === ga4Integration.selectedProperty)?.displayName || 'Unknown Property'}
                      </p>
                    )}
                    {ga4Integration.isConnected && !ga4Integration.selectedProperty && ga4Integration.properties?.length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => setShowGA4Modal(true)}
                          className="text-xs text-orange-600 hover:text-orange-700 underline font-medium"
                        >
                          ⚠️ Select from {ga4Integration.properties.length} available properties
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ga4Integration.isConnected ? (
                    <div className="flex items-center gap-2">
                      {!ga4Integration.selectedProperty && ga4Integration.properties?.length > 0 && (
                        <button
                          onClick={() => setShowGA4Modal(true)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-orange-600 hover:text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                        >
                          <Wifi className="w-3 h-3" />
                          Select Property
                        </button>
                      )}
                      {ga4Integration.selectedProperty && (
                        <button
                          onClick={() => setShowGA4Modal(true)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Wifi className="w-3 h-3" />
                          Change Property
                        </button>
                      )}
                      <button
                        onClick={() => handleDisconnectIntegration('ga4')}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <WifiOff className="w-3 h-3" />
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowGA4Modal(true)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Wifi className="w-3 h-3" />
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Google Business Profile */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${gbpIntegration.isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Google Business Profile</h3>
                    <p className="text-sm text-gray-500">
                      {gbpIntegration.isConnected 
                        ? `✅ Connected • ${gbpIntegration.selectedLocations.length} of ${gbpIntegration.locations.length} locations selected`
                        : 'Monitor local search performance and reviews'
                      }
                    </p>
                    {gbpIntegration.isConnected && gbpIntegration.selectedLocations.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        🎯 Active: {gbpIntegration.selectedLocations.length === 1 
                          ? gbpIntegration.locations.find(l => l.id === gbpIntegration.selectedLocations[0])?.displayName || 'Unknown Location'
                          : `${gbpIntegration.selectedLocations.length} locations (aggregated data)`
                        }
                      </p>
                    )}
                    {gbpIntegration.isConnected && gbpIntegration.selectedLocations.length === 0 && gbpIntegration.locations.length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => setShowGBPModal(true)}
                          className="text-xs text-orange-600 hover:text-orange-700 underline font-medium"
                        >
                          ⚠️ Select from {gbpIntegration.locations.length} available locations
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {gbpIntegration.isConnected ? (
                    <button
                      onClick={() => handleDisconnectIntegration('gbp')}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <WifiOff className="w-3 h-3" />
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowGBPModal(true)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <Wifi className="w-3 h-3" />
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Google Search Console */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${gscIntegration.isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Google Search Console</h3>
                    <p className="text-sm text-gray-500">
                      {gscIntegration.isConnected 
                        ? `Connected • ${gscIntegration.sites.length} sites available`
                        : 'Track search rankings and click-through rates'
                      }
                    </p>
                    {gscIntegration.isConnected && gscIntegration.selectedSite && (
                      <p className="text-xs text-blue-600 mt-1">
                        Active: {gscIntegration.sites.find(s => s.id === gscIntegration.selectedSite)?.displayName || 'Unknown Site'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {gscIntegration.isConnected ? (
                    <button
                      onClick={() => handleDisconnectIntegration('gsc')}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <WifiOff className="w-3 h-3" />
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowGSCModal(true)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Wifi className="w-3 h-3" />
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Microsoft Clarity */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${clarityIntegration.isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Microsoft Clarity</h3>
                    <p className="text-sm text-gray-500">
                      {clarityIntegration.isConnected 
                        ? 'Connected • User experience insights active'
                        : 'Analyze user experience with heatmaps'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {clarityIntegration.isConnected ? (
                    <button
                      onClick={() => handleDisconnectIntegration('clarity')}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <WifiOff className="w-3 h-3" />
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowClarityModal(true)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-purple-600 hover:text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      <Wifi className="w-3 h-3" />
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Monday.com */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${mondayConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Practice Tasks</h3>
                    <p className="text-sm text-gray-500">
                      {mondayConnected 
                        ? '✅ Connected • Task management active'
                        : 'Connect your practice to view team tasks'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {mondayConnected ? (
                    <button
                      onClick={() => handleDisconnectIntegration('monday')}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <WifiOff className="w-3 h-3" />
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowMondayModal(true)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Wifi className="w-3 h-3" />
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Connection Status Summary */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-900">Connection Status</h4>
              </div>
              <div className="text-sm text-blue-800">
                <p>
                  {[ga4Integration.isConnected, gbpIntegration.isConnected, gscIntegration.isConnected, clarityIntegration.isConnected, mondayConnected].filter(Boolean).length} of 5 tools connected
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Connected tools provide live data to your dashboard. Monday.com provides task management integration.
                </p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md">
            <div className="flex items-center mb-4">
              <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
            </div>
            
            {!userProfile ? (
              <FastLoader />
            ) : (
             <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                  <p className="text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                  <p className="text-gray-900">
                    {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={() => {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
              }}
              disabled={!userProfile}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Preferences Auto-Saved
            </button>
            
            <button
              onClick={handleLogout}
              disabled={isSigningOut}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {isSigningOut ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Integration Modals */}
      <GA4IntegrationModal
        isOpen={showGA4Modal}
        onClose={() => setShowGA4Modal(false)}
        clientId={clientId}
        ready={ready}
        session={session}
        onSuccess={() => {
          setShowGA4Modal(false);
          integrations.fetchIntegrations();
        }}
      />
      
      <GBPIntegrationModal
        isOpen={showGBPModal}
        onClose={() => setShowGBPModal(false)}
        clientId={clientId}
        ready={ready}
        session={session}
        onSuccess={() => {
          setShowGBPModal(false);
          integrations.fetchIntegrations();
        }}
      />
      
      <GSCIntegrationModal
        isOpen={showGSCModal}
        onClose={() => setShowGSCModal(false)}
        clientId={clientId}
        ready={ready}
        session={session}
        onSuccess={() => {
          setShowGSCModal(false);
          integrations.fetchIntegrations();
        }}
      />
      
      <ClarityIntegrationModal
        isOpen={showClarityModal}
        onClose={() => setShowClarityModal(false)}
        clientId={clientId}
        onSuccess={() => {
          setShowClarityModal(false);
          integrations.fetchIntegrations();
        }}
      />
      
      <MondayIntegrationModal
        isOpen={showMondayModal}
        onClose={() => setShowMondayModal(false)}
        clientId={clientId}
        onSuccess={() => {
          setShowMondayModal(false);
          setMondayConnected(true);
          localStorage.setItem(`monday_connected_${clientId}`, 'true');
        }}
      />
    </div>
  );
}