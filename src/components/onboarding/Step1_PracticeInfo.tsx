import { useState } from "react";
import { ChevronLeft } from "lucide-react";

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
        <h2 className="text-2xl font-bold font-heading text-alloro-navy mb-2 tracking-tight">
          Your Practice
        </h2>
        <p className="text-slate-500 text-sm">
          What's the name of your practice?
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="practiceName"
            className="block text-sm font-medium text-alloro-navy mb-2"
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
            className={`w-full px-4 py-3 rounded-xl bg-white border ${
              error ? "border-red-400" : "border-slate-300"
            } text-alloro-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-alloro-cobalt/20 focus:border-alloro-cobalt transition-all`}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition-all font-medium flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!practiceName.trim()}
          className={`
            flex-1 px-6 py-3 rounded-xl font-semibold transition-all
            ${
              practiceName.trim()
                ? "bg-alloro-cobalt text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }
          `}
        >
          Continue
        </button>
      </div>
    </div>
  );
};
