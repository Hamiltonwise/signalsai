import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { BarChart3, Search, MapPin, CheckCircle2, XCircle } from "lucide-react";
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

  if (isLoading)
    return (
      <div className="space-y-6 animate-pulse">
        {/* Integration Card Skeleton 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl" />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-5 w-40 bg-slate-200 rounded" />
                  <div className="h-6 w-24 bg-slate-200 rounded-full" />
                </div>
                <div className="h-4 w-56 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="h-10 w-24 bg-slate-200 rounded-xl" />
          </div>
        </div>

        {/* Integration Card Skeleton 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl" />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-5 w-48 bg-slate-200 rounded" />
                  <div className="h-6 w-28 bg-slate-200 rounded-full" />
                </div>
                <div className="h-4 w-64 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="h-10 w-24 bg-slate-200 rounded-xl" />
          </div>
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="h-4 w-48 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-64 bg-slate-200 rounded" />
          </div>
        </div>

        {/* Integration Card Skeleton 3 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl" />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-5 w-44 bg-slate-200 rounded" />
                  <div className="h-6 w-24 bg-slate-200 rounded-full" />
                </div>
                <div className="h-4 w-52 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="h-10 w-24 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );

  const integrations = [
    {
      type: "ga4" as const,
      title: "Google Analytics 4",
      description: "Track website traffic and user behavior analytics",
      icon: BarChart3,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-50",
      connected: !!properties.ga4,
      property: properties.ga4,
      idLabel: "Property ID",
      idValue: properties.ga4?.propertyId,
    },
    {
      type: "gsc" as const,
      title: "Google Search Console",
      description: "Monitor search performance and indexing status",
      icon: Search,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-50",
      connected: !!properties.gsc,
      property: properties.gsc,
      idLabel: "Site URL",
      idValue: properties.gsc?.siteUrl,
    },
    {
      type: "gbp" as const,
      title: "Google Business Profile",
      description: "Manage your business locations and local SEO",
      icon: MapPin,
      iconColor: "text-green-500",
      iconBg: "bg-green-50",
      connected: properties.gbp && properties.gbp.length > 0,
      property: null,
      locations: properties.gbp,
      idLabel: "Location ID",
    },
  ];

  return (
    <div className="space-y-6">
      {integrations.map((integration, index) => (
        <motion.div
          key={integration.type}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden"
        >
          {/* Card Header */}
          <div className="p-6 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-xl ${integration.iconBg} flex-shrink-0`}
              >
                <integration.icon
                  className={`w-6 h-6 ${integration.iconColor}`}
                />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-alloro-navy font-heading">
                    {integration.title}
                  </h3>
                  {integration.connected ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                      <XCircle className="w-3.5 h-3.5" />
                      Not Connected
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-sm mt-1">
                  {integration.description}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              {integration.connected ? (
                canManageConnections ? (
                  <>
                    <button
                      onClick={() => handleConnect(integration.type)}
                      className="px-4 py-2 text-sm font-bold text-alloro-cobalt bg-alloro-cobalt/10 rounded-xl hover:bg-alloro-cobalt/20 transition-colors"
                    >
                      Change
                    </button>
                    <button
                      onClick={() => initiateDisconnect(integration.type)}
                      className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      {integration.type === "gbp"
                        ? "Disconnect All"
                        : "Disconnect"}
                    </button>
                  </>
                ) : null
              ) : canManageConnections ? (
                <button
                  onClick={() => handleConnect(integration.type)}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-alloro-cobalt rounded-xl hover:bg-blue-700 transition-colors shadow-md"
                >
                  Connect
                </button>
              ) : null}
            </div>
          </div>

          {/* Connected Property Details */}
          {integration.connected && (
            <div className="px-6 pb-6">
              {integration.type === "gbp" && integration.locations ? (
                <div className="space-y-2">
                  {integration.locations.map((loc: Property, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-bold text-alloro-navy">
                          {loc.displayName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 ml-6 font-medium">
                        Location ID: {loc.locationId}
                      </div>
                    </div>
                  ))}
                </div>
              ) : integration.property ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <integration.icon
                      className={`w-4 h-4 ${integration.iconColor}`}
                    />
                    <span className="text-sm font-bold text-alloro-navy">
                      {integration.property.displayName}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 ml-6 font-medium">
                    {integration.idLabel}: {integration.idValue}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </motion.div>
      ))}

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
