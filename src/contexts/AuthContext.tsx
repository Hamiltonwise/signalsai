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

// Domain mappings array - single source of truth for domain selection
const domainMappings: DomainMapping[] = [
  {
    domain: "artfulorthodontics.com",
    displayName: "Artful Orthodontics",
    gbp_accountId: "114810842911950437772",
    gbp_locationId: "10282052848626216313",
    gsc_domainkey: "sc-domain:artfulorthodontics.com",
    ga4_propertyId: "381278947",
  },
];

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
      // Always try to get googleAccountId from localStorage as the most reliable source
      const storedGoogleAccountId = localStorage.getItem("google_account_id");
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
        // Fallback to hardcoded mappings
        setSelectedDomain(domainMappings.length > 0 ? domainMappings[0] : null);
      } else {
        // Fallback to hardcoded mappings if onboarding not completed
        setSelectedDomain(domainMappings.length > 0 ? domainMappings[0] : null);
      }
    } catch (error) {
      console.error("Failed to load user properties:", error);
      // Even on error, try to use localStorage googleAccountId
      const storedGoogleAccountId = localStorage.getItem("google_account_id");
      if (storedGoogleAccountId) {
        setUserProfile((prev) => ({
          firstName: prev?.firstName || null,
          lastName: prev?.lastName || null,
          practiceName: prev?.practiceName || null,
          domainName: prev?.domainName || null,
          googleAccountId: parseInt(storedGoogleAccountId, 10),
        }));
      }
      // Fallback to hardcoded mappings on error
      setSelectedDomain(domainMappings.length > 0 ? domainMappings[0] : null);
    } finally {
      setIsLoadingUserProperties(false);
    }
  };

  // Load user's onboarding selections on mount
  useEffect(() => {
    loadUserProperties();
  }, []);

  const handleDomainChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const domainValue = event.target.value;
    const mapping = domainMappings.find(
      (mapping) => mapping.domain === domainValue
    );
    setSelectedDomain(mapping || null);
  };

  const contextValue: AuthContextType = {
    domains: domainMappings,
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
