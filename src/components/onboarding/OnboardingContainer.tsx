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
    practiceName,
    domainName,
    setFirstName,
    setLastName,
    setPracticeName,
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

  // Show "Preparing your dashboard" after completion
  if (isCompletingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-alloro-bg font-body">
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
                className="w-full h-full rounded-2xl bg-alloro-cobalt flex items-center justify-center shadow-lg shadow-blue-900/20"
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
      <div className="min-h-[60vh] flex items-center justify-center bg-alloro-bg p-4 font-body">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
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
              className="px-6 py-3 rounded-xl bg-alloro-cobalt text-white font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-alloro-bg p-4 flex items-center justify-center font-body">
      <div className="max-w-xl w-full">
        {/* Main Card */}
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
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
              className="text-alloro-cobalt hover:underline font-medium"
            >
              info@getalloro.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
