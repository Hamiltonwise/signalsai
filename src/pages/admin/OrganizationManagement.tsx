import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ChevronDown,
  Shield,
  CheckCircle,
  XCircle,
  Building,
  Edit2,
  X,
  ExternalLink,
  RefreshCw,
  Globe,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  AdminPageHeader,
  Badge,
  EmptyState,
} from "../../components/ui/DesignSystem";
import {
  cardVariants,
  expandCollapse,
  chevronVariants,
  staggerContainer,
} from "../../lib/animations";

interface Organization {
  id: number;
  name: string;
  domain: string | null;
  subscription_tier?: string;
  created_at: string;
  userCount: number;
  connections: {
    gbp: boolean;
  };
}

interface OrganizationDetails {
  id: number;
  name: string;
  domain: string | null;
  created_at: string;
  userCount: number;
  users: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    joined_at: string;
  }>;
  connections: Array<{
    accountId: number;
    email: string;
    properties: {
      gbp?: Array<Record<string, unknown>> | null;
    } | null;
  }>;
  website?: {
    id: string;
    generated_hostname: string;
    status: string;
    created_at: string;
  } | null;
}

export function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrgId, setExpandedOrgId] = useState<number | null>(null);
  const [orgDetails, setOrgDetails] = useState<
    Record<number, OrganizationDetails>
  >({});
  const [loadingDetails, setLoadingDetails] = useState<number | null>(null);
  const [editingOrgId, setEditingOrgId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [tierConfirm, setTierConfirm] = useState<{
    orgId: number;
    orgName: string;
    tier: "DWY" | "DFY";
  } | null>(null);

  const formatStatus = (status: string): string => {
    return status
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/admin/organizations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Super Admin privileges required.");
        }
        throw new Error("Failed to fetch organizations");
      }

      const data = await response.json();
      setOrganizations(data.organizations);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch organizations";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (orgId: number) => {
    if (expandedOrgId === orgId) {
      setExpandedOrgId(null);
      return;
    }

    setExpandedOrgId(orgId);

    if (!orgDetails[orgId]) {
      setLoadingDetails(orgId);
      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(`/api/admin/organizations/${orgId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch details");

        const data = await response.json();
        setOrgDetails((prev) => ({
          ...prev,
          [orgId]: {
            ...data.organization,
            users: data.users,
            connections: data.connections,
            website: data.website,
          },
        }));
      } catch {
        toast.error("Failed to load organization details");
      } finally {
        setLoadingDetails(null);
      }
    }
  };

  const startEditing = (e: React.MouseEvent, org: Organization) => {
    e.stopPropagation();
    setEditingOrgId(org.id);
    setEditName(org.name);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingOrgId(null);
    setEditName("");
  };

  const handleTierChange = (orgId: number, orgName: string, tier: "DWY" | "DFY") => {
    setTierConfirm({ orgId, orgName, tier });
  };

  const confirmTierChange = async () => {
    if (!tierConfirm) return;
    const { orgId, tier } = tierConfirm;
    setTierConfirm(null);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/admin/organizations/${orgId}/tier`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) throw new Error("Failed to update tier");

      const data = await response.json();
      setOrganizations((prev) =>
        prev.map((org) =>
          org.id === orgId ? { ...org, subscription_tier: tier } : org
        )
      );
      toast.success(data.message);
    } catch (error) {
      toast.error("Failed to update tier");
    }
  };

  const handleUpdateName = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingOrgId || !editName.trim()) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/admin/organizations/${editingOrgId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName }),
      });

      if (!response.ok) throw new Error("Failed to update organization");

      setOrganizations((prev) =>
        prev.map((org) =>
          org.id === editingOrgId ? { ...org, name: editName } : org
        )
      );
      toast.success("Organization updated");
      setEditingOrgId(null);
    } catch {
      toast.error("Failed to update organization");
    }
  };

  const startPilotSession = async (
    userId: number,
    userName: string,
    userRole: string
  ) => {
    try {
      toast.loading(`Starting pilot session for ${userName}...`);
      const token = localStorage.getItem("auth_token");

      const response = await fetch(`/api/admin/pilot/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to initialize pilot session");
      }

      const data = await response.json();

      if (data.success) {
        toast.dismiss();
        toast.success("Pilot session started!");

        let pilotUrl = `/?pilot_token=${data.token}`;
        if (data.organizationId) {
          pilotUrl += `&organization_id=${data.organizationId}`;
        }
        pilotUrl += `&user_role=${userRole}`;

        const width = 1280;
        const height = 800;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        window.open(
          pilotUrl,
          "Pilot",
          `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
        );
      }
    } catch (error) {
      toast.dismiss();
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Pilot failed: ${message}`);
      console.error("Pilot session error:", error);
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
          Loading organizations...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        icon={<Building className="w-6 h-6" />}
        title="Organizations"
        description="Manage accounts and their integrations"
        actionButtons={
          <div className="flex items-center gap-3">
            <Badge label={`${organizations.length} total`} color="blue" />
          </div>
        }
      />

      {/* Organization List */}
      {organizations.length === 0 ? (
        <EmptyState
          icon={<Building className="w-8 h-8" />}
          title="No organizations"
          description="No organizations have been created yet."
        />
      ) : (
        <motion.div
          className="space-y-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {organizations.map((org, index) => (
            <motion.div
              key={org.id}
              custom={index}
              variants={cardVariants}
              className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-lg"
            >
              {/* Header Row */}
              <motion.div
                className="flex cursor-pointer items-center gap-4 p-5"
                onClick={() => toggleExpand(org.id)}
                whileTap={{ scale: 0.995 }}
              >
                <motion.div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-alloro-navy/5 text-alloro-navy"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <Building className="h-6 w-6" />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {editingOrgId === org.id ? (
                      <motion.div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-alloro-orange focus:ring-2 focus:ring-alloro-orange/20 focus:outline-none"
                          autoFocus
                        />
                        <motion.button
                          onClick={handleUpdateName}
                          className="rounded-lg bg-alloro-orange p-1.5 text-white hover:bg-alloro-navy transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          onClick={cancelEditing}
                          className="rounded-lg bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                      </motion.div>
                    ) : (
                      <div className="group/name flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {org.name}
                        </h3>
                        <Badge variant={org.subscription_tier === "DFY" ? "orange" : "gray"}>
                          {org.subscription_tier || "DWY"}
                        </Badge>
                        <motion.button
                          onClick={(e) => startEditing(e, org)}
                          className="opacity-0 transition-opacity group-hover/name:opacity-100 p-1.5 text-gray-400 hover:text-alloro-orange rounded-lg hover:bg-alloro-orange/10"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </motion.button>
                      </div>
                    )}
                    {org.domain && (
                      <Badge label={org.domain} color="gray" />
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {org.userCount} users
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-3">
                      <ConnectionBadge label="GBP" connected={org.connections.gbp} />
                    </span>
                  </div>
                </div>

                <motion.div
                  variants={chevronVariants}
                  animate={expandedOrgId === org.id ? "expanded" : "collapsed"}
                  className="text-gray-400"
                >
                  <ChevronDown className="h-5 w-5" />
                </motion.div>
              </motion.div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedOrgId === org.id && (
                  <motion.div
                    variants={expandCollapse}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                      {loadingDetails === org.id ? (
                        <motion.div
                          className="py-8 text-center text-sm text-gray-500 flex items-center justify-center gap-2"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Loading details...
                        </motion.div>
                      ) : orgDetails[org.id] ? (
                        <motion.div
                          className="space-y-6"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          {/* Subscription Tier Section */}
                          <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Subscription Tier
                            </h4>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-600">
                                Current: <strong>{org.subscription_tier || "DWY"}</strong>
                              </span>
                              {(!org.subscription_tier || org.subscription_tier === "DWY") && (
                                <button
                                  onClick={() => handleTierChange(org.id, org.name, "DFY")}
                                  className="px-3 py-1 bg-alloro-orange text-white text-sm rounded-lg hover:bg-alloro-orange/90 transition-colors"
                                >
                                  Upgrade to DFY
                                </button>
                              )}
                              {org.subscription_tier === "DFY" && (
                                <button
                                  onClick={() => handleTierChange(org.id, org.name, "DWY")}
                                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                  Downgrade to DWY
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Website Section */}
                          <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Website
                            </h4>
                            {orgDetails[org.id].website ? (
                              <Link
                                to={`/admin/websites/${orgDetails[org.id].website!.id}`}
                                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-alloro-orange/30 hover:shadow-md transition-all"
                              >
                                <Globe className="h-5 w-5 text-alloro-orange" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {orgDetails[org.id].website!.generated_hostname}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatStatus(orgDetails[org.id].website!.status)}
                                  </p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-gray-400" />
                              </Link>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Globe className="h-4 w-4 text-gray-300" />
                                <span>No website linked</span>
                              </div>
                            )}
                          </div>

                          {/* Users Section */}
                          <div>
                            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Users & Roles
                            </h4>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {orgDetails[org.id].users.map((user, idx) => (
                                <motion.div
                                  key={user.id}
                                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-alloro-orange/30 hover:shadow-md transition-all"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                >
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-alloro-navy/10 text-sm font-semibold text-alloro-navy">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-900">
                                      {user.name}
                                    </p>
                                    <p className="truncate text-xs text-gray-500">
                                      {user.email}
                                    </p>
                                  </div>
                                  <Badge
                                    label={user.role}
                                    color={
                                      user.role === "admin"
                                        ? "purple"
                                        : user.role === "manager"
                                        ? "blue"
                                        : "gray"
                                    }
                                  />
                                  <motion.button
                                    onClick={() =>
                                      startPilotSession(user.id, user.name, user.role)
                                    }
                                    className="ml-1 rounded-lg p-2 text-gray-400 hover:bg-amber-100 hover:text-amber-600 transition-colors"
                                    title="Pilot as this user"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </motion.button>
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {/* Connections Detail Section */}
                          <div>
                            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Connection Details
                            </h4>
                            <div className="space-y-3">
                              {orgDetails[org.id].connections.map((conn, idx) => (
                                <motion.div
                                  key={conn.accountId}
                                  className="rounded-xl border border-gray-200 bg-white p-4"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                >
                                  <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
                                    <Shield className="h-4 w-4 text-alloro-orange" />
                                    <span>Connected via <span className="font-medium">{conn.email}</span></span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {conn.properties &&
                                    conn.properties.gbp &&
                                    conn.properties.gbp.length > 0 ? (
                                      <div className="rounded-lg bg-green-50 px-3 py-1.5 text-xs text-green-700 border border-green-100">
                                        <span className="font-semibold">GBP:</span> {conn.properties.gbp.length} locations
                                      </div>
                                    ) : (
                                      <div className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-400 border border-gray-100">
                                        No GBP
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="text-sm text-red-500 py-4 text-center">
                          Failed to load details
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Tier Change Confirm Modal */}
      <AnimatePresence>
        {tierConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
              onClick={() => setTierConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {tierConfirm.tier === "DFY" ? "Upgrade" : "Downgrade"} to {tierConfirm.tier}?
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {tierConfirm.tier === "DFY"
                  ? `This will upgrade "${tierConfirm.orgName}" to DFY and create a website project.`
                  : `This will downgrade "${tierConfirm.orgName}" to DWY and set the website project to read-only.`}
              </p>
              <div className="mt-5 flex gap-3 justify-end">
                <button
                  onClick={() => setTierConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTierChange}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    tierConfirm.tier === "DFY"
                      ? "bg-alloro-orange hover:bg-alloro-orange/90"
                      : "bg-gray-600 hover:bg-gray-700"
                  }`}
                >
                  {tierConfirm.tier === "DFY" ? "Upgrade" : "Downgrade"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConnectionBadge({
  label,
  connected,
}: {
  label: string;
  connected: boolean;
}) {
  return (
    <motion.span
      className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg ${
        connected
          ? "text-green-700 bg-green-50"
          : "text-gray-400 bg-gray-50"
      }`}
      whileHover={{ scale: 1.05 }}
    >
      {connected ? (
        <CheckCircle className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      {label}
    </motion.span>
  );
}
