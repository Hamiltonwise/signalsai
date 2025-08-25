import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Users, BarChart3, Search, Eye, MousePointer, FileText, CheckCircle, AlertTriangle, Activity, Globe, Zap, DollarSign, Building2, ExternalLink, Bug, Brain, Target, Lightbulb } from 'lucide-react';
import { lazy, Suspense, useMemo } from 'react';
import { GA4IntegrationModal } from '../components/GA4IntegrationModal';
import { GBPIntegrationModal, GSCIntegrationModal, ClarityIntegrationModal } from '../components/IntegrationModals';
import { PMSUploadModal } from '../components/PMSUploadModal';
import { VitalSignsScore } from '../components/VitalSignsScore';
import { GrowthFocusedKPICard } from '../components/GrowthFocusedKPICard';
import { EnhancedMetricCard } from '../components/EnhancedMetricCard';
import { VitalSignsCard } from '../components/VitalSignsCard';
import { KPIPillars } from '../components/KPIPillars';
import { NextBestAction } from '../components/NextBestAction';
import { ConnectionDebugPanel } from '../components/ConnectionDebugPanel';
import { useGA4Integration } from '../hooks/useGA4Integration';
import { useGBPIntegration } from '../hooks/useGBPIntegration';
import { useGSCIntegration } from '../hooks/useGSCIntegration';
import { useClarityIntegration } from '../hooks/useClarityIntegration';
import { usePMSData } from '../hooks/usePMSData';
import { useClient } from '../contexts/ClientContext';
import { useVitalSignsAI } from '../hooks/useVitalSignsAI';

// Lazy load heavy components to improve initial load time
const TaskTrackingPlaceholder = lazy(() => import('../components/TaskTrackingPlaceholder'));
const ReferralSourcesMatrix = lazy(() => import('../components/ReferralSourcesMatrix'));
const PMSMetricsChart = lazy(() => import('../components/PMSMetricsChart'));
const DataPipelineDebugger = lazy(() => import('../components/DataPipelineDebugger'));

import { AuthService } from '../utils/authService';
import { useAuthReady } from '../hooks/useAuthReady';

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

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, trend, icon, color }) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />;
      case 'down': return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
          {getTrendIcon()}
          <span>{change}</span>
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  );
};

