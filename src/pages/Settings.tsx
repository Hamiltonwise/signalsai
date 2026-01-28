import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  MapPin,
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
  Edit3,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { PropertySelectionModal } from "../components/settings/PropertySelectionModal";
import { ConfirmModal } from "../components/settings/ConfirmModal";
import { UsersTab } from "../components/settings/UsersTab";
import { MissingScopeBanner } from "../components/settings/MissingScopeBanner";
import { getProfile, updateProfile, type ProfileData } from "../api/profile";
import { getPriorityItem } from "../hooks/useLocalStorage";
import { apiGet, apiPost } from "../api";

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

interface ScopeStatus {
  granted: boolean;
  scope: string;
  name: string;
  description: string;
}

interface ScopesState {
  ga4: ScopeStatus;
  gsc: ScopeStatus;
  gbp: ScopeStatus;
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const InfoRow = ({ icon, label, value }: InfoRowProps) => (
  <div className="flex items-start gap-4 group">
    <div className="p-2.5 bg-alloro-bg text-alloro-navy/40 rounded-xl shrink-0 group-hover:text-alloro-orange group-hover:bg-alloro-orange/5 transition-all duration-500 border border-black/5 shadow-inner-soft group-hover:shadow-premium">
      {icon}
    </div>
    <div className="min-w-0 text-left">
      <div className="text-[8px] font-black text-alloro-textDark/30 uppercase tracking-[0.2em] mb-0.5 leading-none">
        {label}
      </div>
      <div className="text-base font-black text-alloro-navy tracking-tight truncate group-hover:translate-x-1 transition-transform">
        {value}
      </div>
    </div>
  </div>
);

interface EditableInfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  placeholder: string;
  onSave: (value: string) => Promise<void>;
  isSaving?: boolean;
}

