import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, User, AlertTriangle } from "lucide-react";

export function AdminTopBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-end border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-8 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={toggleMenu}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-alloro-navy shadow-sm transition-all hover:border-alloro-orange/30 hover:shadow active:scale-95"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-alloro-orange/10 text-alloro-orange">
              <User className="h-4 w-4" />
            </span>
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold text-alloro-navy">
                Admin Account
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Administrator
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform ${
                isMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
              >
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-alloro-navy/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-red-100 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-alloro-navy font-heading">
                  Confirm Logout
                </h3>
              </div>
              <p className="mb-6 text-sm text-slate-600">
                Are you sure you want to log out of the admin panel?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-700 shadow-lg shadow-red-200"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
