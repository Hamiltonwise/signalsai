import { useState, useCallback } from "react";
import onboarding from "../api/onboarding";
import type {
  AvailableProperties,
} from "../types/onboarding";

export const useOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; // User info (3 steps)

  // Profile state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [practiceName, setPracticeName] = useState("");
  const [domainName, setDomainName] = useState("");

  const [availableProperties, setAvailableProperties] =
    useState<AvailableProperties | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch available properties from API
   * Keeping this for now as it might be used for pre-fetching or checking status,
   * even if not used in the wizard steps directly anymore.
   * Or we can remove it if we don't show them at all.
   * The OnboardingContainer still calls it.
   */
  const fetchAvailableProperties = useCallback(async () => {
    // No-op for now as we don't need to fetch properties during onboarding
    // But keeping the function signature to avoid breaking changes if called
    // setAvailableProperties({ ga4: [], gsc: [], gbp: [] });
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
   * Complete onboarding and save selections
   */
  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Build selections with profile info
      const finalSelections = {
        profile: {
          firstName,
          lastName,
          practiceName,
          domainName,
        },
      };

      console.log("[Onboarding] Saving selections:", finalSelections);

      // We need to cast to any because the type definition might still expect property selections
      // pending type updates.
      const response = await onboarding.saveProperties(finalSelections as any);

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
  }, [firstName, lastName, practiceName, domainName]);

  /**
   * Reset onboarding state
   */
  const resetOnboarding = useCallback(() => {
    setCurrentStep(1);
    setFirstName("");
    setLastName("");
    setPracticeName("");
    setDomainName("");
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
    practiceName,
    domainName,
    setFirstName,
    setLastName,
    setPracticeName,
    setDomainName,

    fetchAvailableProperties,
    nextStep,
    previousStep,
    completeOnboarding,
    resetOnboarding,
  };
};
