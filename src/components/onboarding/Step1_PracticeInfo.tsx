import { useState } from "react";

interface Step1PracticeInfoProps {
  practiceName: string;
  onPracticeNameChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step1PracticeInfo: React.FC<Step1PracticeInfoProps> = ({
  practiceName,
  onPracticeNameChange,
  onNext,
  onBack,
}) => {
  const [error, setError] = useState<string>();

  const validate = () => {
    if (!practiceName.trim()) {
      setError("Practice name is required");
      return false;
    }
    setError(undefined);
    return true;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Practice</h2>
        <p className="text-gray-600">What's the name of your practice?</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="practiceName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Practice Name
          </label>
          <input
            id="practiceName"
            type="text"
            value={practiceName}
            onChange={(e) => {
              onPracticeNameChange(e.target.value);
              if (error) setError(undefined);
            }}
            placeholder="e.g., Best Dental Practice"
            className={`w-full px-4 py-3 rounded-lg bg-white/40 backdrop-blur-sm border ${
              error ? "border-red-400" : "border-white/50"
            } text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#86b4ef] transition-all`}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg bg-white/30 backdrop-blur-sm border border-white/40 text-gray-700 hover:bg-white/40 transition-all font-medium"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={!practiceName.trim()}
          className={`
            flex-1 px-6 py-3 rounded-lg font-semibold transition-all
            ${
              practiceName.trim()
                ? "bg-gradient-to-r from-[#6fa3eb] to-[#86b4ef] text-white hover:from-[#5a8ed9] hover:to-[#6fa3eb]"
                : "bg-white/20 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          Next →
        </button>
      </div>
    </div>
  );
};
