import React, { useState, useEffect, type ReactNode } from "react";
import {
  AuthContext,
  type AuthContextType,
  type DomainMapping,
  type UserProfile,
} from "./authContext";
import onboarding from "../api/onboarding";
import { getPriorityItem } from "../hooks/useLocalStorage";

interface AuthProviderProps {
  children: ReactNode;
}

// Removed hardcoded domain mappings - data should come from user's onboarding/profile

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [selectedDomain, setSelectedDomain] = useState<DomainMapping | null>(
    null
  );
  const [isLoadingUserProperties, setIsLoadingUserProperties] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Function to load user properties (can be called on mount or manually)
  const loadUserProperties = async () => {
    setIsLoadingUserProperties(true);
    try {
      // Always try to get googleAccountId from priority storage as the most reliable source
      // This supports both normal (localStorage) and pilot (sessionStorage) modes
      const storedGoogleAccountId = getPriorityItem("google_account_id");
      const googleAccountIdFromStorage = storedGoogleAccountId
        ? parseInt(storedGoogleAccountId, 10)
        : null;

      const status = await onboarding.getOnboardingStatus();

      if (status.success && status.onboardingCompleted && status.propertyIds) {
        // Get googleAccountId: prefer backend, then localStorage
        const googleAccountId =
          status.profile?.googleAccountId || googleAccountIdFromStorage;

        // Load user profile - always set it if we have any data
        setUserProfile({
          firstName: status.profile?.firstName || null,
          lastName: status.profile?.lastName || null,
          practiceName: status.profile?.practiceName || null,
          domainName: status.profile?.domainName || null,
          email: status.profile?.email || null,
          googleAccountId,
        });

        // Transform onboarding data to DomainMapping format
        const userMapping: DomainMapping = {
          domain:
            status.profile?.domainName ||
            status.propertyIds.ga4?.displayName ||
            "Your Practice",
          displayName:
            status.profile?.practiceName ||
            status.propertyIds.ga4?.displayName ||
            "Your Practice",
          ga4_propertyId:
            status.propertyIds.ga4?.propertyId?.replace("properties/", "") ||
            "",
          gsc_domainkey: status.propertyIds.gsc?.siteUrl || "",
          gbp_accountId: status.propertyIds.gbp?.[0]?.accountId || "",
          gbp_locationId: status.propertyIds.gbp?.[0]?.locationId || "",
        };
        setSelectedDomain(userMapping);
      } else if (googleAccountIdFromStorage) {
        // Even if onboarding status fails, if we have googleAccountId in localStorage,
        // set a minimal userProfile so dashboard can fetch data
        console.log(
          "[AuthContext] Onboarding status incomplete but googleAccountId found in localStorage:",
          googleAccountIdFromStorage
        );
        setUserProfile((prev) => ({
          firstName: prev?.firstName || null,
          lastName: prev?.lastName || null,
          practiceName: prev?.practiceName || null,
          domainName: prev?.domainName || null,
          googleAccountId: googleAccountIdFromStorage,
        }));
        // No fallback to hardcoded data - let the domain remain null
        setSelectedDomain(null);
      } else {
        // No fallback to hardcoded data if onboarding not completed
        setSelectedDomain(null);
      }
    } catch (error) {
      console.error("Failed to load user properties:", error);
      // Even on error, try to use priority storage googleAccountId
      const storedGoogleAccountId = getPriorityItem("google_account_id");
      if (storedGoogleAccountId) {
        setUserProfile((prev) => ({
          firstName: prev?.firstName || null,
          lastName: prev?.lastName || null,
          practiceName: prev?.practiceName || null,
          domainName: prev?.domainName || null,
          googleAccountId: parseInt(storedGoogleAccountId, 10),
        }));
      }
      // No fallback to hardcoded data on error
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
    // This function is kept for interface compatibility but does nothing
    console.warn(
      "[AuthContext] handleDomainChange called but no domain mappings exist"
    );
  };

  const contextValue: AuthContextType = {
    domains: [], // No hardcoded domain mappings
    selectedDomain,
    handleDomainChange,
    setSelectedDomain,
    isLoadingUserProperties,
    userProfile,
    refreshUserProperties: loadUserProperties,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
