import React, { useState } from 'react';
import { Eye, X } from 'lucide-react';
import { OnboardingModal } from './OnboardingModal';
import '../styles/tokens.css';

export const PreviewRibbon: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const handleModalOpen = () => {
    setShowModal(true);
  };

  const handleFullPageOpen = () => {
    window.location.href = '/onboarding/gbp';
  };

  return (
    <>
      {/* Dev Preview Ribbon */}
      <div className="bg-gray-800 text-gray-300 px-4 py-2 text-xs border-b border-gray-700 font-jakarta">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-3 h-3" />
            <span className="font-medium">Preview:</span>
          </div>
          <button
            onClick={handleModalOpen}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors font-jakarta"
          >
            Onboarding (modal)
          </button>
          <button
            onClick={handleFullPageOpen}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors font-jakarta"
          >
            Onboarding (full page)
          </button>
          <a
            href="/vital-signs-demo"
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors font-jakarta no-underline"
          >
            Vital Signs Demo
          </a>
          <a
            href="/vitals-reference"
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors font-jakarta no-underline"
          >
            Vitals Reference (iframe)
          </a>
          <a
            href="/onboarding-reference"
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors font-jakarta no-underline"
          >
            Onboarding Reference
          </a>
          <a
            href="/vital-signs-hero"
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors font-jakarta no-underline"
          >
            Vital Signs Hero
          </a>
          <a
            href="/gbp-card"
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors font-jakarta no-underline"
          >
            GBP Card
          </a>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <OnboardingModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
};