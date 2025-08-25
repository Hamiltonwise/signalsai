import React from 'react';
import { Brain, Lightbulb } from 'lucide-react';

export const AIInsightsCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Brain className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
      </div>
      
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Peak Opportunity Detected</h4>
              <p className="text-sm text-gray-700">
                Your website traffic from mobile devices increased 23% this week. 
                Consider optimizing your appointment booking form for mobile to capture more leads.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-4 h-4 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Great Progress!</h4>
              <p className="text-sm text-gray-700">
                You've maintained a 4.9-star average rating for 3 months. 
                Patients consistently mention your friendly staff and clean facilities.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-4 h-4 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Action Recommended</h4>
              <p className="text-sm text-gray-700">
                Your Google Business Profile hasn't been updated in 2 weeks. 
                Fresh posts can improve local search visibility by up to 15%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};