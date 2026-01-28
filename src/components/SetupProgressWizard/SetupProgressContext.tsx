import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { apiGet } from "../../api";
import { fetchPmsKeyData, type PmsKeyDataResponse } from "../../api/pms";
import { fireConfetti } from "../../lib/confetti";

interface SetupProgress {
  step1_api_connected: boolean; // All 3 scopes granted AND all 3 services connected
  step2_pms_uploaded: boolean; // At least 1 PMS data uploaded
  step2_pms_uploaded_at: string | null; // ISO timestamp of first PMS upload
  step3_insights_ready: boolean; // 24 hours have passed since PMS upload
  dismissed: boolean; // User manually dismissed (still show icon)
  completed: boolean; // All steps done (hide entirely)
}

interface SetupProgressContextType {
  progress: SetupProgress;
  isLoading: boolean;
  refreshProgress: () => Promise<void>;
  markStep1Complete: () => void;
  markStep1Incomplete: () => void;
  markStep2Complete: () => void;
  dismissWizard: () => void;
  resetWizard: () => void;
  justCompletedStep: number | null; // Track which step was just completed for confetti
  clearJustCompleted: () => void;
}

const STORAGE_KEY = "alloro_setup_progress";

const defaultProgress: SetupProgress = {
  step1_api_connected: false,
  step2_pms_uploaded: false,
  step2_pms_uploaded_at: null,
  step3_insights_ready: false,
  dismissed: false,
  completed: false,
};

const SetupProgressContext = createContext<SetupProgressContextType | null>(
  null,
);

function getStoredProgress(): SetupProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultProgress, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  return defaultProgress;
}

function saveProgress(progress: SetupProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage errors
  }
}

