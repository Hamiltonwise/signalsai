import { useState } from "react";
import type { GSCSite } from "../../types/onboarding";

interface Step2GSCSelectionProps {
  sites: GSCSite[];
  selectedSite: GSCSite | null;
  onSelect: (site: GSCSite | null) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const Step2GSCSelection: React.FC<Step2GSCSelectionProps> = ({
  sites,
  selectedSite,
  onSelect,
  onNext,
  onSkip,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSites = sites.filter((site) =>
    site.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasSites = sites.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-light text-gray-800 mb-2">
          Google Search Console
        </h2>
        <p className="text-gray-600 font-light">
          {hasSites
            ? "Select the GSC site you want to track"
            : "No GSC sites found"}
        </p>
      </div>

      {/* Content */}
      {hasSites ? (
        <>
          {/* Search Bar */}
          {sites.length > 3 && (
            <input
              type="text"
              placeholder="Search sites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/40 backdrop-blur-sm border border-white/50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#86b4ef] transition-all"
            />
          )}

          {/* Sites List */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredSites.map((site) => {
              const isSelected = selectedSite?.siteUrl === site.siteUrl;

              return (
                <button
                  key={site.siteUrl}
                  onClick={() => onSelect(site)}
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
                        {site.displayName}
                      </h3>
                      <p className="text-gray-600 text-sm font-mono break-all">
                        {site.siteUrl}
                      </p>
                      {site.permissionLevel && (
                        <p className="text-gray-500 text-xs mt-1">
                          Permission: {site.permissionLevel}
                        </p>
                      )}
                    </div>
                    <div
                      className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ml-3
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

          {filteredSites.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No sites match your search</p>
            </div>
          )}
        </>
      ) : (
        /* No Sites Available */
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <p className="text-gray-600 max-w-md mx-auto">
            We don't have any Google Search Console sites linked to your
            account. We'll help you integrate one later. Skip for now to
            continue.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg bg-white/30 backdrop-blur-sm border border-white/40 text-gray-700 hover:bg-white/40 transition-all font-medium"
        >
          ← Back
        </button>
        <button
          onClick={onSkip}
          className="flex-1 px-6 py-3 rounded-lg bg-white/30 backdrop-blur-sm border border-white/40 text-gray-700 hover:bg-white/40 transition-all font-medium"
        >
          Skip
        </button>
        <button
          onClick={onNext}
          disabled={!selectedSite && hasSites}
          className={`
            flex-1 px-6 py-3 rounded-lg font-semibold transition-all
            ${
              selectedSite || !hasSites
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
