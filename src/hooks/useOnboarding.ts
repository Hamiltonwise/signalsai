import { useState, useCallback } from "react";
import onboarding from "../api/onboarding";

interface GBPSelection {
  accountId: string;
  locationId: string;
  displayName: string;
}

export const useOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

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

  const [isLoading, setIsLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
   * Save selected GBP locations
   */
  const saveGbpSelections = useCallback(async (locations: GBPSelection[]) => {
    setSelectedGbpLocations(locations);

    const saveResponse = await onboarding.saveGBP(locations);
    if (!saveResponse.success) {
      throw new Error(saveResponse.errorMessage || "Failed to save GBP selection");
    }

    console.log("[Onboarding] GBP selections saved:", locations.length, "locations");
  }, []);

  /**
   * Step 2: Save profile data and create/update the organization.
   * Does NOT mark onboarding as complete.
   * Returns the organizationId on success.
   */
  const saveProfileAndCreateOrg = useCallback(async (): Promise<number | null> => {
    setIsSavingProfile(true);
    setError(null);

    try {
      const formattedAddress = `${street}, ${city}, ${state} ${zip}`;

      const response = await onboarding.saveProfile({
        profile: {
          firstName,
          lastName,
          phone: businessPhone,
          practiceName,
          operationalJurisdiction: formattedAddress,
          domainName,
        },
      });

      if (response.success) {
        console.log("[Onboarding] Profile saved, org:", response.organizationId);
        return response.organizationId;
      } else {
        throw new Error(response.errorMessage || response.message || "Failed to save profile");
      }
    } catch (err: any) {
      console.error("[Onboarding] Error saving profile:", err);
      setError(err.message || "Failed to save profile");
      return null;
    } finally {
      setIsSavingProfile(false);
    }
  }, [firstName, lastName, businessPhone, practiceName, street, city, state, zip, domainName]);

  /**
   * Step 3: Mark onboarding as complete.
   * Profile data was already saved in Step 2.
   */
  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await onboarding.completeOnboarding();

      if (response.success) {
        console.log("[Onboarding] Successfully completed!");
        return true;
      } else {
        throw new Error(response.message || "Failed to complete onboarding");
      }
    } catch (err: any) {
      console.error("[Onboarding] Error completing onboarding:", err);
      setError(err.message || "Failed to complete onboarding");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    setError(null);
    console.log("[Onboarding] Reset");
  }, []);

  return {
    currentStep,
    setCurrentStep,
    totalSteps,
    isLoading,
    isSavingProfile,
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
    fetchAvailableGBP,
    saveGbpSelections,

    // Actions
    saveProfileAndCreateOrg,
    nextStep,
    previousStep,
    completeOnboarding,
    resetOnboarding,
  };
};
