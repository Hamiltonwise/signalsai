import React, { useEffect, useState } from "react";
import axios from "axios";

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

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          <p className="text-gray-500 text-sm">
            Manage who has access to this organization.
          </p>
        </div>
        {canInvite && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Invite Member
          </button>
        )}
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3">
                      {user.name
                        ? user.name.charAt(0).toUpperCase()
                        : user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {changingRoleUserId === user.id && canManageRoles ? (
                    <select
                      value={newRole || user.role}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    >
                      <option value="viewer">Viewer</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : user.role === "manager"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.joined_at).toLocaleDateString()}
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
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setChangingRoleUserId(null);
                            setNewRole("");
                          }}
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
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
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Change Role
                          </button>
                        )}
                        {canRemoveUsers && (
                          <button
                            onClick={() => handleRemoveUser(user.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
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
      </div>

      {/* Invitations List */}
      {invitations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-gray-900">
            Pending Invitations
          </h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <tbody className="divide-y divide-gray-100">
                {invitations.map((invite) => (
                  <tr key={invite.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {invite.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 capitalize">
                        {invite.role} (Pending)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      Expires:{" "}
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Invite Team Member
            </h3>
            <form onSubmit={handleInvite}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="colleague@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    {availableRoles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {currentUserRole === "manager" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Managers can only invite Viewers and Managers
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
