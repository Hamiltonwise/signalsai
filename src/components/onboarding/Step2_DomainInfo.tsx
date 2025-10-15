import { useState } from "react";

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
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Website</h2>
        <p className="text-gray-600">What's your practice's domain name?</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="domainName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Domain Name
          </label>
          <input
            id="domainName"
            type="text"
            value={domainName}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="bestdentalpractice.com"
            className={`w-full px-4 py-3 rounded-lg bg-white/40 backdrop-blur-sm border ${
              error ? "border-red-400" : "border-white/50"
            } text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#86b4ef] transition-all`}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-500">
              Enter your domain without "https://" or "www"
            </p>
            <p className="text-xs text-gray-400">
              Example: bestdentalpractice.com
            </p>
          </div>
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
          disabled={!domainName.trim()}
          className={`
            flex-1 px-6 py-3 rounded-lg font-semibold transition-all
            ${
              domainName.trim()
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
