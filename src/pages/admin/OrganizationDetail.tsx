import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  RefreshCw,
  Crown,
  Users,
  Globe,
  AlertTriangle,
  Trash2,
  X,
  Loader2,
  CheckSquare,
  Database,
  Trophy,
  MessageSquare,
  FileText,
  TrendingUp,
  Target,
  Share2,
  Bell,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { AdminPageHeader, Badge } from "../../components/ui/DesignSystem";
import { OrgLocationSelector } from "../../components/Admin/OrgLocationSelector";
import { OrgTasksTab } from "../../components/Admin/OrgTasksTab";
import { OrgPmsTab } from "../../components/Admin/OrgPmsTab";
import { OrgAgentOutputsTab } from "../../components/Admin/OrgAgentOutputsTab";
import { OrgRankingsTab } from "../../components/Admin/OrgRankingsTab";
import { OrgNotificationsTab } from "../../components/Admin/OrgNotificationsTab";
import {
  adminGetOrganization,
  adminGetOrganizationLocations,
  adminUpdateOrganizationTier,
  adminDeleteOrganization,
  adminStartPilotSession,
  type AdminOrganizationDetail,
  type AdminLocation,
} from "../../api/admin-organizations";

const TAB_KEYS = [
  "tasks",
  "notifications",
  "rankings",
  "pms",
  "proofline",
  "summary",
  "opportunity",
  "cro",
  "referral",
] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_CONFIG: Record<TabKey, { label: string; icon: React.ReactNode }> = {
  tasks: { label: "Tasks Hub", icon: <CheckSquare className="h-4 w-4" /> },
  notifications: { label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  rankings: { label: "Rankings", icon: <Trophy className="h-4 w-4" /> },
  pms: { label: "PMS Ingestion", icon: <Database className="h-4 w-4" /> },
  proofline: { label: "Proofline", icon: <MessageSquare className="h-4 w-4" /> },
  summary: { label: "Summary", icon: <FileText className="h-4 w-4" /> },
  opportunity: { label: "Opportunity", icon: <TrendingUp className="h-4 w-4" /> },
  cro: { label: "CRO", icon: <Target className="h-4 w-4" /> },
  referral: { label: "Referral Engine", icon: <Share2 className="h-4 w-4" /> },
};

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") || "tasks") as TabKey;

  const [org, setOrg] = useState<AdminOrganizationDetail | null>(null);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<AdminLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [tierConfirm, setTierConfirm] = useState<"DWY" | "DFY" | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const orgId = parseInt(id || "0", 10);

  useEffect(() => {
    if (!orgId) {
      toast.error("Invalid organization ID");
      navigate("/admin/organization-management");
      return;
    }
    loadData();
  }, [orgId]);

  const loadData = async () => {
    try {
      const [orgRes, locRes] = await Promise.all([
        adminGetOrganization(orgId),
        adminGetOrganizationLocations(orgId),
      ]);

      if (orgRes.success) {
        // Merge users, connections, and website into the organization object
        setOrg({
          ...orgRes.organization,
          users: orgRes.users || [],
          connections: orgRes.connections || [],
          website: orgRes.website,
        });
      }
      if (locRes.success) {
        setLocations(locRes.locations);
        if (locRes.locations.length > 0 && !selectedLocation) {
          setSelectedLocation(locRes.locations[0]);
        }
      }
    } catch {
      toast.error("Failed to load organization details");
      navigate("/admin/organization-management");
    } finally {
      setLoading(false);
    }
  };

  const handleTierChange = async () => {
    if (!tierConfirm || !org) return;
    setTierConfirm(null);

    try {
      const response = await adminUpdateOrganizationTier(orgId, tierConfirm);
      if (response.success) {
        setOrg((prev) =>
          prev ? { ...prev, subscription_tier: tierConfirm } : null,
        );
        toast.success(response.message);
      } else {
        toast.error("Failed to update tier");
      }
    } catch {
      toast.error("Failed to update tier");
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== org?.name || !org) return;
    setIsDeleting(true);

    try {
      await adminDeleteOrganization(orgId);
      toast.success(`"${org.name}" has been permanently deleted`);
      navigate("/admin/organization-management");
    } catch {
      toast.error("Failed to delete organization");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePilotSession = async (
    userId: number,
    userName: string,
    userRole: string,
  ) => {
    try {
      toast.loading(`Starting pilot session for ${userName}...`);
      const response = await adminStartPilotSession(userId);

      if (response.success) {
        toast.dismiss();
        toast.success("Pilot session started!");

        let pilotUrl = `/?pilot_token=${response.token}`;
        if (response.googleAccountId) {
          pilotUrl += `&organization_id=${response.googleAccountId}`;
        }
        pilotUrl += `&user_role=${userRole}`;

        const width = 1280;
        const height = 800;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        window.open(
          pilotUrl,
          "Pilot",
          `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`,
        );
      }
    } catch (error) {
      toast.dismiss();
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Pilot failed: ${message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <motion.div
          className="flex items-center gap-3 text-gray-500"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <RefreshCw className="h-5 w-5 animate-spin" />
          Loading organization...
        </motion.div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Organization not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/organization-management")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to organizations"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <AdminPageHeader
            icon={<Globe className="w-6 h-6" />}
            title={org.name}
            description={org.domain || "No domain assigned"}
            actionButtons={
              <div className="flex items-center gap-3">
                <Badge
                  variant={org.subscription_tier === "DFY" ? "orange" : "gray"}
                >
                  {org.subscription_tier || "DWY"}
                </Badge>
                <OrgLocationSelector
                  locations={locations}
                  selectedLocation={selectedLocation}
                  onSelect={setSelectedLocation}
                />
              </div>
            }
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex flex-wrap gap-px bg-gray-50 border-b border-gray-200 p-1">
          {TAB_KEYS.map((tab) => (
            <button
              key={tab}
              onClick={() => setSearchParams({ tab })}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? "bg-white text-alloro-orange border border-alloro-orange/20"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {TAB_CONFIG[tab].icon}
              {TAB_CONFIG[tab].label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "tasks" && (
            <OrgTasksTab
              organizationId={orgId}
              locationId={selectedLocation?.id ?? null}
            />
          )}
          {activeTab === "notifications" && (
            <OrgNotificationsTab
              organizationId={orgId}
              locationId={selectedLocation?.id ?? null}
            />
          )}
          {activeTab === "rankings" && (
            <OrgRankingsTab
              organizationId={orgId}
              locationId={selectedLocation?.id ?? null}
            />
          )}
          {activeTab === "pms" && (
            <OrgPmsTab
              organizationId={orgId}
              locationId={selectedLocation?.id ?? null}
            />
          )}
          {activeTab === "proofline" && (
            <OrgAgentOutputsTab
              organizationId={orgId}
              agentType="proofline"
              locationId={selectedLocation?.id ?? null}
            />
          )}
          {activeTab === "summary" && (
            <OrgAgentOutputsTab
              organizationId={orgId}
              agentType="summary"
              locationId={selectedLocation?.id ?? null}
            />
          )}
          {activeTab === "opportunity" && (
            <OrgAgentOutputsTab
              organizationId={orgId}
              agentType="opportunity"
              locationId={selectedLocation?.id ?? null}
            />
          )}
          {activeTab === "cro" && (
            <OrgAgentOutputsTab
              organizationId={orgId}
              agentType="cro_optimizer"
              locationId={selectedLocation?.id ?? null}
            />
          )}
          {activeTab === "referral" && (
            <OrgAgentOutputsTab
              organizationId={orgId}
              agentType="referral_engine"
              locationId={selectedLocation?.id ?? null}
            />
          )}
        </div>
      </div>

      {/* Subscription Management */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-200 bg-white p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-5 w-5 text-alloro-orange" />
          <h3 className="font-semibold text-gray-900">Subscription Tier</h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Current: <strong>{org.subscription_tier || "DWY"}</strong>
          </span>
          {(!org.subscription_tier || org.subscription_tier === "DWY") && (
            <button
              onClick={() => setTierConfirm("DFY")}
              className="px-4 py-2 bg-alloro-orange text-white text-sm rounded-lg hover:bg-alloro-orange/90 transition-colors"
            >
              Upgrade to DFY
            </button>
          )}
          {org.subscription_tier === "DFY" && (
            <button
              onClick={() => setTierConfirm("DWY")}
              className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              Downgrade to DWY
            </button>
          )}
        </div>
      </motion.div>

      {/* Users List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-200 bg-white p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-alloro-navy" />
          <h3 className="font-semibold text-gray-900">Users & Roles</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(org.users || []).map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 hover:border-alloro-orange/30 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-alloro-navy/10 text-sm font-semibold text-alloro-navy">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {user.name}
                </p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={() =>
                  handlePilotSession(user.id, user.name, user.role)
                }
                className="p-2 text-gray-400 hover:text-alloro-orange hover:bg-alloro-orange/10 rounded-lg transition-colors shrink-0"
                title="Pilot as this user"
              >
                →
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Connections */}
      {(org.connections || []).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-200 bg-white p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Connections</h3>
          <div className="space-y-3">
            {(org.connections || []).map((conn, idx) => (
              <div key={idx} className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">
                  Connected via{" "}
                  <span className="font-medium">{conn.email}</span>
                </p>
                {conn.properties?.gbp && conn.properties.gbp.length > 0 ? (
                  <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded px-2 py-1 inline-block mt-2 font-medium">
                    GBP: {conn.properties.gbp.length} locations
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded px-2 py-1 inline-block mt-2">
                    No GBP
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-red-200 overflow-hidden"
      >
        <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="font-semibold text-red-900">Danger Zone</h3>
        </div>
        <div className="p-6 bg-white flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Delete this organization
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Permanently remove this organization and all of its data.
            </p>
          </div>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors shrink-0"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </motion.div>

      {/* Tier Confirmation Modal */}
      {tierConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setTierConfirm(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              {tierConfirm === "DFY" ? "Upgrade" : "Downgrade"} to {tierConfirm}
              ?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {tierConfirm === "DFY"
                ? `This will upgrade "${org.name}" to DFY and create a website project.`
                : `This will downgrade "${org.name}" to DWY and set the website project to read-only.`}
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                onClick={() => setTierConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTierChange}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  tierConfirm === "DFY"
                    ? "bg-alloro-orange hover:bg-alloro-orange/90"
                    : "bg-gray-600 hover:bg-gray-700"
                }`}
              >
                {tierConfirm === "DFY" ? "Upgrade" : "Downgrade"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteConfirm(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden"
          >
            <button
              onClick={() => !isDeleting && setDeleteConfirm(false)}
              disabled={isDeleting}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-red-50 text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Organization
                </h3>
              </div>

              <div className="space-y-4 mb-6">
                <p className="text-sm text-gray-600">
                  This will{" "}
                  <strong className="text-red-600">permanently delete</strong> "
                  {org.name}" and all associated data.
                </p>
                <p className="text-sm text-red-600 font-bold">
                  This action cannot be undone.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <strong>"{org.name}"</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-300"
                  placeholder={org.name}
                  disabled={isDeleting}
                  autoComplete="off"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== org.name || isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete Organization
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
