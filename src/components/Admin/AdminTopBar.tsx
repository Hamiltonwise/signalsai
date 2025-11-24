import { useState } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";

export function AdminTopBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const toggleMenu = () => setIsMenuOpen((value) => !value);

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleLogout = () => {
    // Clear admin authentication tokens
    localStorage.removeItem("admin_token");
    localStorage.removeItem("google_account_id");

    // Redirect to admin login
    window.location.href = "/admin";
  };

  return (
    <>
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="text-xl font-semibold text-gray-900">Alloro Admin</div>
        <div className="relative">
          <button
            type="button"
            onClick={toggleMenu}
            className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:text-gray-900"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <User className="h-4 w-4" />
            </span>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-gray-900">
                Admin Account
              </span>
              <span className="text-xs text-gray-500">Administrator</span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
          {isMenuOpen ? (
            <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              <button
                type="button"
                onClick={handleLogoutClick}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 text-gray-500" />
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Confirm Logout
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to log out of the admin panel?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
