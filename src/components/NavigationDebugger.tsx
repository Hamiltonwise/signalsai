import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Navigation, RefreshCw } from 'lucide-react';

export const NavigationDebugger: React.FC = () => {
  const [navigationLog, setNavigationLog] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const log = `Navigation to: ${window.location.pathname} at ${new Date().toLocaleTimeString()} (${new Date().toISOString()})`;
    setNavigationLog(prev => [...prev.slice(-4), log]);
    console.log('🧭 NavigationDebugger: Location changed to:', {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      timestamp: new Date().toISOString(),
      isNavigationComplete: true
    });
  }, []);

  const testNavigation = () => {
    const testRoutes = ['/', '/settings', '/upload', '/team-tasks'];
    testRoutes.forEach((route, index) => {
      setTimeout(() => {
        console.log(`Testing navigation to: ${route}`);
        window.location.href = route;
      }, index * 1000);
    });
  };

  // Only show in development
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700"
      >
        <Navigation className="w-4 h-4" />
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Navigation Debug</h4>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2 mb-3">
            <div className="text-sm">
              <strong>Current:</strong> {window.location.pathname}
            </div>
            <div className="text-xs text-gray-600">
              <strong>Recent Navigation:</strong>
              {navigationLog.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>
          
          <button
            onClick={testNavigation}
            className="w-full bg-blue-600 text-white py-1 px-2 rounded text-sm hover:bg-blue-700"
          >
            <RefreshCw className="w-3 h-3 inline mr-1" />
            Test All Routes
          </button>
        </div>
      )}
    </div>
  );
};