import React, { useState } from "react";
import { motion } from "framer-motion";
import { PropertiesTab } from "../components/settings/PropertiesTab";
import { UsersTab } from "../components/settings/UsersTab";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../hooks/useAuth";
import { useGoogleAuthContext } from "../contexts/googleAuthContext";

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"properties" | "users">("properties");
  const { userProfile, selectedDomain } = useAuth();
  const { disconnect } = useGoogleAuthContext();

  // Assuming onboarding is completed if we are in settings
  const onboardingCompleted = true;

  return (
    <div className="min-h-screen p-3 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px] flex gap-6">
        {/* Sidebar */}
        <Sidebar
          userProfile={userProfile}
          onboardingCompleted={onboardingCompleted}
          disconnect={disconnect}
          selectedDomain={selectedDomain}
        />

        {/* Main Content */}
        <main className="flex-1 glass rounded-3xl overflow-hidden bg-gray-50/50">
          <div className="p-8 h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

              {/* Tabs */}
              <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm mb-8 w-fit">
                <button
                  onClick={() => setActiveTab("properties")}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === "properties"
                      ? "bg-blue-50 text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Connect Properties
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === "users"
                      ? "bg-blue-50 text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Users & Roles
                </button>
              </div>

              {/* Content */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "properties" ? <PropertiesTab /> : <UsersTab />}
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
