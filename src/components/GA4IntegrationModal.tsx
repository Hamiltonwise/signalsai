import React, { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  Database,
  TrendingUp,
  Users,
  MousePointer,
} from "lucide-react";
import { useGA4 } from "../hooks/useGA4";

interface GA4IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GA4IntegrationModal: React.FC<GA4IntegrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Use real GA4 hook
  const {
    properties,
    propertiesLoading,
    propertiesError,
    fetchPropertiesDetails,
  } = useGA4();
  const [selectedProperty, setSelectedProperty] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const [step, setStep] = useState<
    "connect" | "select-property" | "fetch-data" | "success"
  >("connect");

  // Static MTD comparison placeholder
  const mtdComparison = {
    current: {
      startDate: "2024-01-01",
      endDate: "2024-01-15",
      description: "Jan 1-15, 2024",
    },
    previous: {
      startDate: "2023-12-01",
      endDate: "2023-12-15",
      description: "Dec 1-15, 2023",
    },
  };

  // Fetch properties when modal opens
  useEffect(() => {
    if (isOpen && properties.length === 0 && !propertiesLoading) {
      fetchPropertiesDetails();
    }
  }, [isOpen, properties.length, propertiesLoading, fetchPropertiesDetails]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep("connect");
      setSelectedProperty("");
    }
  }, [isOpen]);

  const handleConnect = async () => {
    console.log("GA4 Modal: Starting connection...");
    setIsConnecting(true);

    try {
      // Simulate OAuth connection - in real implementation this would redirect to Google
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Fetch available properties after successful connection
      await fetchPropertiesDetails();
      setStep("select-property");
    } catch (error) {
      console.error("GA4 connection failed:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePropertySelect = () => {
    console.log("GA4 Modal: Property selected:", selectedProperty);
    if (selectedProperty) {
      setStep("fetch-data");
    }
  };

  const handleFetchData = async () => {
    console.log("GA4 Modal: Fetching data for property:", selectedProperty);
    setIsConnecting(true);

    try {
      // Simulate data fetching
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setStep("success");
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("GA4 data fetch failed:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Connect Google Analytics 4
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {step === "connect" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Connect Your Google Analytics
                </h3>
                <p className="text-gray-600 mb-6">
                  Connect your Google Analytics 4 property to start tracking
                  website performance metrics.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-700">
                    Track new and returning users
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">
                    Monitor engagement and conversions
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MousePointer className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-700">
                    Analyze user behavior patterns
                  </span>
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={isConnecting || propertiesLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isConnecting || propertiesLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ExternalLink className="w-5 h-5" />
                )}
                {isConnecting || propertiesLoading
                  ? "Connecting..."
                  : "Connect with Google"}
              </button>
            </div>
          )}

          {step === "select-property" && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select GA4 Property
                </h3>
                <p className="text-gray-600">
                  Found {properties.length} properties. Choose the one for your
                  dental practice.
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
                    <option
                      key={property.propertyId}
                      value={property.propertyId}
                    >
                      {property.displayName} - {property.accountDisplayName}(
                      {property.propertyId})
                    </option>
                  ))}
                </select>

                {/* Property Selection Helper */}
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">
                      💡 Property Selection Tips:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        Look for properties containing "hamiltonwise" in the
                        name
                      </li>
                      <li>
                        Check the account name to ensure it's the correct Google
                        account
                      </li>
                      <li>
                        If unsure, select the property and check the data
                        preview
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {propertiesError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    Error loading properties: {propertiesError}
                  </p>
                </div>
              )}

              {properties.length === 0 &&
                !propertiesLoading &&
                !propertiesError && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      No GA4 properties found. Make sure you have access to
                      Google Analytics properties with this account.
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
                disabled={isConnecting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isConnecting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Database className="w-5 h-5" />
                )}
                {isConnecting ? "Fetching Data..." : "Fetch Data"}
              </button>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                GA4 Connected Successfully!
              </h3>
              <p className="text-gray-600">
                Your Google Analytics data is now being integrated into your
                dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
