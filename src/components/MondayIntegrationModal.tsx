import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Database, CheckCircle, Calendar, Users, BarChart3 } from 'lucide-react';

interface MondayIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess?: () => void;
}

export const MondayIntegrationModal: React.FC<MondayIntegrationModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onSuccess
}) => {
  const [workspaceId, setWorkspaceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'connect' | 'success'>('connect');

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('connect');
      setWorkspaceId('');
      setError(null);
    }
  }, [isOpen]);

  const handleConnect = async () => {
    if (!workspaceId.trim()) {
      setError('Workspace ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('=== Monday.com Connect Debug ===');
      console.log('Client ID:', clientId);
      console.log('Workspace ID:', workspaceId);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/monday-connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          clientId, 
          workspaceId: workspaceId.trim() 
        })
      });

      console.log('Monday connect response status:', response.status);

      const responseText = await response.text();
      console.log('Response text preview:', responseText.substring(0, 200));

      // Check if response is HTML (indicates wrong endpoint)
      if (responseText.trim().startsWith('<!doctype') || responseText.trim().startsWith('<html')) {
        throw new Error(`Environment variable error: VITE_SUPABASE_URL is incorrectly configured. Current value: "${SUPABASE_URL}". Please set it to your Supabase project URL (https://your-project-ref.supabase.co)`);
      }

      if (!response.ok) {
        console.error('Monday connect failed:', response.status, responseText);
        if (response.status === 404) {
          throw new Error('Monday connect function not found. Please ensure Supabase Edge Functions are deployed.');
        }
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', responseText);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }

      console.log('Monday connect success:', data);
      
      if (data.success) {
        setStep('success');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        throw new Error(data.error || 'Connection failed');
      }

    } catch (err) {
      console.error('Monday connect error details:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect Monday.com');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Connect Monday.com</h2>
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
              </div>
            </div>
          )}

          {step === 'connect' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Connect Your Practice Tasks
                </h3>
                <p className="text-gray-600 mb-6">
                  Enter your practice name to automatically populate your tasks from our team workspace.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-700">View tasks assigned to your practice</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">See who's working on your projects</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-700">Track project completion and timelines</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Practice Name *
                </label>
                <input
                  type="text"
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your practice name (e.g., 'Hamilton Wise')"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your practice name exactly as it appears in our Monday.com workspace
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>Simply enter your practice name and we'll automatically find and sync all tasks assigned to your practice from our internal Monday.com workspace.</p>
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={isLoading || !workspaceId.trim()}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Database className="w-5 h-5" />
                )}
                {isLoading ? 'Connecting...' : 'Connect Practice Tasks'}
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Monday.com Connected Successfully!
              </h3>
              <p className="text-gray-600">
                Your Monday.com workspace is now connected and tasks will be synced to your dashboard.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Workspace connected</span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Tasks from all boards in your workspace will be synced automatically
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};