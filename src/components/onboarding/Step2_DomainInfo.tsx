import { useState } from "react";
import { ChevronLeft, Rocket } from "lucide-react";

interface Step2DomainInfoProps {
  domainName: string;
  onDomainNameChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2DomainInfo: React.FC<Step2DomainInfoProps> = ({
  domainName,
  onDomainNameChange,
  onNext,
  onBack,
}) => {
  const [error, setError] = useState<string>();

  const sanitizeDomain = (input: string): string => {
    let cleaned = input.trim().toLowerCase();

    // Remove https:// or http://
    cleaned = cleaned.replace(/^https?:\/\//, "");

    // Remove www.
    cleaned = cleaned.replace(/^www\./, "");

    // Remove trailing slashes
    cleaned = cleaned.replace(/\/+$/, "");

    return cleaned;
  };

  const validate = () => {
    const sanitized = sanitizeDomain(domainName);

    if (!sanitized) {
      setError("Domain name is required");
      return false;
    }

    // Basic domain validation (allows subdomains)
    const domainRegex = /^[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
    if (!domainRegex.test(sanitized)) {
      setError("Please enter a valid domain name (e.g., example.com)");
      return false;
    }

    setError(undefined);
    return true;
  };

  const handleChange = (value: string) => {
    const sanitized = sanitizeDomain(value);
    onDomainNameChange(sanitized);
    if (error) setError(undefined);
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
          Your Website
        </h2>
        <p className="text-slate-500 text-sm">
          What's your practice's domain name?
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="domainName"
            className="block text-sm font-medium text-alloro-navy mb-2"
          >
            Domain Name
          </label>
          <input
            id="domainName"
            type="text"
            value={domainName}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="bestdentalpractice.com"
            className={`w-full px-4 py-3 rounded-xl bg-white border ${
              error ? "border-red-400" : "border-slate-300"
            } text-alloro-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-alloro-orange/20 focus:border-alloro-orange transition-all`}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          <div className="mt-2 space-y-1">
            <p className="text-sm text-slate-500">
              Enter your domain without "https://" or "www"
            </p>
            <p className="text-xs text-slate-400">
              Example: bestdentalpractice.com
            </p>
          </div>
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
          disabled={!domainName.trim()}
          className={`
            flex-1 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
            ${
              domainName.trim()
                ? "bg-alloro-orange text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }
          `}
        >
          <Rocket className="w-4 h-4" />
          Get Started
        </button>
      </div>
    </div>
  );
};
