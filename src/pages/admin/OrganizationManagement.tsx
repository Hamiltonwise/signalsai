import { useState, useEffect } from "react";
import {
  Users,
  ChevronDown,
  ChevronRight,
  Shield,
  CheckCircle,
  XCircle,
  Building,
  Edit2,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Organization {
  id: number;
  name: string;
  domain: string | null;
  created_at: string;
  userCount: number;
  connections: {
    ga4: boolean;
    gsc: boolean;
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
      ga4?: { name: string } | null;
      gsc?: { name: string } | null;
      gbp?: Array<Record<string, unknown>> | null;
    } | null;
  }>;
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

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem("admin_token");
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
        const token = localStorage.getItem("admin_token");
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

  const handleUpdateName = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingOrgId || !editName.trim()) return;

    try {
      const token = localStorage.getItem("admin_token");
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
      const token = localStorage.getItem("admin_token");

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
        if (data.googleAccountId) {
          pilotUrl += `&google_account_id=${data.googleAccountId}`;
        }
        // Pass the user's role for proper permission handling in pilot mode
        pilotUrl += `&user_role=${userRole}`;

        // Calculate centered window position
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
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Organizations</h2>
          <p className="text-sm text-gray-500">
            Manage all organizations and their connections
          </p>
        </div>
        <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          Total: {organizations.length}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="divide-y divide-gray-200">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="group transition-colors hover:bg-gray-50"
            >
              {/* Header Row */}
              <div
                className="flex cursor-pointer items-center gap-4 p-4"
                onClick={() => toggleExpand(org.id)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Building className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {editingOrgId === org.id ? (
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={handleUpdateName}
                          className="rounded bg-blue-600 p-1 text-white hover:bg-blue-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="rounded bg-gray-200 p-1 text-gray-600 hover:bg-gray-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="group/name flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {org.name}
                        </h3>
                        <button
                          onClick={(e) => startEditing(e, org)}
                          className="opacity-0 transition-opacity group-hover/name:opacity-100 p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {org.domain && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {org.domain}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {org.userCount} users
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-2">
                      <ConnectionBadge
                        label="GA4"
                        connected={org.connections.ga4}
                      />
                      <ConnectionBadge
                        label="GSC"
                        connected={org.connections.gsc}
                      />
                      <ConnectionBadge
                        label="GBP"
                        connected={org.connections.gbp}
                      />
                    </span>
                  </div>
                </div>

                <button className="text-gray-400 transition-colors group-hover:text-gray-600">
                  {expandedOrgId === org.id ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Expanded Details */}
              {expandedOrgId === org.id && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4 pl-[4.5rem]">
                  {loadingDetails === org.id ? (
                    <div className="py-4 text-center text-sm text-gray-500">
                      Loading details...
                    </div>
                  ) : orgDetails[org.id] ? (
                    <div className="space-y-6">
                      {/* Users Section */}
                      <div>
                        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Users & Roles
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {orgDetails[org.id].users.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
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
                              <div
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                                  user.role === "admin"
                                    ? "bg-purple-100 text-purple-700"
                                    : user.role === "manager"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {user.role}
                              </div>
                              <button
                                onClick={() =>
                                  startPilotSession(
                                    user.id,
                                    user.name,
                                    user.role
                                  )
                                }
                                className="ml-2 rounded-full p-1 text-gray-400 hover:bg-amber-100 hover:text-amber-600 transition-colors"
                                title="Pilot as this user"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Connections Detail Section */}
                      <div>
                        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Connection Details
                        </h4>
                        <div className="space-y-2">
                          {orgDetails[org.id].connections.map((conn) => (
                            <div
                              key={conn.accountId}
                              className="rounded-lg border border-gray-200 bg-white p-3"
                            >
                              <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                                <Shield className="h-4 w-4" />
                                <span>Connected via {conn.email}</span>
                              </div>
                              <div className="flex gap-2">
                                {conn.properties && conn.properties.ga4 ? (
                                  <div className="rounded bg-green-50 px-2 py-1 text-xs text-green-700 border border-green-100">
                                    GA4: {conn.properties.ga4.name}
                                  </div>
                                ) : (
                                  <div className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-400 border border-gray-100">
                                    No GA4
                                  </div>
                                )}
                                {conn.properties && conn.properties.gsc ? (
                                  <div className="rounded bg-green-50 px-2 py-1 text-xs text-green-700 border border-green-100">
                                    GSC: {conn.properties.gsc.name}
                                  </div>
                                ) : (
                                  <div className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-400 border border-gray-100">
                                    No GSC
                                  </div>
                                )}
                                {conn.properties &&
                                conn.properties.gbp &&
                                conn.properties.gbp.length > 0 ? (
                                  <div className="rounded bg-green-50 px-2 py-1 text-xs text-green-700 border border-green-100">
                                    GBP: {conn.properties.gbp.length} locations
                                  </div>
                                ) : (
                                  <div className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-400 border border-gray-100">
                                    No GBP
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-red-500">
                      Failed to load details
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
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
    <span
      className={`flex items-center gap-1 text-xs ${
        connected ? "text-green-600" : "text-gray-400"
      }`}
    >
      {connected ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {label}
    </span>
  );
}
