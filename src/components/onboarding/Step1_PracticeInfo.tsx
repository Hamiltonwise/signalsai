import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronDown, Check } from "lucide-react";

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District of Columbia" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

interface Step1PracticeInfoProps {
  practiceName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  onPracticeNameChange: (value: string) => void;
  onStreetChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onZipChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step1PracticeInfo: React.FC<Step1PracticeInfoProps> = ({
  practiceName,
  street,
  city,
  state,
  zip,
  onPracticeNameChange,
  onStreetChange,
  onCityChange,
  onStateChange,
  onZipChange,
  onNext,
  onBack,
}) => {
  const [errors, setErrors] = useState<{
    practiceName?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  }>({});

  // State selector dropdown
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const stateRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter states by search (matches both code and full name)
  const filteredStates = US_STATES.filter(
    (s) =>
      s.label.toLowerCase().includes(stateSearch.toLowerCase()) ||
      s.value.toLowerCase().includes(stateSearch.toLowerCase())
  );

  // Get display name for selected state
  const selectedStateLabel = US_STATES.find((s) => s.value === state)?.label || "";

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (stateRef.current && !stateRef.current.contains(e.target as Node)) {
        setStateDropdownOpen(false);
        setStateSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlighted index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [stateSearch]);

  const handleStateSelect = (stateValue: string) => {
    onStateChange(stateValue);
    setStateDropdownOpen(false);
    setStateSearch("");
    if (errors.state) setErrors({ ...errors, state: undefined });
  };

  const handleStateKeyDown = (e: React.KeyboardEvent) => {
    if (!stateDropdownOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setStateDropdownOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredStates.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredStates[highlightedIndex]) {
          handleStateSelect(filteredStates[highlightedIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setStateDropdownOpen(false);
        setStateSearch("");
        break;
    }
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!practiceName.trim()) {
      newErrors.practiceName = "Practice name is required";
    }
    if (!street.trim()) {
      newErrors.street = "Street address is required";
    }
    if (!city.trim()) {
      newErrors.city = "City is required";
    }
    if (!state) {
      newErrors.state = "State is required";
    }
    if (!zip.trim()) {
      newErrors.zip = "Zip code is required";
    } else if (!/^\d{5}(-\d{4})?$/.test(zip.trim())) {
      newErrors.zip = "Invalid zip code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const isFormValid = () => {
    return (
      practiceName.trim() &&
      street.trim() &&
      city.trim() &&
      state &&
      /^\d{5}(-\d{4})?$/.test(zip.trim())
    );
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
      <div className="space-y-6">
        {/* Practice Name */}
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
              if (errors.practiceName) setErrors({ ...errors, practiceName: undefined });
            }}
            placeholder="e.g., Best Dental Practice"
            className={`w-full px-4 py-3 rounded-xl bg-white border ${
              errors.practiceName ? "border-red-400" : "border-slate-300"
            } text-alloro-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-alloro-orange/20 focus:border-alloro-orange transition-all`}
          />
          {errors.practiceName && <p className="mt-1 text-sm text-red-600">{errors.practiceName}</p>}
        </div>

        {/* Primary Location Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-alloro-navy">Primary Location</h3>
            <p className="text-xs text-slate-500 mt-1">
              If you have multiple locations, enter your primary location's address
            </p>
          </div>

          {/* Street Address */}
          <div>
            <label
              htmlFor="street"
              className="block text-sm font-medium text-alloro-navy mb-2"
            >
              Street Address
            </label>
            <input
              id="street"
              type="text"
              value={street}
              onChange={(e) => {
                onStreetChange(e.target.value);
                if (errors.street) setErrors({ ...errors, street: undefined });
              }}
              placeholder="123 Main Street"
              className={`w-full px-4 py-3 rounded-xl bg-white border ${
                errors.street ? "border-red-400" : "border-slate-300"
              } text-alloro-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-alloro-orange/20 focus:border-alloro-orange transition-all`}
            />
            {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
          </div>

          {/* City, State, Zip Row */}
          <div className="grid grid-cols-12 gap-3">
            {/* City */}
            <div className="col-span-5">
              <label
                htmlFor="city"
                className="block text-sm font-medium text-alloro-navy mb-2"
              >
                City
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => {
                  onCityChange(e.target.value);
                  if (errors.city) setErrors({ ...errors, city: undefined });
                }}
                placeholder="City"
                className={`w-full px-4 py-3 rounded-xl bg-white border ${
                  errors.city ? "border-red-400" : "border-slate-300"
                } text-alloro-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-alloro-orange/20 focus:border-alloro-orange transition-colors`}
              />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
            </div>

            {/* State - Searchable Select */}
            <div className="col-span-5" ref={stateRef}>
              <label
                htmlFor="state"
                className="block text-sm font-medium text-alloro-navy mb-2"
              >
                State
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  id="state"
                  type="text"
                  value={stateDropdownOpen ? stateSearch : selectedStateLabel}
                  onChange={(e) => {
                    setStateSearch(e.target.value);
                    if (!stateDropdownOpen) setStateDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setStateDropdownOpen(true);
                    setStateSearch("");
                  }}
                  onKeyDown={handleStateKeyDown}
                  placeholder="Select state"
                  className={`w-full px-4 py-3 pr-10 rounded-xl bg-white border ${
                    errors.state ? "border-red-400" : "border-slate-300"
                  } text-alloro-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-alloro-orange/20 focus:border-alloro-orange transition-colors cursor-text`}
                  autoComplete="off"
                />
                <ChevronDown
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none transition-transform ${
                    stateDropdownOpen ? "rotate-180" : ""
                  }`}
                />

                {/* Dropdown */}
                {stateDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredStates.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-500">
                        No states found
                      </div>
                    ) : (
                      filteredStates.map((s, index) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => handleStateSelect(s.value)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
                            index === highlightedIndex
                              ? "bg-alloro-orange/10 text-alloro-navy"
                              : "text-alloro-navy hover:bg-slate-50"
                          } ${index === 0 ? "rounded-t-xl" : ""} ${
                            index === filteredStates.length - 1 ? "rounded-b-xl" : ""
                          }`}
                        >
                          <span>
                            {s.label}{" "}
                            <span className="text-slate-400">({s.value})</span>
                          </span>
                          {state === s.value && (
                            <Check className="w-4 h-4 text-alloro-orange" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
            </div>

            {/* Zip */}
            <div className="col-span-2">
              <label
                htmlFor="zip"
                className="block text-sm font-medium text-alloro-navy mb-2"
              >
                Zip
              </label>
              <input
                id="zip"
                type="text"
                value={zip}
                onChange={(e) => {
                  onZipChange(e.target.value);
                  if (errors.zip) setErrors({ ...errors, zip: undefined });
                }}
                placeholder="12345"
                maxLength={10}
                className={`w-full px-4 py-3 rounded-xl bg-white border ${
                  errors.zip ? "border-red-400" : "border-slate-300"
                } text-alloro-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-alloro-orange/20 focus:border-alloro-orange transition-colors`}
              />
              {errors.zip && <p className="mt-1 text-sm text-red-600">{errors.zip}</p>}
            </div>
          </div>
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
          disabled={!isFormValid()}
          className={`
            flex-1 px-6 py-3 rounded-xl font-semibold transition-all
            ${
              isFormValid()
                ? "bg-gradient-to-r from-alloro-orange to-[#c45a47] text-white hover:shadow-lg hover:shadow-alloro-orange/30 hover:-translate-y-0.5"
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
