import React from 'react';
import { Target, ArrowRight, CheckCircle } from 'lucide-react';

export const NextBestAction: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Target className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Next Best Action</h3>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-green-800">Priority Action</h4>
            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">High Impact</span>
          </div>
          <p className="text-sm text-green-700 mb-3">
            Ask 5 recent patients for online reviews this week
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-green-600">Estimated impact: +12% local visibility</span>
            <button className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 flex items-center space-x-1">
              <span>Start</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700">Upcoming Actions</h5>
          
          <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-sm text-gray-600 flex-1">Update Google Business hours for holiday season</span>
            <span className="text-xs text-gray-400">Tomorrow</span>
          </div>
          
          <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <span className="text-sm text-gray-600 flex-1">Post patient success story on social media</span>
            <span className="text-xs text-gray-400">This week</span>
          </div>
          
          <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600 flex-1 line-through">Respond to recent reviews</span>
            <span className="text-xs text-green-600">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
};