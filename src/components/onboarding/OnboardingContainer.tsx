import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "../../hooks/useOnboarding";
import { ProgressIndicator } from "./ProgressIndicator";
import { Step0UserInfo } from "./Step0_UserInfo";
import { Step1PracticeInfo } from "./Step1_PracticeInfo";
import { Step2DomainInfo } from "./Step2_DomainInfo";
import { Step1GA4Selection } from "./Step1_GA4Selection";
import { Step2GSCSelection } from "./Step2_GSCSelection";
import { Step3GBPSelection } from "./Step3_GBPSelection";
import { BootMessages } from "./BootMessages";

interface OnboardingContainerProps {
  onComplete?: () => void;
}

export const OnboardingContainer: React.FC<OnboardingContainerProps> = ({
  onComplete,
}) => {
  const {
    currentStep,
    totalSteps,
    availableProperties,
    selections,
    isLoading,
    error,
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
  } = useOnboarding();

  const [showBootMessages, setShowBootMessages] = useState(true);
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);

  // Fetch available properties immediately on mount during boot messages
  useEffect(() => {
    fetchAvailableProperties();
  }, [fetchAvailableProperties]);

  // Handle onboarding completion
  const handleComplete = async () => {
    setIsCompletingOnboarding(true);
    const success = await completeOnboarding();
    if (success) {
      // Show preparing message briefly before transitioning
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        } else {
          // Fallback: reload the page
          window.location.reload();
        }
      }, 2000); // Show "preparing dashboard" for 2 seconds
    } else {
      setIsCompletingOnboarding(false);
    }
  };

  // Slide animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  // Determine slide direction
  const [direction, setDirection] = useState(0);

  const handleNextStep = () => {
    setDirection(1);
    nextStep();
  };

  const handlePreviousStep = () => {
    setDirection(-1);
    previousStep();
  };

  const handleSkipStep = () => {
    setDirection(1);
    skipStep();
  };

  // Show "Preparing your dashboard" after completion
  if (isCompletingOnboarding) {
    return (
      <div className="flex items-center justify-center bg-gradient-to-br from-[#86b4ef] via-[#a8c9f1] to-[#c0d5f4]">
        <div className="text-center space-y-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="w-20 h-20 mx-auto">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-full h-full rounded-2xl bg-gradient-to-br from-[#86b4ef] to-[#6fa3eb] flex items-center justify-center shadow-2xl"
              >
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </motion.div>
            </div>
            <h1 className="text-4xl md:text-5xl font-thin text-gray-800">
              Alloro is preparing your dashboard
            </h1>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show boot messages while loading properties
  if (showBootMessages) {
    return (
      <BootMessages
        isLoadingComplete={!!availableProperties && !isLoading}
        onComplete={() => {
          setShowBootMessages(false);
        }}
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#86b4ef] via-[#a8c9f1] to-[#c0d5f4] p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white/30 backdrop-blur-lg border border-white/40">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-gray-800 text-xl font-bold">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#6fa3eb] to-[#86b4ef] text-white font-semibold hover:from-[#5a8ed9] hover:to-[#6fa3eb] transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-gradient-to-br from-[#86b4ef] via-[#a8c9f1] to-[#c0d5f4] p-4 flex items-center justify-center">
      <div className="max-w-3xl w-full max-h-[90vh]Alloro Pointing">
        {/* Main Card */}
        <div className="p-8 rounded-2xl bg-white/30 backdrop-blur-lg border border-white/40 shadow-2xl relative">
          {/* Alloro Pointing Down Mascot - Standing on Top Left of Card */}
          <div className="absolute -top-[115px] left-2 w-32 h-32 z-10">
            <img
              src="/alloro-pointing-down.png"
              alt="Alloro Pointing"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
          {/* Progress Indicator */}
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
          />

          {/* Steps Container */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              {/* Profile Steps (1-3) */}
              {currentStep === 1 && (
                <Step0UserInfo
                  firstName={firstName}
                  lastName={lastName}
                  onFirstNameChange={setFirstName}
                  onLastNameChange={setLastName}
                  onNext={handleNextStep}
                />
              )}

              {currentStep === 2 && (
                <Step1PracticeInfo
                  practiceName={practiceName}
                  onPracticeNameChange={setPracticeName}
                  onNext={handleNextStep}
                  onBack={handlePreviousStep}
                />
              )}

              {currentStep === 3 && (
                <Step2DomainInfo
                  domainName={domainName}
                  onDomainNameChange={setDomainName}
                  onNext={handleNextStep}
                  onBack={handlePreviousStep}
                />
              )}

              {/* Property Selection Steps (4-6) */}
              {currentStep === 4 && availableProperties && (
                <Step1GA4Selection
                  properties={availableProperties.ga4}
                  selectedProperty={
                    selections.ga4
                      ? {
                          propertyId: selections.ga4.propertyId,
                          displayName: selections.ga4.displayName,
                        }
                      : null
                  }
                  onSelect={(property) =>
                    selectGA4Property(
                      property
                        ? {
                            propertyId: property.propertyId,
                            displayName: property.displayName,
                          }
                        : null
                    )
                  }
                  onNext={handleNextStep}
                  onSkip={handleSkipStep}
                />
              )}

              {currentStep === 5 && availableProperties && (
                <Step2GSCSelection
                  sites={availableProperties.gsc}
                  selectedSite={
                    selections.gsc
                      ? {
                          siteUrl: selections.gsc.siteUrl,
                          displayName: selections.gsc.displayName,
                        }
                      : null
                  }
                  onSelect={(site) =>
                    selectGSCSite(
                      site
                        ? {
                            siteUrl: site.siteUrl,
                            displayName: site.displayName,
                          }
                        : null
                    )
                  }
                  onNext={handleNextStep}
                  onSkip={handleSkipStep}
                  onBack={handlePreviousStep}
                />
              )}

              {currentStep === 6 && availableProperties && (
                <Step3GBPSelection
                  locations={availableProperties.gbp}
                  selectedLocations={selections.gbp}
                  onSelect={(locations) => selectGBPLocations(locations)}
                  onComplete={handleComplete}
                  onSkip={handleComplete}
                  onBack={handlePreviousStep}
                  isLoading={isLoading}
                />
              )}

              {/* Loading state for property steps if properties haven't loaded yet */}
              {currentStep >= 4 && !availableProperties && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#86b4ef] mx-auto mb-4"></div>
                  <p className="text-gray-700">
                    Loading your Google properties...
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Need help? Contact support at support@signalsai.com
          </p>
        </div>
      </div>
    </div>
  );
};
