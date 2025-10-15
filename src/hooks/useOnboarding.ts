import { useState, useCallback } from "react";
import onboarding from "../api/onboarding";
import type {
  AvailableProperties,
  PropertySelections,
  GA4Property,
  GSCSite,
  GBPLocation,
} from "../types/onboarding";

export const useOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6; // User info (3 steps) + GA4, GSC, GBP (3 steps)

  // Profile state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [practiceName, setPracticeName] = useState("");
  const [domainName, setDomainName] = useState("");

  const [availableProperties, setAvailableProperties] =
    useState<AvailableProperties | null>(null);
  const [selections, setSelections] = useState<PropertySelections>({
    profile: {
      firstName: "",
      lastName: "",
      practiceName: "",
      domainName: "",
    },
    ga4: null,
    gsc: null,
    gbp: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch available properties from API
   */
  const fetchAvailableProperties = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await onboarding.getAvailableProperties();

      if (response.success && response.properties) {
        setAvailableProperties(response.properties);
        console.log(
          "[Onboarding] Fetched available properties:",
          response.properties
        );
      } else {
        throw new Error(response.message || "Failed to fetch properties");
      }
    } catch (err: any) {
      console.error("[Onboarding] Error fetching properties:", err);
      setError(err.message || "Failed to fetch available properties");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Select GA4 property
   */
  const selectGA4Property = useCallback((property: GA4Property | null) => {
    setSelections((prev) => ({
      ...prev,
      ga4: property
        ? {
            propertyId: property.propertyId,
            displayName: property.displayName,
          }
        : null,
    }));
    console.log("[Onboarding] Selected GA4:", property);
  }, []);

  /**
   * Select GSC site
   */
  const selectGSCSite = useCallback((site: GSCSite | null) => {
    setSelections((prev) => ({
      ...prev,
      gsc: site
        ? {
            siteUrl: site.siteUrl,
            displayName: site.displayName,
          }
        : null,
    }));
    console.log("[Onboarding] Selected GSC:", site);
  }, []);

  /**
   * Select GBP locations (multiple)
   */
  const selectGBPLocations = useCallback((locations: GBPLocation[]) => {
    setSelections((prev) => ({
      ...prev,
      gbp: locations.map((loc) => ({
        accountId: loc.accountId,
        locationId: loc.locationId,
        displayName: loc.displayName,
      })),
    }));
    console.log("[Onboarding] Selected GBP locations:", locations);
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
   * Skip current step
   */
  const skipStep = useCallback(() => {
    // Steps 1-3 are profile steps (cannot skip)
    // Steps 4-6 are property steps (can skip)
    if (currentStep === 4) {
      // Skip GA4
      selectGA4Property(null);
    } else if (currentStep === 5) {
      // Skip GSC
      selectGSCSite(null);
    } else if (currentStep === 6) {
      // Skip GBP
      selectGBPLocations([]);
    }

    // Move to next step
    nextStep();
  }, [
    currentStep,
    nextStep,
    selectGA4Property,
    selectGSCSite,
    selectGBPLocations,
  ]);

  /**
   * Complete onboarding and save selections
   */
  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Build selections with profile info
      const finalSelections: PropertySelections = {
        profile: {
          firstName,
          lastName,
          practiceName,
          domainName,
        },
        ga4: selections.ga4,
        gsc: selections.gsc,
        gbp: selections.gbp,
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
  }, [firstName, lastName, practiceName, domainName, selections]);

  /**
   * Reset onboarding state
   */
  const resetOnboarding = useCallback(() => {
    setCurrentStep(1);
    setFirstName("");
    setLastName("");
    setPracticeName("");
    setDomainName("");
    setSelections({
      profile: {
        firstName: "",
        lastName: "",
        practiceName: "",
        domainName: "",
      },
      ga4: null,
      gsc: null,
      gbp: [],
    });
    setError(null);
    console.log("[Onboarding] Reset");
  }, []);

  return {
    currentStep,
    totalSteps,
    availableProperties,
    selections,
    isLoading,
    error,

    // Profile state
    firstName,
    lastName,
    practiceName,
    domainName,
    setFirstName,
    setLastName,
    setPracticeName,
    setDomainName,

    fetchAvailableProperties,
    selectGA4Property,
    selectGSCSite,
    selectGBPLocations,
    nextStep,
    previousStep,
    skipStep,
    completeOnboarding,
    resetOnboarding,
  };
};
