import { useState, useEffect, useRef } from "react";
import { ChevronLeft, Rocket, Loader2, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import onboarding from "../../api/onboarding";

interface Step2DomainInfoProps {
  domainName: string;
  onDomainNameChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

type DomainStatus = "idle" | "checking" | "valid" | "warning" | "unreachable";

export const Step2DomainInfo: React.FC<Step2DomainInfoProps> = ({
  domainName,
  onDomainNameChange,
  onNext,
  onBack,
}) => {
  const [error, setError] = useState<string>();
  const [domainStatus, setDomainStatus] = useState<DomainStatus>("idle");
  const [domainMessage, setDomainMessage] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const domainRegex = /^[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;

  // Debounced domain check
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const sanitized = sanitizeDomain(domainName);

    if (!sanitized || !domainRegex.test(sanitized)) {
      setDomainStatus("idle");
      setDomainMessage("");
      return;
    }

    setDomainStatus("checking");
    setDomainMessage("");

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await onboarding.checkDomain(sanitized);

        if (response.success) {
          setDomainStatus(response.status as DomainStatus);
          setDomainMessage(response.message);
        } else {
          setDomainStatus("idle");
          setDomainMessage("");
        }
      } catch {
        setDomainStatus("idle");
        setDomainMessage("");
      }
    }, 800);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [domainName]);

  const validate = () => {
    const sanitized = sanitizeDomain(domainName);

    if (!sanitized) {
      setError("Domain name is required");
      return false;
    }

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

  const renderDomainStatus = () => {
    switch (domainStatus) {
      case "checking":
        return (
          <div className="flex items-center gap-2 mt-2">
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            <span className="text-sm text-slate-500">Checking domain...</span>
          </div>
        );
      case "valid":
        return (
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">{domainMessage}</span>
          </div>
        );
      case "warning":
        return (
          <div className="flex items-center gap-2 mt-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-amber-600">{domainMessage}</span>
          </div>
        );
      case "unreachable":
        return (
          <div className="flex items-center gap-2 mt-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-500">{domainMessage}</span>
          </div>
        );
      default:
        return null;
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
          {!error && renderDomainStatus()}
          {!error && domainStatus === "idle" && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-slate-500">
                Enter your domain without "https://" or "www"
              </p>
              <p className="text-xs text-slate-400">
                Example: bestdentalpractice.com
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-alloro-orange/30 transition-all font-medium flex items-center gap-2"
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
                ? "bg-gradient-to-r from-alloro-orange to-[#c45a47] text-white hover:shadow-lg hover:shadow-alloro-orange/30 hover:-translate-y-0.5"
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
