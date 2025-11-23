import React, { useEffect, useState } from "react";
import axios from "axios";
import { PropertySelectionModal } from "./PropertySelectionModal";
import { ConfirmModal } from "./ConfirmModal";

type UserRole = "admin" | "manager" | "viewer";

interface Property {
  propertyId?: string;
  siteUrl?: string;
  accountId?: string;
  locationId?: string;
  displayName: string;
}

interface PropertiesState {
  ga4: Property | null;
  gsc: Property | null;
  gbp: Property[] | [];
}

export const PropertiesTab: React.FC = () => {
  const [properties, setProperties] = useState<PropertiesState>({
    ga4: null,
    gsc: null,
    gbp: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"ga4" | "gsc" | "gbp">("ga4");
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [initialSelections, setInitialSelections] = useState<string[]>([]);

  // Confirm Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [disconnectType, setDisconnectType] = useState<
    "ga4" | "gsc" | "gbp" | null
  >(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    // Get user role
    const role = localStorage.getItem("user_role") as UserRole | null;
    setUserRole(role);
    fetchProperties();
  }, []);

  const canManageConnections = userRole === "admin";

  const fetchProperties = async () => {
    try {
      const googleAccountId = localStorage.getItem("google_account_id");
      if (!googleAccountId) return;

      const response = await axios.get("/api/settings/properties", {
        headers: { "x-google-account-id": googleAccountId },
      });

      if (response.data.success) {
        setProperties(response.data.properties);
      }
    } catch (err) {
      console.error("Failed to fetch properties:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (type: "ga4" | "gsc" | "gbp") => {
    setModalType(type);
    setModalOpen(true);
    setLoadingAvailable(true);
    setAvailableProperties([]);
    setIsSaving(false);

    // Prepare initial selections for highlighting
    let selections: string[] = [];
    if (type === "ga4" && properties.ga4?.propertyId) {
      selections = [properties.ga4.propertyId];
    } else if (type === "gsc" && properties.gsc?.siteUrl) {
      selections = [properties.gsc.siteUrl];
    } else if (type === "gbp" && properties.gbp.length > 0) {
      // For GBP, we need to match the ID format used in availableProperties.
      // The available properties use 'locations/...' or 'accounts/.../locations/...'
      // But we only stored locationId.
      // We'll need to rely on matching logic in the modal or try to reconstruct.
      // Since we don't have the full ID stored easily, we might need to do a best effort match
      // once we fetch available properties.
      // For now, let's just pass empty and handle it after fetch if possible,
      // OR we can filter availableProperties once fetched to find matches.
      // Let's wait until fetch completes to set selections for GBP.
    }
    setInitialSelections(selections);

    try {
      const googleAccountId = localStorage.getItem("google_account_id");
      if (!googleAccountId) return;

      const response = await axios.get(
        `/api/settings/properties/available/${type}`,
        {
          headers: { "x-google-account-id": googleAccountId },
        }
      );

      if (response.data.success) {
        const available = response.data.properties;
        setAvailableProperties(available);

        // Post-fetch selection matching for GBP
        if (type === "gbp" && properties.gbp.length > 0) {
          const gbpIds = properties.gbp.map((p) => p.locationId);
          // Find available items where locationId matches
          const matchedIds = available
            .filter((item: any) => gbpIds.includes(item.locationId))
            .map((item: any) => item.id);
          setInitialSelections(matchedIds);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch available ${type} properties:`, err);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleSelectProperty = async (item: any) => {
    // Single select handler (GA4, GSC)
    setIsSaving(true);
    try {
      const googleAccountId = localStorage.getItem("google_account_id");
      if (!googleAccountId) return;

      let data: any = {};
      if (modalType === "ga4") {
        data = {
          propertyId: item.id,
          displayName: item.name,
        };
      } else if (modalType === "gsc") {
        data = {
          siteUrl: item.id,
          displayName: item.name,
        };
      }

      await axios.post(
        "/api/settings/properties/update",
        { type: modalType, data, action: "connect" },
        { headers: { "x-google-account-id": googleAccountId } }
      );

      setModalOpen(false);
      fetchProperties(); // Reload to show new state
    } catch (err) {
      console.error("Failed to connect property:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMultiSelectProperty = async (items: any[]) => {
    // Multi select handler (GBP)
    setIsSaving(true);
    try {
      const googleAccountId = localStorage.getItem("google_account_id");
      if (!googleAccountId) return;

      // Map items to the storage format
      const data = items.map((item) => ({
        accountId: item.accountId,
        locationId: item.locationId,
        displayName: item.name,
      }));

      await axios.post(
        "/api/settings/properties/update",
        { type: modalType, data, action: "connect" },
        { headers: { "x-google-account-id": googleAccountId } }
      );

      setModalOpen(false);
      fetchProperties();
    } catch (err) {
      console.error("Failed to connect properties:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const initiateDisconnect = (type: "ga4" | "gsc" | "gbp") => {
    setDisconnectType(type);
    setConfirmOpen(true);
  };

  const handleConfirmDisconnect = async () => {
    if (!disconnectType) return;

    setIsDisconnecting(true);
    try {
      const googleAccountId = localStorage.getItem("google_account_id");
      if (!googleAccountId) return;

      await axios.post(
        "/api/settings/properties/update",
        { type: disconnectType, action: "disconnect" },
        { headers: { "x-google-account-id": googleAccountId } }
      );

      fetchProperties(); // Reload
      setConfirmOpen(false);
      setDisconnectType(null);
    } catch (err) {
      console.error("Failed to disconnect property:", err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* GA4 Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Google Analytics 4
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Connect your GA4 property to track website traffic.
            </p>
          </div>
          {properties.ga4 ? (
            canManageConnections ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleConnect("ga4")}
                  className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Change
                </button>
                <button
                  onClick={() => initiateDisconnect("ga4")}
                  className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <span className="text-sm text-gray-500">Connected</span>
            )
          ) : canManageConnections ? (
            <button
              onClick={() => handleConnect("ga4")}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect
            </button>
          ) : (
            <span className="text-sm text-gray-500">Not connected</span>
          )}
        </div>
        {properties.ga4 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-sm font-medium text-gray-900">
              {properties.ga4.displayName}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ID: {properties.ga4.propertyId}
            </div>
          </div>
        )}
      </div>

      {/* GSC Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Google Search Console
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Connect your GSC site to track search performance.
            </p>
          </div>
          {properties.gsc ? (
            canManageConnections ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleConnect("gsc")}
                  className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Change
                </button>
                <button
                  onClick={() => initiateDisconnect("gsc")}
                  className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <span className="text-sm text-gray-500">Connected</span>
            )
          ) : canManageConnections ? (
            <button
              onClick={() => handleConnect("gsc")}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect
            </button>
          ) : (
            <span className="text-sm text-gray-500">Not connected</span>
          )}
        </div>
        {properties.gsc && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-sm font-medium text-gray-900">
              {properties.gsc.displayName}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              URL: {properties.gsc.siteUrl}
            </div>
          </div>
        )}
      </div>

      {/* GBP Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Google Business Profile
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Connect your business locations.
            </p>
          </div>
          {properties.gbp && properties.gbp.length > 0 ? (
            canManageConnections ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleConnect("gbp")}
                  className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Change
                </button>
                <button
                  onClick={() => initiateDisconnect("gbp")}
                  className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Disconnect All
                </button>
              </div>
            ) : (
              <span className="text-sm text-gray-500">
                Connected ({properties.gbp.length})
              </span>
            )
          ) : canManageConnections ? (
            <button
              onClick={() => handleConnect("gbp")}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect
            </button>
          ) : (
            <span className="text-sm text-gray-500">Not connected</span>
          )}
        </div>
        {properties.gbp && properties.gbp.length > 0 && (
          <div className="mt-4 space-y-2">
            {properties.gbp.map((loc: any, idx: number) => (
              <div
                key={idx}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <div className="text-sm font-medium text-gray-900">
                  {loc.displayName}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ID: {loc.locationId}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PropertySelectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Select ${modalType.toUpperCase()} Property`}
        items={availableProperties}
        onSelect={handleSelectProperty}
        onMultiSelect={handleMultiSelectProperty}
        isLoading={loadingAvailable}
        isSaving={isSaving}
        type={modalType}
        initialSelections={initialSelections}
        multiSelect={modalType === "gbp"}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDisconnect}
        title="Disconnect Property?"
        message={`Are you sure you want to disconnect your ${disconnectType?.toUpperCase()} property? This will stop data tracking.`}
        confirmText="Disconnect"
        isLoading={isDisconnecting}
        type="danger"
      />
    </div>
  );
};
