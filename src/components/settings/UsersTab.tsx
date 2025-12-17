import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Shield, Clock, X, Users as UsersIcon } from "lucide-react";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  joined_at: string;
}

interface Invitation {
  id: number;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}

type UserRole = "admin" | "manager" | "viewer";

export const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [changingRoleUserId, setChangingRoleUserId] = useState<number | null>(
    null
  );
  const [newRole, setNewRole] = useState<string>("");

  useEffect(() => {
    // Get current user's role
    const role = localStorage.getItem("user_role") as UserRole | null;
    setCurrentUserRole(role);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const googleAccountId = localStorage.getItem("google_account_id");
      if (!googleAccountId) return;

      const response = await axios.get("/api/settings/users", {
        headers: { "x-google-account-id": googleAccountId },
      });

      if (response.data.success) {
        setUsers(response.data.users);
        setInvitations(response.data.invitations);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const googleAccountId = localStorage.getItem("google_account_id");
      if (!googleAccountId) return;

      await axios.post(
        "/api/settings/users/invite",
        { email: inviteEmail, role: inviteRole },
        { headers: { "x-google-account-id": googleAccountId } }
      );

      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("viewer");
      fetchUsers(); // Reload
    } catch (err) {
      console.error("Failed to invite user:", err);
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || "Failed to invite user");
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (!confirm("Are you sure you want to remove this user?")) return;
    try {
      const googleAccountId = localStorage.getItem("google_account_id");
      if (!googleAccountId) return;

      await axios.delete(`/api/settings/users/${userId}`, {
        headers: { "x-google-account-id": googleAccountId },
      });

      fetchUsers(); // Reload
    } catch (err) {
      console.error("Failed to remove user:", err);
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || "Failed to remove user");
    }
  };

  const handleChangeRole = async (userId: number, role: string) => {
    try {
      const googleAccountId = localStorage.getItem("google_account_id");
      if (!googleAccountId) return;

      await axios.put(
        `/api/settings/users/${userId}/role`,
        { role },
        { headers: { "x-google-account-id": googleAccountId } }
      );

      alert("Role updated successfully. The user will need to log in again.");
      setChangingRoleUserId(null);
      fetchUsers(); // Reload
    } catch (err) {
      console.error("Failed to change role:", err);
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || "Failed to change role");
    }
  };

  const canManageRoles = currentUserRole === "admin";
  const canRemoveUsers = currentUserRole === "admin";
  const canInvite =
    currentUserRole === "admin" || currentUserRole === "manager";

  // Available roles for invitation based on current user role
  const availableRoles =
    currentUserRole === "manager"
      ? [
          { value: "viewer", label: "Viewer (Read Only)" },
          { value: "manager", label: "Manager (Can Edit)" },
        ]
      : [
          { value: "viewer", label: "Viewer (Read Only)" },
          { value: "manager", label: "Manager (Can Edit)" },
          { value: "admin", label: "Admin (Full Access)" },
        ];

  if (isLoading)
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-xl" />
            <div>
              <div className="h-5 w-36 bg-slate-200 rounded mb-2" />
              <div className="h-4 w-56 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="h-10 w-36 bg-slate-200 rounded-xl" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 grid grid-cols-4 gap-4">
            <div className="h-3 w-16 bg-slate-200 rounded" />
            <div className="h-3 w-12 bg-slate-200 rounded" />
            <div className="h-3 w-14 bg-slate-200 rounded" />
            <div className="h-3 w-16 bg-slate-200 rounded ml-auto" />
          </div>

          {/* Table Rows */}
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="px-6 py-4 border-b border-slate-100 grid grid-cols-4 gap-4 items-center"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div>
                  <div className="h-4 w-28 bg-slate-200 rounded mb-1.5" />
                  <div className="h-3 w-40 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="h-7 w-20 bg-slate-200 rounded-lg" />
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="flex justify-end gap-2">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-4 w-16 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-alloro-cobalt/10 rounded-xl">
            <UsersIcon className="w-5 h-5 text-alloro-cobalt" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-alloro-navy font-heading">
              Team Members
            </h2>
            <p className="text-slate-500 text-sm">
              Manage who has access to this organization.
            </p>
          </div>
        </div>
        {canInvite && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-5 py-2.5 bg-alloro-cobalt text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-bold flex items-center gap-2 shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </motion.div>

      {/* Users List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200 overflow-hidden"
      >
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-xl bg-alloro-cobalt/10 flex items-center justify-center text-alloro-cobalt font-bold text-sm mr-3">
                      {user.name
                        ? user.name.charAt(0).toUpperCase()
                        : user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-alloro-navy">
                        {user.name || "Unknown"}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {changingRoleUserId === user.id && canManageRoles ? (
                    <select
                      value={newRole || user.role}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-alloro-cobalt/20 focus:border-alloro-cobalt outline-none"
                      autoFocus
                    >
                      <option value="viewer">Viewer</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold capitalize border ${
                        user.role === "admin"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : user.role === "manager"
                          ? "bg-alloro-cobalt/5 text-alloro-cobalt border-alloro-cobalt/20"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(user.joined_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {changingRoleUserId === user.id ? (
                      <>
                        <button
                          onClick={() => {
                            if (newRole && newRole !== user.role) {
                              handleChangeRole(user.id, newRole);
                            } else {
                              setChangingRoleUserId(null);
                            }
                          }}
                          className="text-alloro-cobalt hover:text-blue-700 text-sm font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setChangingRoleUserId(null);
                            setNewRole("");
                          }}
                          className="text-slate-500 hover:text-slate-700 text-sm font-bold"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {canManageRoles && (
                          <button
                            onClick={() => {
                              setChangingRoleUserId(user.id);
                              setNewRole(user.role);
                            }}
                            className="text-alloro-cobalt hover:text-blue-700 text-sm font-bold"
                          >
                            Change Role
                          </button>
                        )}
                        {canRemoveUsers && (
                          <button
                            onClick={() => handleRemoveUser(user.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-bold"
                          >
                            Remove
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Invitations List */}
      {invitations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-md font-bold text-alloro-navy font-heading flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Pending Invitations
          </h3>
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-100">
                {invitations.map((invite) => (
                  <tr key={invite.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-alloro-navy">
                        {invite.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                        <Clock className="w-3.5 h-3.5" />
                        {invite.role} (Pending)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      Expires:{" "}
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-alloro-navy/50 backdrop-blur-sm"
              onClick={() => setShowInviteModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-alloro-cobalt/10 rounded-xl">
                    <UserPlus className="w-5 h-5 text-alloro-cobalt" />
                  </div>
                  <h3 className="text-lg font-bold text-alloro-navy font-heading">
                    Invite Team Member
                  </h3>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleInvite} className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-alloro-navy mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-alloro-cobalt/20 focus:border-alloro-cobalt outline-none transition-all text-alloro-navy"
                      placeholder="colleague@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-alloro-navy mb-2">
                      Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-alloro-cobalt/20 focus:border-alloro-cobalt outline-none transition-all text-alloro-navy"
                    >
                      {availableRoles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    {currentUserRole === "manager" && (
                      <p className="text-xs text-slate-500 mt-2 font-medium">
                        Managers can only invite Viewers and Managers
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-alloro-cobalt text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-md"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
