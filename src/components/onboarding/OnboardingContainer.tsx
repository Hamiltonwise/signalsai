import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "../../hooks/useOnboarding";
import { ProgressIndicator } from "./ProgressIndicator";
import { Step0UserInfo } from "./Step0_UserInfo";
import { Step1PracticeInfo } from "./Step1_PracticeInfo";
import { Step2DomainInfo } from "./Step2_DomainInfo";
import { Loader2 } from "lucide-react";

interface OnboardingContainerProps {
  onComplete?: () => void;
}

export const OnboardingContainer: React.FC<OnboardingContainerProps> = ({
  onComplete,
}) => {
  const {
    currentStep,
    totalSteps,
    error,
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
    nextStep,
    previousStep,
    completeOnboarding,
  } = useOnboarding();

  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);

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

  // Fade animation variants (cleaner, content appears with card)
  const fadeVariants = {
    enter: {
      opacity: 0,
      y: 10,
    },
    center: {
      opacity: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      y: -10,
    },
  };

  const handleNextStep = () => {
    nextStep();
  };

  const handlePreviousStep = () => {
    previousStep();
  };

  // Show "Preparing your dashboard" after completion
  if (isCompletingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] font-body relative overflow-hidden"
        style={{
          background: "radial-gradient(ellipse at top, rgba(214, 104, 83, 0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(214, 104, 83, 0.05) 0%, transparent 40%), #F3F4F6"
        }}
      >
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
                className="w-full h-full rounded-2xl bg-gradient-to-br from-alloro-orange to-[#c45a47] flex items-center justify-center shadow-lg shadow-alloro-orange/30"
              >
                <Loader2 className="w-10 h-10 text-white" />
              </motion.div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-heading text-alloro-navy tracking-tight">
              Preparing your dashboard...
            </h1>
            <p className="text-slate-500">This will only take a moment</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 font-body relative overflow-hidden"
        style={{
          background: "radial-gradient(ellipse at top, rgba(214, 104, 83, 0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(214, 104, 83, 0.05) 0%, transparent 40%), #F3F4F6"
        }}
      >
        <div className="max-w-md w-full p-8 rounded-2xl bg-white/80 backdrop-blur-sm border border-alloro-orange/10 shadow-[0_8px_32px_rgba(214,104,83,0.12)]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center">
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
            <h2 className="text-alloro-navy text-xl font-bold font-heading">
              Oops! Something went wrong
            </h2>
            <p className="text-slate-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-alloro-orange to-[#c45a47] text-white font-semibold hover:shadow-lg hover:shadow-alloro-orange/30 hover:-translate-y-0.5 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] p-4 flex items-center justify-center font-body relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at top, rgba(214, 104, 83, 0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(214, 104, 83, 0.05) 0%, transparent 40%), #F3F4F6"
      }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-alloro-orange/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-alloro-orange/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="max-w-xl w-full relative z-10">
        {/* Main Card */}
        <div className="p-8 rounded-2xl bg-white/80 backdrop-blur-sm border border-alloro-orange/10 shadow-[0_8px_32px_rgba(214,104,83,0.12)]">
          {/* Progress Indicator */}
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
          />

          {/* Steps Container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={fadeVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.25,
                ease: "easeOut",
              }}
            >
              {/* Profile Steps (1-3) */}
              {currentStep === 1 && (
                <Step0UserInfo
                  firstName={firstName}
                  lastName={lastName}
                  businessPhone={businessPhone}
                  onFirstNameChange={setFirstName}
                  onLastNameChange={setLastName}
                  onBusinessPhoneChange={setBusinessPhone}
                  onNext={handleNextStep}
                />
              )}

              {currentStep === 2 && (
                <Step1PracticeInfo
                  practiceName={practiceName}
                  street={street}
                  city={city}
                  state={state}
                  zip={zip}
                  onPracticeNameChange={setPracticeName}
                  onStreetChange={setStreet}
                  onCityChange={setCity}
                  onStateChange={setState}
                  onZipChange={setZip}
                  onNext={handleNextStep}
                  onBack={handlePreviousStep}
                />
              )}

              {currentStep === 3 && (
                <Step2DomainInfo
                  domainName={domainName}
                  onDomainNameChange={setDomainName}
                  onNext={handleComplete}
                  onBack={handlePreviousStep}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-slate-500 text-sm">
            Need help? Contact us at{" "}
            <a
              href="mailto:info@getalloro.com"
              className="text-alloro-orange hover:underline font-medium"
            >
              info@getalloro.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