export default function Dashboard() {
  // CRITICAL: All hooks must be called at the top level before any conditional returns
  // This ensures consistent hook order on every render (Rules of Hooks)
  
  // Always call all hooks first, before any conditional logic
  const { ready, session } = useAuthReady();
  const { clientId, clients, isLoading: clientLoading, error: clientError } = useClient();
  const ga4Integration = useGA4Integration(clientId, ready, session);
  const gbpIntegration = useGBPIntegration(clientId, ready, session);
  const gscIntegration = useGSCIntegration(clientId, ready, session);
  const clarityIntegration = useClarityIntegration(clientId);
  const pmsData = usePMSData(clientId, ready, session);
  const vitalSignsAI = useVitalSignsAI(clientId);
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showGA4Modal, setShowGA4Modal] = useState(false);
  const [showGBPModal, setShowGBPModal] = useState(false);
  const [showGSCModal, setShowGSCModal] = useState(false);
  const [showClarityModal, setShowClarityModal] = useState(false);
  const [showPMSUpload, setShowPMSUpload] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Critical loading optimization - prevents render blocking
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 50);
    return () => clearTimeout(timer);
  }, []);

  // Fast connection status check from localStorage (no API calls)
  const connectionStatus = useMemo(() => {
    if (!clientId) return { ga4: false, gbp: false, gsc: false, clarity: false };
    
    return {
      ga4: ga4Integration.isConnected,
      gbp: gbpIntegration.isConnected,
      gsc: gscIntegration.isConnected,
      clarity: clarityIntegration.isConnected
    };
  }, [clientId, ga4Integration.isConnected, gbpIntegration.isConnected, gscIntegration.isConnected, clarityIntegration.isConnected]);

  // Enhanced metrics aggregation for AI analysis
  const aggregatedMetrics = useMemo(() => {
    return {
      ga4: ga4Integration.metrics ? {
        totalUsers: ga4Integration.metrics.totalUsers,
        newUsers: ga4Integration.metrics.newUsers,
        engagementRate: ga4Integration.metrics.engagementRate,
        conversions: ga4Integration.metrics.conversions,
        avgSessionDuration: ga4Integration.metrics.avgSessionDuration,
        calculatedScore: ga4Integration.metrics.calculatedScore
      } : null,
      gbp: gbpIntegration.metrics ? {
        totalViews: gbpIntegration.metrics.totalViews,
        phoneCallsTotal: gbpIntegration.metrics.phoneCallsTotal,
        websiteClicksTotal: gbpIntegration.metrics.websiteClicksTotal,
        averageRating: gbpIntegration.metrics.averageRating,
        totalReviews: gbpIntegration.metrics.totalReviews,
        calculatedScore: gbpIntegration.metrics.calculatedScore
      } : null,
      gsc: gscIntegration.metrics ? {
        totalImpressions: gscIntegration.metrics.totalImpressions,
        totalClicks: gscIntegration.metrics.totalClicks,
        averageCTR: gscIntegration.metrics.averageCTR,
        averagePosition: gscIntegration.metrics.averagePosition,
        calculatedScore: gscIntegration.metrics.calculatedScore
      } : null,
      clarity: clarityIntegration.metrics ? {
        totalSessions: clarityIntegration.metrics.totalSessions,
        bounceRate: clarityIntegration.metrics.bounceRate,
        deadClicks: clarityIntegration.metrics.deadClicks,
        calculatedScore: clarityIntegration.metrics.calculatedScore
      } : null,
      pms: pmsData.metrics ? {
        totalPatients: pmsData.metrics.totalPatients,
        selfReferred: pmsData.metrics.selfReferred,
        drReferred: pmsData.metrics.drReferred,
        totalProduction: pmsData.metrics.totalProduction,
        averageProductionPerPatient: pmsData.metrics.averageProductionPerPatient
      } : null
    };
  }, [
    ga4Integration.metrics,
    gbpIntegration.metrics, 
    gscIntegration.metrics,
    clarityIntegration.metrics,
    pmsData.metrics
  ]);
  // Fast loading - only show spinner for auth, not initial load
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Fast redirect to sign in if not authenticated
  if (!session) {
    window.location.href = '/signin';
    return null;
  }

  // Show client loading state
  if (clientLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Resolving client access...</p>
        </div>
      </div>
    );
  }

  // Show client error state
  if (clientError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Client Access Error</h2>
            <p className="text-gray-600 mb-6">{clientError}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show no client access state
  if (!clientId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Client Access</h2>
            <p className="text-gray-600 mb-6">
              You don't have access to any client accounts. Please contact support.
            </p>
            <button
              onClick={() => window.location.href = '/signout'}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Performance Dashboard</h1>
              <p className="text-gray-600">
                {vitalSignsAI.analysis ? 
                  `AI Analysis: Grade ${vitalSignsAI.analysis.grade} • ${vitalSignsAI.analysis.priorityOpportunities?.length || 0} opportunities identified` :
                  'Comprehensive practice analytics and AI-powered insights'
                }
              </p>
            </div>
            {vitalSignsAI.analysis && (
              <div className="text-right">
                <button
                  onClick={vitalSignsAI.refreshAnalysis}
                  disabled={vitalSignsAI.isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Brain className={`w-4 h-4 ${vitalSignsAI.isLoading ? 'animate-pulse' : ''}`} />
                  {vitalSignsAI.isLoading ? 'Analyzing...' : 'Refresh AI Analysis'}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {vitalSignsAI.getAnalysisAge()}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Vital Signs Card with Patient Journey */}
          <VitalSignsCard 
            ga4Data={ga4Integration.metrics}
            gbpData={gbpIntegration.metrics}
            gscData={gscIntegration.metrics}
            clarityData={clarityIntegration.metrics}
            pmsData={pmsData.metrics}
            connectionStatus={{
              ga4: ga4Integration.isConnected,
              gbp: gbpIntegration.isConnected,
              gsc: gscIntegration.isConnected,
              clarity: clarityIntegration.isConnected
            }}
            aiAnalysis={vitalSignsAI.analysis}
            isLoadingAI={vitalSignsAI.isLoading}
          />

          {/* KPI Pillars */}
          <KPIPillars 
            ga4Data={ga4Integration.metrics}
            gbpData={gbpIntegration.metrics}
            gscData={gscIntegration.metrics}
            clarityData={clarityIntegration.metrics}
            connectionStatus={{
              ga4: ga4Integration.isConnected,
              gbp: gbpIntegration.isConnected,
              gsc: gscIntegration.isConnected,
              clarity: clarityIntegration.isConnected
            }}
          />

          {/* Next Best Action */}
          <NextBestAction 
            ga4Data={ga4Integration.metrics}
            gbpData={gbpIntegration.metrics}
            gscData={gscIntegration.metrics}
            clarityData={clarityIntegration.metrics}
            pmsData={pmsData.metrics}
            connectionStatus={{
              ga4: ga4Integration.isConnected,
              gbp: gbpIntegration.isConnected,
              gsc: gscIntegration.isConnected,
              clarity: clarityIntegration.isConnected
            }}
            aiRecommendations={vitalSignsAI.analysis?.recommendations}
          />

          {/* Lazy loaded components */}
          <Suspense fallback={<FastLoader />}>
            <TaskTrackingPlaceholder />
          </Suspense>

          {/* PMS Data Visuals - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<FastLoader />}>
              <PMSMetricsChart 
                monthlyData={pmsData.metrics?.monthlyData || []}
                totalPatients={pmsData.metrics?.totalPatients || 0}
                totalProduction={pmsData.metrics?.totalProduction || 0}
                trend={pmsData.metrics?.trend || 'stable'}
                changePercent={pmsData.metrics?.changePercent || '0'}
                isLoading={pmsData.isLoading}
              />
            </Suspense>
            
            <Suspense fallback={<FastLoader />}>
              <ReferralSourcesMatrix 
                monthlyData={pmsData.metrics?.monthlyData || []}
                rawData={[]}
                isLoading={pmsData.isLoading}
              />
            </Suspense>
          </div>

          {/* AI Insights Summary */}
          {vitalSignsAI.analysis && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Brain className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    AI Practice Insights
                    {vitalSignsAI.isLoading && (
                      <span className="ml-2 text-sm text-blue-600">Updating...</span>
                    )}
                  </h2>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Overall Grade:</span>
                  <span className="text-2xl font-bold text-indigo-600">{vitalSignsAI.analysis.grade}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Priority Opportunities */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-red-600" />
                    Priority Opportunities ({(vitalSignsAI.analysis.priorityOpportunities || []).length})
                  </h3>
                  <div className="space-y-3">
                    {(vitalSignsAI.analysis.priorityOpportunities || []).map((opportunity, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-medium text-red-900 mb-1">{opportunity.title}</h4>
                        <p className="text-sm text-red-800 mb-2">{opportunity.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-red-700 font-medium">{opportunity.estimatedImpact}</span>
                          <span className="text-red-600">{opportunity.timeframe}</span>
                        </div>
                      </div>
                    ))}
                    {(vitalSignsAI.analysis.priorityOpportunities || []).length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No priority opportunities identified</p>
                        <p className="text-xs">AI analysis may still be processing</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Recent Wins */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Recent Wins ({(vitalSignsAI.analysis.recentWins || []).length})
                  </h3>
                  <div className="space-y-3">
                    {(vitalSignsAI.analysis.recentWins || []).map((win, index) => (
                      <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-1">{win.title}</h4>
                        <p className="text-sm text-green-800 mb-2">{win.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-green-700 font-medium">{win.improvement}</span>
                          <span className="text-green-600">{win.timeframe}</span>
                        </div>
                      </div>
                    ))}
                    {(vitalSignsAI.analysis.recentWins || []).length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No recent wins identified</p>
                        <p className="text-xs">Connect more integrations for insights</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Recommendations */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    AI Recommendations ({(vitalSignsAI.analysis.recommendations || []).length})
                  </h3>
                  <div className="space-y-3">
                    {(vitalSignsAI.analysis.recommendations || []).map((rec, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-1">{rec.title}</h4>
                        <p className="text-sm text-blue-800 mb-2">{rec.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-blue-700 font-medium">{rec.estimatedImpact}</span>
                          <span className={`px-2 py-1 rounded-full ${
                            rec.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            rec.difficulty === 'medium' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {rec.difficulty}
                          </span>
                        </div>
                      </div>
                    ))}
                    {(vitalSignsAI.analysis.recommendations || []).length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No recommendations available</p>
                        <p className="text-xs">AI is analyzing your data</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Integration Modals */}
        <GA4IntegrationModal 
          isOpen={showGA4Modal} 
          onClose={() => setShowGA4Modal(false)} 
          clientId={clientId}
          ready={ready}
          session={session}
        />
        <GBPIntegrationModal 
          isOpen={showGBPModal} 
          onClose={() => setShowGBPModal(false)} 
          clientId={clientId}
          ready={ready}
          session={session}
        />
        <GSCIntegrationModal 
          isOpen={showGSCModal} 
          onClose={() => setShowGSCModal(false)} 
          clientId={clientId}
          ready={ready}
          session={session}
        />
        <ClarityIntegrationModal 
          isOpen={showClarityModal} 
          onClose={() => setShowClarityModal(false)} 
          clientId={clientId}
        />
        <PMSUploadModal 
          isOpen={showPMSUpload} 
          onClose={() => setShowPMSUpload(false)} 
          clientId={clientId}
        />

        {/* Debug Panel */}
        <ConnectionDebugPanel 
          isVisible={showDebugPanel}
          onClose={() => setShowDebugPanel(false)}
        />
      </div>
    </div>
  );
}