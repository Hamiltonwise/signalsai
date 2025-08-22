import React, { useState } from 'react';
import { Upload as UploadIcon, FileText, Calendar, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

interface UploadHistory {
  id: string;
  filename: string;
  uploadDate: string;
  records: number;
  status: 'success' | 'processing' | 'error';
  fileType: string;
}

export const Upload: React.FC = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  
  const uploadHistory: UploadHistory[] = [
    {
      id: '1',
      filename: 'patient_data_december_2024.csv',
      uploadDate: '2024-01-10',
      records: 247,
      status: 'success',
      fileType: 'Patient Data'
    },
    {
      id: '2',
      filename: 'appointments_november_2024.csv',
      uploadDate: '2024-01-08',
      records: 156,
      status: 'success',
      fileType: 'Appointments'
    },
    {
      id: '3',
      filename: 'revenue_data_q4_2024.csv',
      uploadDate: '2024-01-05',
      records: 89,
      status: 'processing',
      fileType: 'Financial'
    }
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // Handle file drop logic here
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-orange-600 bg-orange-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Upload</h1>
        <p className="text-gray-600">Upload your practice management system data for insights</p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Practice Data</h2>
        
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isDragOver ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <UploadIcon className={`w-8 h-8 ${isDragOver ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Drag and drop your CSV files here
              </h3>
              <p className="text-gray-600 mb-4">
                or click to browse your files
              </p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Select Files
              </button>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Supported formats: CSV, Excel (.xlsx)</p>
              <p>Maximum file size: 10MB</p>
            </div>
          </div>
        </div>

        {/* Data Type Selection */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Select Data Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Patient Data', 'Appointments', 'Financial', 'Marketing'].map((type) => (
              <label key={type} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="dataType" className="mr-3" />
                <span className="text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Upload History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Upload History</h2>
          <p className="text-gray-600">Track your recent data uploads</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {uploadHistory.map((upload) => (
            <div key={upload.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                {getStatusIcon(upload.status)}
                <div>
                  <h3 className="font-medium text-gray-900">{upload.filename}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(upload.uploadDate).toLocaleDateString()}</span>
                    </div>
                    <span>•</span>
                    <span>{upload.records} records</span>
                    <span>•</span>
                    <span>{upload.fileType}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(upload.status)}`}>
                  {upload.status}
                </span>
                <button className="p-1 text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Processing Info */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Data Processing Information</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Your data is processed securely and never shared with third parties</li>
          <li>• Files are automatically deleted after processing (typically within 24 hours)</li>
          <li>• Processing time varies from 5-30 minutes depending on file size</li>
          <li>• You'll receive email notifications when processing is complete</li>
        </ul>
      </div>
    </div>
  );
};