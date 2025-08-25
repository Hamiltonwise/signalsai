import React, { useState, useEffect } from 'react';

type Props = {
  children: React.ReactNode;
  initialFallback?: React.ReactNode;
  timeoutMs?: number; // timeout disabled for dashboard access
};

export default function SuspenseWithTimeout({ children, initialFallback }: Props) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Timeout disabled to allow users to stay on dashboard indefinitely
  // even if they haven't connected all integrations yet

  const handleReload = () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    console.log('SuspenseWithTimeout: Attempting soft reload, retry count:', retryCount + 1);
    
    // Try to reload just the current route first
    try {
      window.location.reload();
    } catch (error) {
      console.error('SuspenseWithTimeout: Soft reload failed, trying hard refresh:', error);
      // Fallback to hard refresh
      window.location.href = window.location.href;
    }
  };

  const handleHardRefresh = () => {
    setIsRetrying(true);
    console.log('SuspenseWithTimeout: Attempting hard refresh');
    // Force hard refresh to clear all caches
    try {
      // Modern browsers don't support reload(true), use alternative
      window.location.href = window.location.href + '?t=' + Date.now();
    } catch (error) {
      console.error('SuspenseWithTimeout: Hard refresh failed:', error);
      window.location.reload();
    }
  };

  return (
    <React.Suspense fallback={initialFallback ?? <div style={{ padding: 12 }}>Loading…</div>}>
      {children}
    </React.Suspense>
  );
}