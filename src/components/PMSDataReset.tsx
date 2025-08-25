import React, { useState } from 'react';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

interface PMSDataResetProps {
  clientId: string;
  onResetComplete?: () => void;
}

export const PMSDataReset: React.FC<PMSDataResetProps> = ({ clientId, onResetComplete }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handleReset = async () => {
    setIsResetting(true);
    try {
      console.log('=== Resetting PMS Data ===');
      console.log('Client ID:', clientId);

      const actualClientId = AuthService.getUserId(); // Use authenticated user ID
      if (!actualClientId) {
        throw new Error('No client ID found');
      }

      const { AuthService } = await import('../utils/authService');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/reset-pms-data?clientId=${actualClientId}&confirm=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      console.log('Reset result:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Reset failed');
      }

      setResetResult(result);
      setShowConfirm(false);
      
      // Clear localStorage cache
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('pms_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Notify parent component
      onResetComplete?.();

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Reset error:', error);
      alert(`Reset failed: ${error.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  if (resetResult) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-green-600" />
          <div>
            <h4 className="font-medium text-green-900">Reset Complete</h4>
            <p className="text-sm text-green-800">
              Deleted {resetResult.data?.recordsDeleted || 0} PMS records. 
              Page will reload automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-red-900 mb-2">Confirm Data Reset</h4>
            <p className="text-sm text-red-800 mb-4">
              This will permanently delete ALL PMS data for your account. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isResetting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {isResetting ? 'Resetting...' : 'Yes, Delete All Data'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-yellow-900 mb-2">Reset PMS Data</h4>
          <p className="text-sm text-yellow-800 mb-4">
            If the charts aren't displaying your uploaded data correctly, you can reset all PMS data and upload fresh files.
          </p>
          <button
            onClick={() => setShowConfirm(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Reset All PMS Data
          </button>
        </div>
      </div>
    </div>
  );
};