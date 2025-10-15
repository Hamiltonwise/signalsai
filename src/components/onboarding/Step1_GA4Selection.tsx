import { useState } from "react";
import type { GA4Property } from "../../types/onboarding";

interface Step1GA4SelectionProps {
  properties: GA4Property[];
  selectedProperty: GA4Property | null;
  onSelect: (property: GA4Property | null) => void;
  onNext: () => void;
  onSkip: () => void;
}

export const Step1GA4Selection: React.FC<Step1GA4SelectionProps> = ({
  properties,
  selectedProperty,
  onSelect,
  onNext,
  onSkip,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProperties = properties.filter((prop) =>
    prop.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasProperties = properties.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-light text-gray-800 mb-2">
          Google Analytics 4
        </h2>
        <p className="text-gray-600 font-light">
          {hasProperties
            ? "Select the GA4 property you want to track"
            : "No GA4 properties found"}
        </p>
      </div>

      {/* Content */}
      {hasProperties ? (
        <>
          {/* Search Bar */}
          {properties.length > 3 && (
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/40 backdrop-blur-sm border border-white/50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#86b4ef] transition-all"
            />
          )}

          {/* Properties List */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredProperties.map((property) => {
              const isSelected =
                selectedProperty?.propertyId === property.propertyId;

              return (
                <button
                  key={property.propertyId}
                  onClick={() => onSelect(property)}
                  className={`
                    w-full p-4 rounded-lg text-left transition-all duration-300
                    backdrop-blur-sm border-2
                    ${
                      isSelected
                        ? "bg-gradient-to-r from-[#86b4ef]/30 to-[#6fa3eb]/30 border-[#86b4ef] scale-[1.02]"
                        : "bg-white/20 border-white/30 hover:bg-white/30 hover:border-white/40"
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-gray-800 font-semibold text-lg mb-1">
                        {property.displayName}
                      </h3>
                      <p className="text-gray-600 text-sm font-mono">
                        {property.propertyId}
                      </p>
                      {property.accountName && (
                        <p className="text-gray-500 text-xs mt-1">
                          Account: {property.accountName}
                        </p>
                      )}
                    </div>
                    <div
                      className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${
                          isSelected
                            ? "border-[#86b4ef] bg-[#86b4ef]"
                            : "border-gray-400"
                        }
                      `}
                    >
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredProperties.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No properties match your search</p>
            </div>
          )}
        </>
      ) : (
        /* No Properties Available */
        <div className="py-12 text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-gray-600 max-w-md mx-auto">
            We don't have any Google Analytics 4 properties linked to your
            account. We'll help you integrate one later. Skip for now to
            continue.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onSkip}
          className="flex-1 px-6 py-3 rounded-lg bg-white/30 backdrop-blur-sm border border-white/40 text-gray-700 hover:bg-white/40 transition-all font-medium"
        >
          Skip
        </button>
        <button
          onClick={onNext}
          disabled={!selectedProperty && hasProperties}
          className={`
            flex-1 px-6 py-3 rounded-lg font-semibold transition-all
            ${
              selectedProperty || !hasProperties
                ? "bg-gradient-to-r from-[#6fa3eb] to-[#86b4ef] text-white hover:from-[#5a8ed9] hover:to-[#6fa3eb]"
                : "bg-white/20 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          Next →
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(134, 180, 239, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(134, 180, 239, 0.7);
        }
      `}</style>
    </div>
  );
};
