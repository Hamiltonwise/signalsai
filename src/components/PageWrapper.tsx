import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Bell } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { LocationTransitionOverlay } from "./LocationTransitionOverlay";
import { useAuth } from "../hooks/useAuth";
import { useSession } from "../contexts/sessionContext";

interface PageWrapperProps {
  children: React.ReactNode;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  const { userProfile, selectedDomain, onboardingCompleted } = useAuth();
  const { disconnect } = useSession();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-alloro-bg min-h-screen font-body text-alloro-navy relative overflow-x-hidden selection:bg-alloro-orange selection:text-white">
      {/* Mobile Header - consistent across all pages */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-[60] shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-alloro-navy hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-alloro-orange rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {onboardingCompleted
                ? userProfile?.practiceName?.charAt(0)?.toUpperCase() || "A"
                : "A"}
            </div>
            <span className="text-alloro-navy font-heading font-black text-base hidden sm:inline-block">
              {onboardingCompleted
                ? userProfile?.practiceName || "Alloro"
                : "Alloro"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/notifications")}
            className="p-2 text-slate-400 hover:text-alloro-orange transition-colors relative"
          >
            <Bell size={20} />
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold border border-slate-200"
          >
            {userProfile?.practiceName?.substring(0, 2).toUpperCase() || "AP"}
          </button>
        </div>
      </div>

      <Sidebar
        userProfile={userProfile}
        onboardingCompleted={onboardingCompleted}
        disconnect={disconnect}
        selectedDomain={selectedDomain}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area - responsive padding applied here */}
      <main className="flex-1 w-full lg:pl-72 pt-16 lg:pt-0 min-h-screen flex flex-col transition-all duration-300">
        {children}
      </main>

      <LocationTransitionOverlay />
    </div>
  );
};
