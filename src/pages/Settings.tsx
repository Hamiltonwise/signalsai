import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Users, Link2 } from "lucide-react";
import { PropertiesTab } from "../components/settings/PropertiesTab";
import { UsersTab } from "../components/settings/UsersTab";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../hooks/useAuth";
import { useGoogleAuthContext } from "../contexts/googleAuthContext";

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"properties" | "users">(
    "properties"
  );
  const { userProfile, selectedDomain } = useAuth();
  const { disconnect } = useGoogleAuthContext();

  // Assuming onboarding is completed if we are in settings
  const onboardingCompleted = true;

  return (
    <div className="min-h-screen bg-alloro-bg">
      {/* Fixed Sidebar */}
      <Sidebar
        userProfile={userProfile}
        onboardingCompleted={onboardingCompleted}
        disconnect={disconnect}
        selectedDomain={selectedDomain}
      />

      {/* Main Content - Offset for fixed sidebar */}
      <main className="ml-64 min-h-screen">
        <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 px-6 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-alloro-cobalt/10 rounded-xl">
                <SettingsIcon className="w-6 h-6 text-alloro-cobalt" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-alloro-navy font-heading">
                  Settings
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Manage your integrations and team members
                </p>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex space-x-1 bg-white p-1.5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200 w-fit"
          >
            <button
              onClick={() => setActiveTab("properties")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                activeTab === "properties"
                  ? "bg-alloro-cobalt text-white shadow-md"
                  : "text-slate-500 hover:text-alloro-navy hover:bg-slate-50"
              }`}
            >
              <Link2 className="w-4 h-4" />
              Connect Properties
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                activeTab === "users"
                  ? "bg-alloro-cobalt text-white shadow-md"
                  : "text-slate-500 hover:text-alloro-navy hover:bg-slate-50"
              }`}
            >
              <Users className="w-4 h-4" />
              Users & Roles
            </button>
          </motion.div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "properties" ? <PropertiesTab /> : <UsersTab />}
          </motion.div>
        </div>
      </main>
    </div>
  );
};
