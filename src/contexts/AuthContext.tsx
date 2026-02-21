import React, { useState, useEffect, type ReactNode } from "react";
import {
  AuthContext,
  type AuthContextType,
  type DomainMapping,
  type UserProfile,
} from "./authContext";
import onboarding from "../api/onboarding";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [selectedDomain, setSelectedDomain] = useState<DomainMapping | null>(
    null
  );
  const [isLoadingUserProperties, setIsLoadingUserProperties] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Centralized onboarding state - avoids duplicate API calls from Dashboard
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(() => {
    const cached = localStorage.getItem("onboardingCompleted");
    return cached === "true" ? true : cached === "false" ? false : null;
  });
  const [hasProperties, setHasProperties] = useState<boolean>(() => {
    const cached = localStorage.getItem("hasProperties");
    return cached !== "false"; // Default to true unless explicitly false
  });

  // Load user properties from the onboarding API (JWT provides auth context)
  const loadUserProperties = async () => {
    setIsLoadingUserProperties(true);
    try {
      const status = await onboarding.getOnboardingStatus();

      // Update centralized onboarding state
      const isCompleted = status.success && status.onboardingCompleted === true;
      setOnboardingCompleted(isCompleted);
      localStorage.setItem("onboardingCompleted", String(isCompleted));

      if (status.success && status.onboardingCompleted) {
        // Load user profile from backend response
        setUserProfile({
          firstName: status.profile?.firstName || null,
          lastName: status.profile?.lastName || null,
          practiceName: status.profile?.practiceName || null,
          domainName: status.profile?.domainName || null,
          email: status.profile?.email || null,
          organizationId: status.organizationId || null,
        });

        // Only set selectedDomain and hasProperties if propertyIds exist
        if (status.propertyIds) {
          const userMapping: DomainMapping = {
            domain:
              status.profile?.domainName ||
              "Your Practice",
            displayName:
              status.profile?.practiceName ||
              "Your Practice",
            gbp_accountId: status.propertyIds.gbp?.[0]?.accountId || "",
            gbp_locationId: status.propertyIds.gbp?.[0]?.locationId || "",
          };
          setSelectedDomain(userMapping);

          const hasProps = !!(
            status.propertyIds.gbp && status.propertyIds.gbp.length > 0
          );
          setHasProperties(hasProps);
          localStorage.setItem("hasProperties", String(hasProps));
        } else {
          setHasProperties(false);
          localStorage.setItem("hasProperties", "false");
        }
      } else {
        setSelectedDomain(null);
      }
    } catch (error) {
      console.error("Failed to load user properties:", error);
      setSelectedDomain(null);
    } finally {
      setIsLoadingUserProperties(false);
    }
  };

  // Load user's onboarding selections on mount
  useEffect(() => {
    loadUserProperties();
  }, []);

  const handleDomainChange = () => {
    // Domain change is no longer used since we removed hardcoded mappings
    console.warn(
      "[AuthContext] handleDomainChange called but no domain mappings exist"
    );
  };

  const contextValue: AuthContextType = {
    domains: [],
    selectedDomain,
    handleDomainChange,
    setSelectedDomain,
    isLoadingUserProperties,
    userProfile,
    refreshUserProperties: loadUserProperties,
    onboardingCompleted,
    hasProperties,
    setOnboardingCompleted,
    setHasProperties,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