const EditableInfoRow = ({
  icon,
  label,
  value,
  placeholder,
  onSave,
  isSaving = false,
}: EditableInfoRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");

  const handleSave = async () => {
    if (editValue.trim()) {
      await onSave(editValue.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="flex items-start gap-4 group">
      <div className="p-2.5 bg-alloro-bg text-alloro-navy/40 rounded-xl shrink-0 group-hover:text-alloro-orange group-hover:bg-alloro-orange/5 transition-all duration-500 border border-black/5 shadow-inner-soft group-hover:shadow-premium">
        {icon}
      </div>
      <div className="min-w-0 text-left flex-1">
        <div className="text-[8px] font-black text-alloro-textDark/30 uppercase tracking-[0.2em] mb-0.5 leading-none">
          {label}
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-base font-black text-alloro-navy tracking-tight bg-white border border-alloro-orange/30 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-alloro-orange/50 w-full"
              autoFocus
              disabled={isSaving}
            />
            <button
              onClick={handleSave}
              disabled={isSaving || !editValue.trim()}
              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              <Check size={16} />
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        ) : value ? (
          <div className="flex items-center gap-2">
            <div className="text-base font-black text-alloro-navy tracking-tight truncate group-hover:translate-x-1 transition-transform">
              {value}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-alloro-navy/30 hover:text-alloro-orange transition-all"
            >
              <Edit3 size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-bold text-alloro-orange hover:text-alloro-orange/80 transition-colors flex items-center gap-2"
          >
            <Edit3 size={14} />
            {placeholder}
          </button>
        )}
      </div>
    </div>
  );
};

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

  // Scopes State
  const [scopesStatus, setScopesStatus] = useState<ScopesState | null>(null);
  const [missingScopes, setMissingScopes] = useState<string[]>([]);
  const [missingScopeCount, setMissingScopeCount] = useState(0);

  // Profile State
  const [profileData, setProfileData] = useState<ProfileData>({
    phone: null,
    operational_jurisdiction: null,
  });
  const [isProfileSaving, setIsProfileSaving] = useState(false);

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
    const role = getPriorityItem("user_role") as UserRole | null;
    setUserRole(role);
    fetchProperties();
    fetchProfile();
    fetchScopes();
  }, []);

  const fetchScopes = async () => {
    try {
      const googleAccountId = getPriorityItem("google_account_id");
      if (!googleAccountId) return;

      const response = await apiGet({ path: "/settings/scopes" });

      if (response.success) {
        setScopesStatus(response.scopes);
        setMissingScopes(response.missingScopes || []);
        setMissingScopeCount(response.missingCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch scopes:", err);
    }
  };

  const handleGrantAccessComplete = () => {
    // Refresh scopes after granting access
    fetchScopes();
    fetchProperties();
  };

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      if (response.success && response.data) {
        setProfileData(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const handleUpdateProfile = async (
    field: keyof ProfileData,
    value: string,
  ) => {
    setIsProfileSaving(true);
    try {
      const response = await updateProfile({ [field]: value });
      if (response.success) {
        setProfileData((prev) => ({ ...prev, [field]: value }));
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setIsProfileSaving(false);
    }
  };

  const canManageConnections = userRole === "admin";

  const fetchProperties = async () => {
    try {
      const googleAccountId = getPriorityItem("google_account_id");
      if (!googleAccountId) return;

      const response = await apiGet({ path: "/settings/properties" });

      if (response.success) {
        setProperties(response.properties);
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
      const googleAccountId = getPriorityItem("google_account_id");
      if (!googleAccountId) return;

      const response = await apiGet({
        path: `/settings/properties/available/${type}`,
      });

      if (response.success) {
        const available = response.properties;
        setAvailableProperties(available);

        if (type === "gbp" && properties.gbp.length > 0) {
          const gbpIds = properties.gbp.map((p) => p.locationId);

          const matchedIds = available
            .filter((item: { locationId: string }) =>
              gbpIds.includes(item.locationId),
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
      const googleAccountId = getPriorityItem("google_account_id");
      if (!googleAccountId) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = {};
      if (modalType === "ga4") {
        data = { propertyId: item.id, displayName: item.name };
      } else if (modalType === "gsc") {
        data = { siteUrl: item.id, displayName: item.name };
      }

      await apiPost({
        path: "/settings/properties/update",
        passedData: { type: modalType, data, action: "connect" },
      });

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
      const googleAccountId = getPriorityItem("google_account_id");
      if (!googleAccountId) return;

      const data = items.map((item) => ({
        accountId: item.accountId,
        locationId: item.locationId,
        displayName: item.name,
      }));

      await apiPost({
        path: "/settings/properties/update",
        passedData: { type: modalType, data, action: "connect" },
      });

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
      const googleAccountId = getPriorityItem("google_account_id");
      if (!googleAccountId) return;

      await apiPost({
        path: "/settings/properties/update",
        passedData: { type: disconnectType, action: "disconnect" },
      });

      fetchProperties();
      setConfirmOpen(false);
      setDisconnectType(null);
    } catch (err) {
      console.error("Failed to disconnect property:", err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Check if a scope is granted
  const isScopeGranted = (serviceId: string): boolean => {
    if (!scopesStatus) return true; // Assume granted if we don't have scope info yet
    const scopeKey = serviceId as keyof ScopesState;
    return scopesStatus[scopeKey]?.granted ?? true;
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
      scopeGranted: isScopeGranted("ga4"),
    },
    {
      id: "gbp",
      name: "Google Business Profile",
      icon: "/google-business-profile.png",
      connected: properties.gbp && properties.gbp.length > 0,
      lastSync:
        properties.gbp && properties.gbp.length > 0
          ? "1 hour ago"
          : "Not connected",
      locations: properties.gbp,
      scopeGranted: isScopeGranted("gbp"),
    },
    {
      id: "gsc",
      name: "Google Search Console",
      icon: "/google-search-console.png",
      connected: !!properties.gsc,
      lastSync: properties.gsc ? "2 hours ago" : "Not connected",
      property: properties.gsc,
      scopeGranted: isScopeGranted("gsc"),
    },
    {
      id: "clarity",
      name: "Microsoft Clarity",
      icon: "/microsoft-clarity.png",
      connected: true,
      lastSync: "30 mins ago",
      scopeGranted: true, // Clarity doesn't use Google OAuth
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
                  {userProfile?.practiceName || "Your Practice"}
                </h1>
              </div>
            </div>
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
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
              {/* Left Column - Practice Identity */}
              <section className="xl:col-span-5 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2rem] border border-black/5 p-6 lg:p-8 shadow-premium space-y-6 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-alloro-orange/[0.03] rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-alloro-orange/[0.06] transition-all duration-700"></div>

                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-green-500"></div>{" "}
                      Active Account
                    </div>
                    <button className="text-[9px] font-black uppercase tracking-[0.2em] text-alloro-orange/40 hover:text-alloro-orange transition-colors">
                      Edit Details
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-x-8 gap-y-5 relative z-10">
                    <EditableInfoRow
                      icon={<MapPin size={18} />}
                      label="Location"
                      value={profileData.operational_jurisdiction}
                      placeholder="Enter your location"
                      onSave={(value) =>
                        handleUpdateProfile("operational_jurisdiction", value)
                      }
                      isSaving={isProfileSaving}
                    />
                    <InfoRow
                      icon={<Globe size={18} />}
                      label="Website"
                      value={
                        selectedDomain?.domain ||
                        userProfile?.domainName ||
                        "Not configured"
                      }
                    />
                    <InfoRow
                      icon={<Mail size={18} />}
                      label="Email"
                      value={userProfile?.email || "Not configured"}
                    />
                    <EditableInfoRow
                      icon={<Phone size={18} />}
                      label="Phone"
                      value={profileData.phone}
                      placeholder="Enter your phone"
                      onSave={(value) => handleUpdateProfile("phone", value)}
                      isSaving={isProfileSaving}
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-alloro-navy rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden shadow-2xl group text-left"
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-alloro-orange/5 rounded-full -mr-24 -mt-24 blur-[60px] pointer-events-none group-hover:bg-alloro-orange/10 transition-all duration-700"></div>
                  <div className="relative z-10 flex items-center gap-6">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                      <Shield size={22} className="text-white/60" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold leading-snug tracking-tight text-white/90">
                        <span className="text-alloro-orange font-black">
                          Encrypted & Secure.
                        </span>{" "}
                        All patient and practice data is protected by high-level
                        encryption protocols.
                      </p>
                      <div className="flex items-center gap-4 pt-1">
                        <span className="flex items-center gap-1.5 text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">
                          <Lock size={10} /> HIPAA Compliant
                        </span>
                        <span className="flex items-center gap-1.5 text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">
                          <Activity size={10} /> Monitored 24/7
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </section>

              {/* Right Column - Integrations */}
              <section
                data-wizard-target="settings-integrations"
                className="xl:col-span-7 space-y-10"
              >
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-4">
                    <button
                      onClick={handleFullSync}
                      disabled={isSyncing}
                      className="flex items-center gap-3 text-[11px] font-black text-alloro-orange uppercase tracking-[0.25em] hover:gap-5 transition-all group disabled:opacity-50 ml-auto"
                    >
                      <RefreshCw
                        size={16}
                        className={`group-hover:rotate-180 transition-transform duration-700 ${
                          isSyncing ? "animate-spin" : ""
                        }`}
                      />
                      Refresh Page
                    </button>
                  </div>

                  {/* Missing Scopes Banner */}
                  {missingScopeCount > 0 && (
                    <MissingScopeBanner
                      missingCount={missingScopeCount}
                      missingScopes={missingScopes}
                      onGrantAccess={handleGrantAccessComplete}
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {integrations.map((app, index) => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`rounded-[2rem] border p-10 shadow-premium group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 text-left relative ${
                          !app.scopeGranted && app.id !== "clarity"
                            ? "bg-red-50/60 border-red-200 hover:border-red-300"
                            : app.connected
                              ? "bg-white border-black/5 hover:border-alloro-orange/20"
                              : "bg-white border-black/5 hover:border-alloro-orange/20"
                        }`}
                      >
                        {/* Missing Scope Warning Banner on Card */}
                        {!app.scopeGranted && app.id !== "clarity" && (
                          <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest py-2 px-4 rounded-t-[2rem] flex items-center gap-2 justify-center">
                            <AlertTriangle size={12} />
                            API Access Not Granted
                          </div>
                        )}

                        <div
                          className={`flex items-center justify-between mb-10 ${!app.scopeGranted && app.id !== "clarity" ? "mt-6" : ""}`}
                        >
                          <div
                            className={`w-16 h-16 rounded-2xl bg-alloro-bg flex items-center justify-center p-3 border shadow-inner-soft group-hover:bg-white transition-all duration-500 overflow-hidden ${!app.scopeGranted && app.id !== "clarity" ? "border-red-200 opacity-60" : "border-black/5"}`}
                          >
                            <img
                              src={app.icon}
                              alt={app.name}
                              className="w-full h-full object-contain transition-all duration-700 group-hover:scale-110"
                            />
                          </div>
                          {!app.scopeGranted && app.id !== "clarity" ? (
                            <span className="px-4 py-1.5 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-red-200 flex items-center gap-2 shadow-sm">
                              <AlertTriangle size={12} />
                              No Access
                            </span>
                          ) : app.connected ? (
                            <span className="px-4 py-1.5 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-green-100 flex items-center gap-2 shadow-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>{" "}
                              Connected
                            </span>
                          ) : (
                            <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 shadow-sm">
                              Disconnected
                            </span>
                          )}
                        </div>
                        <h3
                          className={`font-black text-xl font-heading tracking-tight mb-2 truncate leading-tight transition-colors ${!app.scopeGranted && app.id !== "clarity" ? "text-red-800" : "text-alloro-navy group-hover:text-alloro-orange"}`}
                        >
                          {app.name}
                        </h3>
                        <p
                          className={`text-[11px] font-black uppercase tracking-widest mb-10 leading-none ${!app.scopeGranted && app.id !== "clarity" ? "text-red-500" : "text-slate-400"}`}
                        >
                          {!app.scopeGranted && app.id !== "clarity"
                            ? "Requires API permission"
                            : app.connected
                              ? "Active"
                              : "Not connected"}
                        </p>

                        {canManageConnections && app.id !== "clarity" ? (
                          <div className="flex flex-col gap-3">
                            {app.scopeGranted ? (
                              <>
                                <button
                                  onClick={() =>
                                    handleConnect(
                                      app.id as "ga4" | "gsc" | "gbp",
                                    )
                                  }
                                  className="text-alloro-navy/30 text-[10px] font-black flex items-center gap-3 uppercase tracking-[0.25em] hover:text-alloro-orange transition-all group/btn w-fit"
                                >
                                  {app.connected
                                    ? "Update Connection"
                                    : "Connect Property"}
                                  <ChevronRight
                                    size={16}
                                    className="group-hover/btn:translate-x-1 transition-transform"
                                  />
                                </button>

                                {app.connected && (
                                  <button
                                    onClick={() =>
                                      initiateDisconnect(
                                        app.id as "ga4" | "gsc" | "gbp",
                                      )
                                    }
                                    className="text-red-300 text-[10px] font-black flex items-center gap-3 uppercase tracking-[0.25em] hover:text-red-500 transition-all w-fit mt-1"
                                  >
                                    Disconnect
                                  </button>
                                )}
                              </>
                            ) : (
                              <p className="text-red-600 text-xs">
                                Grant API access using the banner above to
                                enable this integration.
                              </p>
                            )}
                          </div>
                        ) : null}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="p-12 lg:p-16 bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center text-center shadow-inner-soft group hover:border-alloro-orange/30 hover:bg-white transition-all duration-700 cursor-pointer">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-white shadow-premium flex items-center justify-center mb-8 border border-black/5 text-slate-200 group-hover:scale-110 group-hover:text-alloro-orange transition-all duration-500">
                      <LayoutGrid size={36} />
                    </div>
                    <p className="text-slate-400 text-base font-bold max-w-sm leading-relaxed mb-10 tracking-tight opacity-70">
                      Integrate your{" "}
                      <span className="text-alloro-navy">
                        CRM, Patient Management, or Marketing
                      </span>{" "}
                      platforms to ingest more clinical and financial data.
                    </p>
                    <button className="px-12 py-5 bg-white border border-black/5 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] text-alloro-navy hover:border-alloro-orange/20 hover:text-alloro-orange transition-all shadow-premium active:scale-95">
                      Connect New Link
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          <footer className="pt-16 pb-12 flex flex-col items-center gap-10 text-center">
            <img
              src="/logo.png"
              alt="Alloro"
              className="w-16 h-16 rounded-2xl shadow-2xl"
            />
            <p className="text-[11px] text-alloro-textDark/20 font-black tracking-[0.4em] uppercase">
              Alloro Settings • v2.6.0
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
