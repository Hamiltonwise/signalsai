import React, { useState, useEffect, lazy, Suspense } from 'react';

// Lazy load integration hooks only when needed
const useGA4Integration = lazy(() => import('../hooks/useGA4Integration').then(m => ({ default: m.useGA4Integration })));
const useGBPIntegration = lazy(() => import('../hooks/useGBPIntegration').then(m => ({ default: m.useGBPIntegration })));
const useGSCIntegration = lazy(() => import('../hooks/useGSCIntegration').then(m => ({ default: m.useGSCIntegration })));
const useClarityIntegration = lazy(() => import('../hooks/useClarityIntegration').then(m => ({ default: m.useClarityIntegration })));
const usePMSData = lazy(() => import('../hooks/usePMSData').then(m => ({ default: m.usePMSData })));

interface LazyIntegrationLoaderProps {
  clientId: string;
  onDataLoaded?: (data: any) => void;
}

export const LazyIntegrationLoader: React.FC<LazyIntegrationLoaderProps> = ({
  clientId,
  onDataLoaded
}) => {
  const [loadIntegrations, setLoadIntegrations] = useState(false);

  // Only load integrations after a delay to allow initial UI to render
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadIntegrations(true);
    }, 1000); // Load after 1 second

    return () => clearTimeout(timer);
  }, []);

  if (!loadIntegrations || !clientId) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      {/* Integration hooks will be loaded here when needed */}
      <div style={{ display: 'none' }}>
        Integration loader active for {clientId}
      </div>
    </Suspense>
  );
};