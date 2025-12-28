import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  MapPin,
  Database,
  ShieldCheck,
  Mail,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  LayoutGrid,
  BarChart3,
  Search,
  Users,
  Link2,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { PropertySelectionModal } from "../components/settings/PropertySelectionModal";
import { ConfirmModal } from "../components/settings/ConfirmModal";
import { UsersTab } from "../components/settings/UsersTab";

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

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const InfoRow = ({ icon, label, value }: InfoRowProps) => (
  <div className="flex items-start gap-5 group">
    <div className="p-3 bg-slate-50 text-slate-300 rounded-2xl shrink-0 group-hover:text-alloro-cobalt transition-colors shadow-inner border border-slate-100">
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">
        {label}
      </div>
      <div className="text-[15px] font-black text-alloro-navy tracking-tight truncate">
        {value}
      </div>
    </div>
  </div>
);

export const Settings: React.FC = () => {
  const { userProfile, selectedDomain } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "users">("profile");
  const [properties, setProperties] = useState<PropertiesState>({
    ga4: null,
    gsc: null,
    gbp: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"ga4" | "gsc" | "gbp">("ga4");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const handleFullSync = async () => {
    setIsSyncing(true);
    // Simulate sync delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await fetchProperties();
    setIsSyncing(false);
  };

  const handleConnect = async (type: "ga4" | "gsc" | "gbp") => {
    setModalType(type);
    setModalOpen(true);
    setLoadingAvailable(true);
    setAvailableProperties([]);
    setIsSaving(false);

    let selections: string[] = [];
    if (type === "ga4" && properties.ga4?.propertyId) {
      selections = [properties.ga4.propertyId];
    } else if (type === "gsc" && properties.gsc?.siteUrl) {
      selections = [properties.gsc.siteUrl];
    }
    setInitialSelections(selections);

    try {
      const googleAccountId = localStorage.getItem("google_account_id");
      if (!googleAccountId) return;

      const response = await axios.get(
        `/api/settings/properties/available/${type}`,
        { headers: { "x-google-account-id": googleAccountId } }
      );

      if (response.data.success) {
        const available = response.data.properties;
        setAvailableProperties(available);

        if (type === "gbp" && properties.gbp.length > 0) {
          const gbpIds = properties.gbp.map((p) => p.locationId);

          const matchedIds = available
            .filter((item: { locationId: string }) =>
              gbpIds.includes(item.locationId)
            )
            .map((item: { id: string }) => item.id);
          setInitialSelections(matchedIds);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch available ${type} properties:`, err);
    } finally {
      setLoadingAvailable(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectProperty = async (item: any) => {
    setIsSaving(true);
    try {
      const googleAccountId = localStorage.getItem("google_account_id");
      if (!googleAccountId) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = {};
      if (modalType === "ga4") {
        data = { propertyId: item.id, displayName: item.name };
      } else if (modalType === "gsc") {
        data = { siteUrl: item.id, displayName: item.name };
      }

      await axios.post(
        "/api/settings/properties/update",
        { type: modalType, data, action: "connect" },
        { headers: { "x-google-account-id": googleAccountId } }
      );

      setModalOpen(false);
      fetchProperties();
    } catch (err) {
      console.error("Failed to connect property:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMultiSelectProperty = async (items: any[]) => {
    setIsSaving(true);
    try {
      const googleAccountId = localStorage.getItem("google_account_id");
      if (!googleAccountId) return;

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

      fetchProperties();
      setConfirmOpen(false);
      setDisconnectType(null);
    } catch (err) {
      console.error("Failed to disconnect property:", err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Integration definitions
  const integrations = [
    {
      id: "ga4",
      name: "Google Analytics 4",
      icon: "https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg",
      connected: !!properties.ga4,
      lastSync: properties.ga4 ? "10 mins ago" : null,
      property: properties.ga4,
    },
    {
      id: "gbp",
      name: "Google Business Profile",
      icon: "https://www.gstatic.com/images/branding/product/1x/business_profile_64dp.png",
      connected: properties.gbp && properties.gbp.length > 0,
      lastSync: properties.gbp.length > 0 ? "1 hour ago" : null,
      locations: properties.gbp,
    },
    {
      id: "gsc",
      name: "Google Search Console",
      icon: "https://www.gstatic.com/images/branding/product/1x/search_console_64dp.png",
      connected: !!properties.gsc,
      lastSync: properties.gsc ? "2 hours ago" : null,
      property: properties.gsc,
    },
    {
      id: "clarity",
      name: "Microsoft Clarity",
      icon: "https://clarity.microsoft.com/favicon.ico",
      connected: true,
      lastSync: "30 mins ago",
    },
  ];

  // Get practice initials
  const practiceInitials = userProfile?.practiceName
    ? userProfile.practiceName
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AP";

  return (
    <div className="max-w-[1600px] mx-auto relative flex flex-col bg-alloro-bg font-body text-alloro-navy">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 lg:sticky lg:top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 py-6 lg:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[28px] sm:rounded-[32px] bg-alloro-navy text-white flex items-center justify-center text-3xl sm:text-4xl font-black font-heading shadow-xl border border-white/5 shrink-0">
              {practiceInitials}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black font-heading text-alloro-navy tracking-tight truncate">
                {userProfile?.practiceName || "Your Practice"}
              </h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 mt-1.5">
                <Globe size={14} className="text-alloro-cobalt" />
                License ID:{" "}
                {userProfile?.googleAccountId
                  ? `2026-${userProfile.googleAccountId}`
                  : "2026-XX-01"}
              </p>
            </div>
          </div>
          <button className="w-full md:w-auto px-8 py-4 bg-alloro-cobalt text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/10 hover:brightness-110 active:scale-95 transition-all shrink-0">
            Security Credentials
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 py-8 lg:py-12 space-y-8 lg:space-y-10">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex p-1.5 bg-white border border-slate-200 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] w-fit"
        >
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all duration-200 flex items-center gap-2 ${
              activeTab === "profile"
                ? "bg-alloro-navy text-white shadow-lg"
                : "text-slate-400 hover:text-alloro-navy hover:bg-slate-50"
            }`}
          >
            <Link2 className="w-4 h-4" />
            Profile & Integrations
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all duration-200 flex items-center gap-2 ${
              activeTab === "users"
                ? "bg-alloro-navy text-white shadow-lg"
                : "text-slate-400 hover:text-alloro-navy hover:bg-slate-50"
            }`}
          >
            <Users className="w-4 h-4" />
            Users & Roles
          </button>
        </motion.div>

        {/* Tab Content */}
        {activeTab === "users" ? (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <UsersTab />
          </motion.div>
        ) : isLoading ? (
          // Loading State
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
            <div className="xl:col-span-4 space-y-8">
              <div className="bg-white rounded-[32px] border border-slate-200 p-8 sm:p-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] animate-pulse">
                <div className="h-4 w-32 bg-slate-200 rounded mb-10" />
                <div className="space-y-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-5">
                      <div className="w-10 h-10 bg-slate-200 rounded-2xl" />
                      <div>
                        <div className="h-3 w-16 bg-slate-200 rounded mb-2" />
                        <div className="h-4 w-32 bg-slate-200 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-alloro-navy rounded-[32px] p-8 sm:p-10 h-48 animate-pulse opacity-50" />
            </div>
            <div className="xl:col-span-8 space-y-8 lg:space-y-10">
              <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-[32px] border border-slate-200 p-8 lg:p-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] animate-pulse"
                  >
                    <div className="flex items-center justify-between mb-10">
                      <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                      <div className="h-6 w-16 bg-slate-200 rounded-lg" />
                    </div>
                    <div className="h-5 w-40 bg-slate-200 rounded mb-2" />
                    <div className="h-3 w-24 bg-slate-200 rounded mb-8" />
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column - Identity Details */}
            <section className="xl:col-span-4 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] border border-slate-200 p-8 sm:p-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-10 leading-none">
                  Practice Identity
                </h3>
                <div className="space-y-8">
                  <InfoRow
                    icon={<MapPin size={18} />}
                    label="Address"
                    value="Winter Garden, FL"
                  />
                  <InfoRow
                    icon={<Globe size={18} />}
                    label="Website"
                    value={
                      selectedDomain?.domain ||
                      userProfile?.domainName ||
                      "artfulorthodontics.com"
                    }
                  />
                  <InfoRow
                    icon={<Database size={18} />}
                    label="PMS Engine"
                    value="Cloud9 / Dolphin"
                  />
                  <InfoRow
                    icon={<Mail size={18} />}
                    label="Admin Hub"
                    value="contact@practice.com"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-alloro-navy rounded-[32px] p-8 sm:p-10 text-white relative overflow-hidden shadow-xl border border-white/5"
              >
                <div className="absolute top-0 right-0 p-32 bg-alloro-cobalt/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative z-10">
                  <ShieldCheck size={36} className="text-alloro-teal mb-6" />
                  <h4 className="text-xl font-black font-heading tracking-tight mb-2">
                    Compliance Shield
                  </h4>
                  <p className="text-blue-100/60 text-[14px] font-semibold leading-relaxed tracking-tight">
                    System is strictly HIPAA compliant. No Protected Health
                    Information (PHI) is ingested at any time.
                  </p>
                </div>
              </motion.div>
            </section>

            {/* Right Column - Integrations */}
            <section className="xl:col-span-8 space-y-8 lg:space-y-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <h2 className="text-xl sm:text-2xl font-black text-alloro-navy font-heading tracking-tight leading-none">
                  Engine Integrations
                </h2>
                <button
                  onClick={handleFullSync}
                  disabled={isSyncing}
                  className="flex items-center gap-2 text-[10px] font-black text-alloro-cobalt uppercase tracking-widest hover:text-alloro-navy transition-colors w-fit disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={isSyncing ? "animate-spin" : ""}
                  />{" "}
                  Full Hub Sync
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {integrations.map((app, index) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-[32px] border border-slate-200 p-8 lg:p-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] group transition-all hover:shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-10">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center p-2.5 border border-slate-100 shadow-inner group-hover:bg-alloro-bg transition-colors">
                        {app.id === "clarity" ? (
                          <RefreshCw className="text-alloro-cobalt w-6 h-6" />
                        ) : app.id === "ga4" ? (
                          <BarChart3 className="text-orange-500 w-6 h-6" />
                        ) : app.id === "gsc" ? (
                          <Search className="text-blue-500 w-6 h-6" />
                        ) : app.id === "gbp" ? (
                          <MapPin className="text-green-500 w-6 h-6" />
                        ) : (
                          <img
                            src={app.icon}
                            alt={app.name}
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                      {app.connected ? (
                        <span className="px-3 py-1 bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-widest rounded-lg border border-green-100 flex items-center gap-1.5">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200">
                          Disconnected
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-alloro-navy text-lg font-heading tracking-tight mb-1 truncate">
                      {app.name}
                    </h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">
                      {app.connected
                        ? `Synced ${app.lastSync}`
                        : "Not connected"}
                    </p>

                    {canManageConnections && app.id !== "clarity" && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            handleConnect(app.id as "ga4" | "gsc" | "gbp")
                          }
                          className="text-alloro-cobalt text-[10px] font-black flex items-center gap-2 uppercase tracking-widest hover:gap-3 transition-all"
                        >
                          {app.connected ? "Engine Config" : "Connect"}{" "}
                          <ExternalLink size={14} />
                        </button>
                        {app.connected && (
                          <button
                            onClick={() =>
                              initiateDisconnect(
                                app.id as "ga4" | "gsc" | "gbp"
                              )
                            }
                            className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:text-red-600 transition-colors"
                          >
                            Disconnect
                          </button>
                        )}
                      </div>
                    )}

                    {app.id === "clarity" && (
                      <button className="text-alloro-cobalt text-[10px] font-black flex items-center gap-2 uppercase tracking-widest hover:gap-3 transition-all">
                        Engine Config <ExternalLink size={14} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Connect New System */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="p-10 lg:p-14 bg-white/50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center text-center shadow-inner"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[24px] bg-white shadow-md flex items-center justify-center mb-8 border border-slate-100 text-slate-200">
                  <LayoutGrid size={32} />
                </div>
                <h4 className="font-black text-alloro-navy text-xl sm:text-2xl font-heading tracking-tight mb-2">
                  Connect New System
                </h4>
                <p className="text-slate-500 text-[16px] font-semibold max-w-sm leading-relaxed mb-10 tracking-tight opacity-80">
                  Integrate CRM or Call Tracking to enhance referral mapping
                  precision.
                </p>
                <button className="px-8 py-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-alloro-navy hover:border-alloro-cobalt hover:text-alloro-cobalt transition-all shadow-sm active:scale-95">
                  Explore App Directory
                </button>
              </motion.div>
            </section>
          </div>
        )}
      </div>

      {/* Property Selection Modal */}
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

      {/* Confirm Modal */}
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