export function SetupProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<SetupProgress>(getStoredProgress);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [justCompletedStep, setJustCompletedStep] = useState<number | null>(
    null,
  );

  const clearJustCompleted = useCallback(() => {
    setJustCompletedStep(null);
  }, []);

  // Check if 24 hours have passed since PMS upload
  const checkStep3Completion = useCallback((uploadedAt: string | null) => {
    if (!uploadedAt) return false;
    const uploadTime = new Date(uploadedAt).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return now - uploadTime >= twentyFourHours;
  }, []);

  // Refresh progress by checking actual API state
  const refreshProgress = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setIsLoading(true);
      }

      try {
        // Fetch all data in parallel for faster response
        const [propertiesResponse, scopesResponse, pmsResponse] =
          await Promise.all([
            apiGet({ path: "/settings/properties" }),
            apiGet({ path: "/settings/scopes" }),
            fetchPmsKeyData().catch(() => ({ success: false })),
          ]);

        // Check connection status (Step 1)
        let allConnected = false;
        let allScopesGranted = false;

        if (propertiesResponse.success) {
          const props = propertiesResponse.properties;
          allConnected =
            !!props?.ga4 && !!props?.gsc && props?.gbp && props.gbp.length > 0;
        }

        if (scopesResponse.success) {
          const scopes = scopesResponse.scopes;
          allScopesGranted =
            scopes?.ga4?.granted &&
            scopes?.gsc?.granted &&
            scopes?.gbp?.granted;
        }

        const step1Complete = allConnected && allScopesGranted;

        // Check PMS data status (Step 2) - verify from API
        const storedProgress = getStoredProgress();
        let step2Complete = false;
        let uploadedAt = storedProgress.step2_pms_uploaded_at;

        // Type guard to check if pmsResponse has data property (full PmsKeyDataResponse)
        const hasPmsData = (
          response: PmsKeyDataResponse | { success: boolean },
        ): response is PmsKeyDataResponse => {
          return "data" in response && response.data !== undefined;
        };

        if (
          pmsResponse.success &&
          hasPmsData(pmsResponse) &&
          pmsResponse.data &&
          pmsResponse.data.stats &&
          pmsResponse.data.stats.jobCount > 0
        ) {
          step2Complete = true;
          // Use earliest job timestamp if we don't have one stored
          if (!uploadedAt && pmsResponse.data.stats.earliestJobTimestamp) {
            uploadedAt = pmsResponse.data.stats.earliestJobTimestamp;
          }
        } else if (!pmsResponse.success) {
          // Fall back to stored value if API fails
          step2Complete = storedProgress.step2_pms_uploaded;
        }

        // Check Step 3 (24 hours since upload)
        const step3Complete = step2Complete && checkStep3Completion(uploadedAt);

        // Update progress
        const newProgress: SetupProgress = {
          step1_api_connected: step1Complete,
          step2_pms_uploaded: step2Complete,
          step2_pms_uploaded_at: uploadedAt,
          step3_insights_ready: step3Complete,
          dismissed: storedProgress.dismissed,
          completed: step1Complete && step2Complete && step3Complete,
        };

        // Check if a step was just completed (trigger confetti)
        // Only check for transitions after initial load to avoid false positives
        setProgress((prev) => {
          if (!isInitialLoad) {
            if (!prev.step1_api_connected && step1Complete) {
              setJustCompletedStep(1);
            } else if (!prev.step2_pms_uploaded && step2Complete) {
              setJustCompletedStep(2);
            } else if (!prev.step3_insights_ready && step3Complete) {
              setJustCompletedStep(3);
            }
          }
          return newProgress;
        });

        saveProgress(newProgress);
      } catch (err) {
        console.error("Failed to refresh setup progress:", err);
      } finally {
        if (isInitialLoad) {
          setIsLoading(false);
          setIsInitialLoad(false);
        }
      }
    },
    [checkStep3Completion, isInitialLoad],
  );

  // Mark step 1 as complete (with confetti)
  const markStep1Complete = useCallback(() => {
    setProgress((prev) => {
      // Only trigger confetti if this is a new completion
      if (!prev.step1_api_connected) {
        setJustCompletedStep(1);
      }
      const updated = { ...prev, step1_api_connected: true };
      saveProgress(updated);
      return updated;
    });
  }, []);

  // Mark step 1 as incomplete (when a service is disconnected)
  const markStep1Incomplete = useCallback(() => {
    setProgress((prev) => {
      const updated = { ...prev, step1_api_connected: false, completed: false };
      saveProgress(updated);
      return updated;
    });
  }, []);

  // Mark step 2 as complete (with timestamp)
  const markStep2Complete = useCallback(() => {
    setProgress((prev) => {
      // Only trigger confetti if this is a new completion
      if (!prev.step2_pms_uploaded) {
        setJustCompletedStep(2);
      }
      const now = new Date().toISOString();
      const updated = {
        ...prev,
        step2_pms_uploaded: true,
        step2_pms_uploaded_at: prev.step2_pms_uploaded_at || now,
      };
      saveProgress(updated);
      return updated;
    });
  }, []);

  // Dismiss wizard (hide panel but keep icon)
  const dismissWizard = useCallback(() => {
    setProgress((prev) => {
      const updated = { ...prev, dismissed: true };
      saveProgress(updated);
      return updated;
    });
  }, []);

  // Reset wizard (for testing/debugging)
  const resetWizard = useCallback(() => {
    setProgress(defaultProgress);
    saveProgress(defaultProgress);
  }, []);

  // Initial load and listen for PMS upload events
  useEffect(() => {
    refreshProgress();

    // Listen for PMS upload events - immediately mark step 2 complete for instant feedback
    const handlePmsUpload = () => {
      markStep2Complete();
    };

    window.addEventListener("pms:job-uploaded", handlePmsUpload);
    return () => {
      window.removeEventListener("pms:job-uploaded", handlePmsUpload);
    };
  }, [refreshProgress, markStep2Complete]);

  // Periodically check if step 3 is complete (every minute)
  useEffect(() => {
    if (progress.step2_pms_uploaded && !progress.step3_insights_ready) {
      const interval = setInterval(() => {
        const isReady = checkStep3Completion(progress.step2_pms_uploaded_at);
        if (isReady) {
          setProgress((prev) => {
            const updated = {
              ...prev,
              step3_insights_ready: true,
              completed:
                prev.step1_api_connected && prev.step2_pms_uploaded && true,
            };
            saveProgress(updated);
            return updated;
          });
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [
    progress.step2_pms_uploaded,
    progress.step2_pms_uploaded_at,
    progress.step3_insights_ready,
    checkStep3Completion,
  ]);

  // Poll for connection updates every 5 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      refreshProgress();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [refreshProgress]);

  // Fire confetti when a step is completed (handled here so it works even if wizard UI is hidden)
  useEffect(() => {
    if (justCompletedStep) {
      // Check if mobile (< 768px) for confetti position
      const isMobile = window.innerWidth < 768;
      // Mobile: bottom-right, Desktop: top-right
      const confettiPosition = isMobile
        ? { x: 0.92, y: 0.92 }
        : { x: 0.92, y: 0.08 };
      fireConfetti(confettiPosition);
    }
  }, [justCompletedStep]);

  return (
    <SetupProgressContext.Provider
      value={{
        progress,
        isLoading,
        refreshProgress,
        markStep1Complete,
        markStep1Incomplete,
        markStep2Complete,
        dismissWizard,
        resetWizard,
        justCompletedStep,
        clearJustCompleted,
      }}
    >
      {children}
    </SetupProgressContext.Provider>
  );
}

export function useSetupProgress(): SetupProgressContextType {
  const context = useContext(SetupProgressContext);
  if (!context) {
    throw new Error(
      "useSetupProgress must be used within a SetupProgressProvider",
    );
  }
  return context;
}

// Safe hook that returns null if outside provider (for components that may render outside the provider)
export function useSetupProgressSafe(): SetupProgressContextType | null {
  return useContext(SetupProgressContext);
}
