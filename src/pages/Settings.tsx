import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  MapPin,
  Database,
  Mail,
  RefreshCw,
  LayoutGrid,
  Users,
  Link2,
  Shield,
  Lock,
  Activity,
  Phone,
  ChevronRight,
  Award,
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
  <div className="flex items-start gap-8 group">
    <div className="p-4 bg-alloro-bg text-alloro-navy/40 rounded-2xl shrink-0 group-hover:text-alloro-orange group-hover:bg-alloro-orange/5 transition-all duration-500 border border-black/5 shadow-inner-soft group-hover:shadow-premium">
      {icon}
    </div>
    <div className="min-w-0 text-left">
      <div className="text-[10px] font-black text-alloro-textDark/30 uppercase tracking-[0.3em] mb-2 leading-none">
        {label}
      </div>
      <div className="text-xl font-black text-alloro-navy tracking-tight truncate group-hover:translate-x-1 transition-transform">
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
      icon: "/google-analytics.png",
      connected: !!properties.ga4,
      lastSync: properties.ga4 ? "10 mins ago" : "Not connected",
      property: properties.ga4,
    },
    {
      id: "gbp",
      name: "Google Business Profile",
      icon: "/google-business-profile.png",
      connected: properties.gbp && properties.gbp.length > 0,
      lastSync: properties.gbp.length > 0 ? "1 hour ago" : "Not connected",
      locations: properties.gbp,
    },
    {
      id: "gsc",
      name: "Google Search Console",
      icon: "/google-search-console.png",
      connected: !!properties.gsc,
      lastSync: properties.gsc ? "2 hours ago" : "Not connected",
      property: properties.gsc,
    },
    {
      id: "clarity",
      name: "Microsoft Clarity",
      icon: "/microsoft-clarity.png",
      connected: true,
      lastSync: "30 mins ago",
    },
  ];

  return (
    <div className="min-h-screen bg-alloro-bg font-body text-alloro-textDark pb-32 selection:bg-alloro-orange selection:text-white">
      <div className="max-w-[1400px] mx-auto relative flex flex-col">
        {/* Header */}
        <header className="glass-header border-b border-black/5 lg:sticky lg:top-0 z-40">
          <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-8 lg:py-12 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl bg-alloro-navy text-white flex items-center justify-center text-4xl font-black font-heading shadow-premium shrink-0 relative group cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-alloro-orange opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span className="relative z-10">
                  {userProfile?.practiceName?.charAt(0).toUpperCase() || "A"}
                </span>
              </div>
              <div className="text-left">
                <h1 className="text-3xl lg:text-5xl font-black font-heading text-alloro-navy tracking-tighter leading-none mb-4">
                  {userProfile?.practiceName || "Artful Orthodontics"}
                </h1>
                <div className="flex flex-wrap items-center gap-6">
                  <p className="text-alloro-orange font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-2.5">
                    <Globe size={16} /> LICENSE 2025-AO-ACTIVE
                  </p>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200 hidden md:block"></div>
                  <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-2.5">
                    <Award size={16} /> Platinum Authority Tier
                  </p>
                </div>
              </div>
            </div>
            <button className="hidden xl:flex px-10 py-5 bg-alloro-navy text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl hover:bg-black active:scale-95 transition-all">
              Access Audit Logs
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-[1100px] mx-auto px-6 lg:px-10 py-10 lg:py-16 space-y-12 lg:space-y-12">
          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex p-1.5 bg-white border border-black/5 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] w-fit"
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
              Integrations
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
              <div className="xl:col-span-5 space-y-8">
                <div className="bg-white rounded-[2.5rem] border border-black/5 p-10 shadow-premium animate-pulse">
                  <div className="h-4 w-32 bg-slate-100 rounded mb-10" />
                  <div className="space-y-8">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-start gap-5">
                        <div className="w-10 h-10 bg-slate-100 rounded-2xl" />
                        <div>
                          <div className="h-3 w-16 bg-slate-100 rounded mb-2" />
                          <div className="h-4 w-32 bg-slate-100 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="xl:col-span-7 space-y-8 lg:space-y-10">
                <div className="h-6 w-48 bg-slate-100 rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-[2.5rem] border border-black/5 p-10 shadow-premium animate-pulse"
                    >
                      <div className="flex items-center justify-between mb-10">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                        <div className="h-6 w-16 bg-slate-100 rounded-lg" />
                      </div>
                      <div className="h-5 w-40 bg-slate-100 rounded mb-2" />
                      <div className="h-3 w-24 bg-slate-100 rounded mb-8" />
                      <div className="h-4 w-28 bg-slate-100 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 lg:gap-20">
              {/* Left Column - Practice Identity */}
              <section className="xl:col-span-5 space-y-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2.5rem] border border-black/5 p-10 lg:p-14 shadow-premium space-y-12 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-alloro-orange/[0.03] rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-alloro-orange/[0.06] transition-all duration-700"></div>

                  <div className="flex items-center justify-between relative z-10">
                    <h3 className="text-[11px] font-black text-alloro-textDark/20 uppercase tracking-[0.4em] leading-none">
                      Practice Identity
                    </h3>
                    <div className="px-4 py-1.5 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>{" "}
                      System Active
                    </div>
                  </div>
                  <div className="space-y-10 relative z-10">
                    <InfoRow
                      icon={<MapPin size={24} />}
                      label="Operational Jurisdiction"
                      value="Winter Garden, FL 34787"
                    />
                    <InfoRow
                      icon={<Globe size={24} />}
                      label="Digital Authority"
                      value={
                        selectedDomain?.domain ||
                        userProfile?.domainName ||
                        "artfulorthodontics.com"
                      }
                    />
                    <InfoRow
                      icon={<Database size={24} />}
                      label="Ledger Infrastructure"
                      value="Cloud9 Integrated"
                    />
                    <InfoRow
                      icon={<Mail size={24} />}
                      label="Command Outreach"
                      value="dr.pawlak@artfulortho.com"
                    />
                    <InfoRow
                      icon={<Phone size={24} />}
                      label="Clinical Contact"
                      value="(407) 555-0123"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-alloro-navy rounded-[2.5rem] p-10 lg:p-14 text-white relative overflow-hidden shadow-2xl group text-left"
                >
                  <div className="absolute top-0 right-0 p-64 bg-alloro-orange/5 rounded-full -mr-32 -mt-32 blur-[100px] pointer-events-none group-hover:bg-alloro-orange/10 transition-all duration-700"></div>
                  <div className="relative z-10 space-y-10">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 group-hover:scale-110 transition-transform duration-500">
                      <Shield size={32} className="text-white/60" />
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-2xl font-black font-heading tracking-tight text-white leading-none">
                        Clinical Security Shield
                      </h4>
                      <p className="text-blue-100/40 text-lg font-bold leading-relaxed tracking-tight">
                        All PMS & Patient data is fortified via AES-256
                        end-to-end encryption protocols. Full HIPAA integrity
                        verified daily.
                      </p>
                    </div>
                    <div className="flex items-center gap-10 pt-4">
                      <div className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                        <Lock size={16} /> SOC2 SECURE
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                        <Activity size={16} /> LIVE AUDIT
                      </div>
                    </div>
                  </div>
                </motion.div>
              </section>

              {/* Right Column - Integrations */}
              <section className="xl:col-span-7 space-y-12 lg:space-y-16">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-4">
                  <div className="text-left space-y-2">
                    <h2 className="text-2xl lg:text-3xl font-black text-alloro-navy font-heading tracking-tight leading-none">
                      Intelligence Ecosystem
                    </h2>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      Connected Practice Hubs
                    </p>
                  </div>
                  <button
                    onClick={handleFullSync}
                    disabled={isSyncing}
                    className="flex items-center gap-3 text-[11px] font-black text-alloro-orange uppercase tracking-[0.25em] hover:gap-5 transition-all group disabled:opacity-50"
                  >
                    <RefreshCw
                      size={16}
                      className={`group-hover:rotate-180 transition-transform duration-700 ${
                        isSyncing ? "animate-spin" : ""
                      }`}
                    />
                    Full System Refresh
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {integrations.map((app, index) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-[2rem] border border-black/5 p-10 shadow-premium group transition-all duration-500 hover:shadow-2xl hover:border-alloro-orange/20 hover:-translate-y-1 text-left"
                    >
                      <div className="flex items-center justify-between mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-alloro-bg flex items-center justify-center p-4 border border-black/5 shadow-inner-soft group-hover:bg-white transition-all duration-500">
                          <img
                            src={app.icon}
                            alt={app.name}
                            className="w-full h-full object-contain grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                          />
                        </div>
                        {app.connected ? (
                          <span className="px-4 py-1.5 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-green-100 flex items-center gap-2 shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>{" "}
                            Synced
                          </span>
                        ) : (
                          <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 shadow-sm">
                            Disconnected
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-alloro-navy text-xl font-heading tracking-tight mb-2 truncate leading-tight group-hover:text-alloro-orange transition-colors">
                        {app.name}
                      </h3>
                      <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-10 leading-none">
                        {app.connected
                          ? `Last Heartbeat: ${app.lastSync}`
                          : "Not connected"}
                      </p>

                      {canManageConnections && app.id !== "clarity" ? (
                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() =>
                              handleConnect(app.id as "ga4" | "gsc" | "gbp")
                            }
                            className="text-alloro-navy/30 text-[10px] font-black flex items-center gap-3 uppercase tracking-[0.25em] hover:text-alloro-orange transition-all group/btn w-fit"
                          >
                            {app.connected
                              ? "Configure Node"
                              : "Initialize Node"}
                            <ChevronRight
                              size={16}
                              className="group-hover/btn:translate-x-1 transition-transform"
                            />
                          </button>

                          {app.connected && (
                            <button
                              onClick={() =>
                                initiateDisconnect(
                                  app.id as "ga4" | "gsc" | "gbp"
                                )
                              }
                              className="text-red-300 text-[10px] font-black flex items-center gap-3 uppercase tracking-[0.25em] hover:text-red-500 transition-all w-fit mt-1"
                            >
                              Disconnect
                            </button>
                          )}
                        </div>
                      ) : (
                        <button className="text-alloro-navy/30 text-[10px] font-black flex items-center gap-3 uppercase tracking-[0.25em] hover:text-alloro-orange transition-all group/btn">
                          View Node{" "}
                          <ChevronRight
                            size={16}
                            className="group-hover/btn:translate-x-1 transition-transform"
                          />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="p-16 lg:p-24 bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center text-center shadow-inner-soft group hover:border-alloro-orange/30 hover:bg-white transition-all duration-700 cursor-pointer">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-white shadow-premium flex items-center justify-center mb-10 border border-black/5 text-slate-200 group-hover:scale-110 group-hover:text-alloro-orange transition-all duration-500">
                    <LayoutGrid size={36} />
                  </div>
                  <h4 className="font-black text-alloro-navy text-3xl font-heading tracking-tight mb-4">
                    Initialize New Connector
                  </h4>
                  <p className="text-slate-400 text-lg font-bold max-w-sm leading-relaxed mb-12 tracking-tight opacity-70">
                    Expand your intelligence matrix by connecting new{" "}
                    <span className="text-alloro-navy">
                      CRM, PMS, or Marketing
                    </span>{" "}
                    assets.
                  </p>
                  <button className="px-12 py-6 bg-white border border-black/5 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] text-alloro-navy hover:border-alloro-orange/20 hover:text-alloro-orange transition-all shadow-premium active:scale-95">
                    Launch Hub Discovery
                  </button>
                </div>
              </section>
            </div>
          )}

          <footer className="pt-24 pb-12 flex flex-col items-center gap-10 text-center">
            <div className="w-16 h-16 bg-alloro-orange text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-2xl">
              A
            </div>
            <p className="text-[11px] text-alloro-textDark/20 font-black tracking-[0.4em] uppercase">
              Alloro Profile Management • v2.6.0
            </p>
          </footer>
        </main>
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
