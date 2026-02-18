import { useState, useCallback } from "react";
import onboarding from "../api/onboarding";
import type { AvailableProperties } from "../types/onboarding";

interface GBPSelection {
  accountId: string;
  locationId: string;
  displayName: string;
}

export const useOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; // User info (3 steps)

  // Profile state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [practiceName, setPracticeName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [domainName, setDomainName] = useState("");

  // GBP state
  const [selectedGbpLocations, setSelectedGbpLocations] = useState<GBPSelection[]>([]);
  const [gbpPrefillDomain, setGbpPrefillDomain] = useState("");

  const [availableProperties] = useState<AvailableProperties | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch available properties from API
   * Keeping this for now as it might be used for pre-fetching or checking status,
   * even if not used in the wizard steps directly anymore.
   */
  const fetchAvailableProperties = useCallback(async () => {
    // No-op for now
  }, []);

  /**
   * Fetch available GBP locations for the authenticated user
   */
  const fetchAvailableGBP = useCallback(async () => {
    const response = await onboarding.getAvailableGBP();
    if (response.success) {
      return response.properties as Array<{
        id: string;
        name: string;
        accountId: string;
        locationId: string;
        address?: string;
      }>;
    }
    throw new Error(response.errorMessage || "Failed to fetch GBP locations");
  }, []);

  /**
   * Save selected GBP locations and fetch domain from first location
   */
  const saveGbpSelections = useCallback(async (locations: GBPSelection[]) => {
    setSelectedGbpLocations(locations);

    // Save to google_property_ids immediately
    const saveResponse = await onboarding.saveGBP(locations);
    if (!saveResponse.success) {
      throw new Error(saveResponse.errorMessage || "Failed to save GBP selection");
    }

    console.log("[Onboarding] GBP selections saved:", locations.length, "locations");

    // Fetch website from first selected location for domain prefill
    if (locations.length > 0) {
      const first = locations[0];
      const websiteResponse = await onboarding.getGBPWebsite(
        first.accountId,
        first.locationId
      );

      if (websiteResponse.success && websiteResponse.domain) {
        setGbpPrefillDomain(websiteResponse.domain);
        // Only prefill if user hasn't manually entered a domain yet
        if (!domainName) {
          setDomainName(websiteResponse.domain);
        }
        console.log("[Onboarding] Domain prefilled from GBP:", websiteResponse.domain);
      }
    }
  }, [domainName]);

  /**
   * Move to next step
   */
  const nextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      console.log("[Onboarding] Moving to step", currentStep + 1);
    }
  }, [currentStep, totalSteps]);

  /**
   * Move to previous step
   */
  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      console.log("[Onboarding] Moving back to step", currentStep - 1);
    }
  }, [currentStep]);

  /**
   * Complete onboarding and save selections
   */
  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Format address as a single string
      const formattedAddress = `${street}, ${city}, ${state} ${zip}`;

      // Build selections with profile info
      const finalSelections = {
        profile: {
          firstName,
          lastName,
          phone: businessPhone,
          practiceName,
          operationalJurisdiction: formattedAddress,
          domainName,
        },
      };

      console.log("[Onboarding] Saving selections:", finalSelections);

      const response = await onboarding.saveProperties(finalSelections);

      if (response.success) {
        console.log("[Onboarding] Successfully completed!");
        return true;
      } else {
        throw new Error(response.message || "Failed to save properties");
      }
    } catch (err: any) {
      console.error("[Onboarding] Error completing onboarding:", err);
      setError(err.message || "Failed to complete onboarding");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [firstName, lastName, businessPhone, practiceName, street, city, state, zip, domainName]);

  /**
   * Reset onboarding state
   */
  const resetOnboarding = useCallback(() => {
    setCurrentStep(1);
    setFirstName("");
    setLastName("");
    setBusinessPhone("");
    setPracticeName("");
    setStreet("");
    setCity("");
    setState("");
    setZip("");
    setDomainName("");
    setSelectedGbpLocations([]);
    setGbpPrefillDomain("");
    setError(null);
    console.log("[Onboarding] Reset");
  }, []);

  return {
    currentStep,
    totalSteps,
    availableProperties,
    isLoading,
    error,

    // Profile state
    firstName,
    lastName,
    businessPhone,
    practiceName,
    street,
    city,
    state,
    zip,
    domainName,
    setFirstName,
    setLastName,
    setBusinessPhone,
    setPracticeName,
    setStreet,
    setCity,
    setState,
    setZip,
    setDomainName,

    // GBP state
    selectedGbpLocations,
    setSelectedGbpLocations,
    gbpPrefillDomain,
    fetchAvailableGBP,
    saveGbpSelections,

    fetchAvailableProperties,
    nextStep,
    previousStep,
    completeOnboarding,
    resetOnboarding,
  };
};
