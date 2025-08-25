import React, { useState, useEffect } from 'react';
import { Upload as UploadIcon, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { PMSUploadModal } from '../components/PMSUploadModal';
import { PMSDataReset } from '../components/PMSDataReset';
import { useClient } from '../contexts/ClientContext';

export default function Upload() {
  const { clientId } = useClient();
  const [showPMSUpload, setShowPMSUpload] = useState(false);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          Upload PMS Data
        </h1>
        <p className="text-gray-500 text-lg font-medium">
          Upload practice management system data to track patient referrals and revenue
        </p>
      </div>

      {/* PMS Data Reset Section */}
      <PMSDataReset 
        clientId={clientId}
        onResetComplete={() => {
          console.log('PMS data reset completed');
        }}
      />
      {/* Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* PMS Data Upload */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">PMS Data</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Upload monthly patient referral data and revenue information from your practice management system.
          </p>
          <button
            onClick={() => setShowPMSUpload(true)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <UploadIcon className="w-4 h-4" />
            Upload CSV
          </button>
        </div>

        {/* Coming Soon Cards */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 opacity-60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">Patient Reviews</h3>
          </div>
          <p className="text-gray-500 mb-4">
            Upload patient review data and feedback metrics.
          </p>
          <button
            disabled
            className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 opacity-60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">Marketing Data</h3>
          </div>
          <p className="text-gray-500 mb-4">
            Upload marketing campaign performance and ROI data.
          </p>
          <button
            disabled
            className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Upload Instructions</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>PMS Data Format:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>CSV file with columns: month, self_referred, dr_referred, revenue_amount</li>
                <li>Month format: YYYY-MM (e.g., 2024-01)</li>
                <li>Numbers should be integers (no commas or currency symbols)</li>
                <li>Download the template for the correct format</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* PMS Upload Modal */}
      <PMSUploadModal
        isOpen={showPMSUpload}
        onClose={() => setShowPMSUpload(false)}
        clientId={clientId}
        onSuccess={() => {
          setShowPMSUpload(false);
          // Could add a success notification here
        }}
      />
    </div>
  );
}