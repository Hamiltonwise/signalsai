import React, { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  Database,
  TrendingUp,
  Eye,
  Search,
  BarChart3,
} from "lucide-react";

interface BaseIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess?: () => void;
  ready?: boolean;
  session?: any;
}

// Mock data for demo purposes
const mockSites = [
  {
    id: "site-1",
    displayName: "https://hamiltonwise.com/",
  },
  {
    id: "site-2",
    displayName: "https://www.hamiltonwise.com/",
  },
];

const mockMTDComparison = {
  current: {
    startDate: "2024-01-01",
    endDate: "2024-01-27",
    description: "Jan 1 - Jan 27, 2024",
  },
  previous: {
    startDate: "2023-12-01",
    endDate: "2023-12-27",
    description: "Dec 1 - Dec 27, 2023",
  },
};

// Google Search Console Integration Modal
export const GSCIntegrationModal: React.FC<BaseIntegrationModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onSuccess,
}) => {
  // Mock state for demo purposes
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sites] = useState(mockSites);
  const [selectedSite, setSelectedSite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<
    "connect" | "select-site" | "fetch-data" | "success"
  >("connect");
  const [mtdComparison] = useState(mockMTDComparison);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep("connect");
      setSelectedSite("");
      setError(null);
    }
  }, [isOpen]);

  // Auto-advance to property selection when connected (demo)
  useEffect(() => {
    if (isConnected && sites.length > 0) {
      setStep("select-site");
    }
  }, [isConnected, sites]);

  const handleConnect = async () => {
    console.log("GSC Modal: Starting demo connection with clientId:", clientId);
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Demo: randomly succeed or fail
      if (Math.random() > 0.2) {
        setIsConnected(true);
        console.log("🔍 GSC Modal: Demo connection successful");
      } else {
        throw new Error("Demo connection failed. Please try again.");
      }
    } catch (err) {
      console.error("GSC connection failed:", err);
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSiteSelect = () => {
    if (selectedSite) {
      setStep("fetch-data");
    }
  };

  const handleFetchData = async () => {
    if (!selectedSite) return;

    setIsLoading(true);
    try {
      // Simulate data fetching
      await new Promise((resolve) => setTimeout(resolve, 3000));

      console.log("🔍 GSC Modal: Demo data fetch completed successfully");
      setStep("success");
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      console.error("GSC Modal: Data fetch failed", err);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Connect Google Search Console
          </h2>
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

          {step === "connect" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Connect Your Search Console
                </h3>
                <p className="text-gray-600 mb-6">
                  Monitor your website's search performance and discover
                  optimization opportunities.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Eye className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-gray-700">
                    Track search impressions and clicks
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">
                    Monitor keyword rankings
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-700">
                    Analyze click-through rates
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Demo Mode:</strong> This is a demonstration of the
                  Google Search Console integration flow.
                </p>
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
                {isLoading ? "Connecting..." : "Connect with Google (Demo)"}
              </button>
            </div>
          )}

          {step === "select-site" && (
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
                    No GSC sites found. Make sure you have access to Google
                    Search Console properties with this account.
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

          {step === "fetch-data" && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Fetch Month-to-Date Data
                </h3>
                <p className="text-gray-600">
                  Fetching standardized Month-to-Date data for accurate
                  reporting.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Date Range</h4>
                <div className="text-sm text-blue-800">
                  <p>
                    <strong>Current Period:</strong>{" "}
                    {mtdComparison.current.description}
                  </p>
                  <p>
                    <strong>Comparison Period:</strong>{" "}
                    {mtdComparison.previous.description}
                  </p>
                  <p className="text-xs mt-2 text-blue-600">
                    This standardized MTD approach ensures accurate
                    month-over-month comparisons.
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
                {isLoading ? "Fetching Data..." : "Fetch Data"}
              </button>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                GSC Connected Successfully!
              </h3>
              <p className="text-gray-600">
                Your Google Search Console data is now being integrated into
                your dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
