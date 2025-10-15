interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
}) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div key={stepNumber} className="flex items-center gap-2">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-300 font-semibold text-sm
                ${
                  isCompleted
                    ? "bg-gradient-to-r from-[#6fa3eb] to-[#86b4ef] text-white"
                    : isActive
                    ? "bg-gradient-to-r from-[#5a8ed9] to-[#6fa3eb] text-white scale-110"
                    : "bg-white/20 backdrop-blur-sm text-gray-600 border-2 border-white/30"
                }
              `}
            >
              {isCompleted ? "✓" : stepNumber}
            </div>

            {stepNumber < totalSteps && (
              <div
                className={`
                  w-12 h-1 rounded-full transition-all duration-300
                  ${
                    isCompleted
                      ? "bg-gradient-to-r from-[#6fa3eb] to-[#86b4ef]"
                      : "bg-white/30"
                  }
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
