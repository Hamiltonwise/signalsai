import React, { useState } from 'react';
import { Users, TrendingUp, Brain, Lightbulb, Target, Calendar, DollarSign, BarChart3 } from 'lucide-react';

interface ReferralSource {
  id: string;
  name: string;
  referrals: number;
  percentage: number;
  production: number;
  color: string;
  trend: number;
}

interface MonthlyData {
  month: string;
  selfReferrals: number;
  doctorReferrals: number;
  total: number;
}

export const PatientGrowthChart: React.FC = () => {
  const [viewMode, setViewMode] = useState<'annual' | 'monthly'>('annual');
  
  const monthlyData: MonthlyData[] = [
    { month: 'Jan', selfReferrals: 25, doctorReferrals: 35, total: 150 },
    { month: 'Feb', selfReferrals: 40, doctorReferrals: 55, total: 160 },
    { month: 'Mar', selfReferrals: 40, doctorReferrals: 40, total: 150 },
    { month: 'Apr', selfReferrals: 40, doctorReferrals: 20, total: 150 },
    { month: 'May', selfReferrals: 30, doctorReferrals: 30, total: 150 },
    { month: 'Jun', selfReferrals: 40, doctorReferrals: 20, total: 150 },
    { month: 'Jul', selfReferrals: 35, doctorReferrals: 35, total: 100 },
    { month: 'Aug', selfReferrals: 45, doctorReferrals: 42, total: 165 }
  ];

  const referralSources: ReferralSource[] = [
    {
      id: 'website',
      name: 'Website',
      referrals: 135,
      percentage: 13.5,
      production: 125543.50,
      color: 'bg-gradient-to-r from-purple-500 to-indigo-600',
      trend: 8
    },
    {
      id: 'google',
      name: 'Google Search',
      referrals: 130,
      percentage: 13.0,
      production: 91471.50,
      color: 'bg-gradient-to-r from-blue-500 to-cyan-600',
      trend: 15
    },
    {
      id: 'friend',
      name: 'Friend Referral',
      referrals: 125,
      percentage: 12.5,
      production: 103923.00,
      color: 'bg-gradient-to-r from-green-500 to-emerald-600',
      trend: -3
    },
    {
      id: 'facebook',
      name: 'Facebook Ad',
      referrals: 120,
      percentage: 12.0,
      production: 89709.00,
      color: 'bg-gradient-to-r from-pink-500 to-rose-600',
      trend: 22
    },
    {
      id: 'social',
      name: 'Social Media',
      referrals: 105,
      percentage: 10.5,
      production: 78853.50,
      color: 'bg-gradient-to-r from-orange-500 to-red-600',
      trend: 5
    },
    {
      id: 'doctor',
      name: 'Dr. Emily White',
      referrals: 100,
      percentage: 10.0,
      production: 78505.50,
      color: 'bg-gradient-to-r from-teal-500 to-cyan-600',
      trend: -8
    }
  ];

  const totalReferrals = referralSources.reduce((sum, source) => sum + source.referrals, 0);
  const totalProduction = referralSources.reduce((sum, source) => sum + source.production, 0);
  const currentMonth = monthlyData[monthlyData.length - 1];

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-3 h-3 text-emerald-500" />;
    if (trend < 0) return <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />;
    return <div className="w-3 h-3 bg-gray-300 rounded-full" />;
  };

  const getBarWidth = (value: number, max: number) => {
    return Math.max((value / max) * 100, 8); // Minimum 8% width for visibility
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Practice Growth Trends</h2>
              <p className="text-gray-600">Monthly patient referral patterns and revenue insights</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('annual')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                viewMode === 'annual' 
                  ? 'bg-purple-100 text-purple-700 font-medium' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Annual
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                viewMode === 'monthly' 
                  ? 'bg-purple-100 text-purple-700 font-medium' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-700">Total Referrals</span>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-purple-500" />
                <span className="text-xs text-purple-600">YTD</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-purple-900">{totalReferrals}</span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-600">+12%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700">Total Production</span>
              <div className="flex items-center space-x-1">
                <DollarSign className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">Revenue</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-green-900">
                ${(totalProduction / 1000).toFixed(0)}K
              </span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-600">+18%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Avg per Referral</span>
              <div className="flex items-center space-x-1">
                <BarChart3 className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-blue-600">Value</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-blue-900">
                ${Math.round(totalProduction / totalReferrals)}
              </span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-600">+5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Referral Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Patient Referrals</h3>
              <div className="text-sm text-gray-500">
                Practice Management System • 2025
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200/50">
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl font-bold text-gray-900">{totalReferrals}</div>
                <div className="text-sm text-gray-600">Total Referral Events</div>
              </div>
              <div className="flex items-center space-x-2 mb-6">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-emerald-600">+1.8%</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-gray-600">Self-Referrals ({monthlyData.reduce((sum, m) => sum + m.selfReferrals, 0)})</span>
                  <div className="w-4 h-4 bg-green-500 rounded ml-4"></div>
                  <span className="text-gray-600">Doctor Referrals ({monthlyData.reduce((sum, m) => sum + m.doctorReferrals, 0)})</span>
                </div>
                
                {monthlyData.slice(-6).map((month) => (
                  <div key={month.month} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{month.month}</span>
                      <span className="text-gray-600">
                        Self: {month.selfReferrals} Dr: {month.doctorReferrals} Total: {month.total}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <div 
                        className="bg-blue-500 h-6 rounded-l flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${getBarWidth(month.selfReferrals, 60)}%` }}
                      >
                        {month.selfReferrals}
                      </div>
                      <div 
                        className="bg-green-500 h-6 rounded-r flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${getBarWidth(month.doctorReferrals, 60)}%` }}
                      >
                        {month.doctorReferrals}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">Current</span>
                    <span className="text-sm font-medium text-blue-900">Aug</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Referral Sources */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Top Referral Sources</h3>
              </div>
              <div className="text-sm text-gray-500">Current year performance</div>
            </div>
            
            <div className="space-y-3">
              {referralSources.map((source, index) => (
                <div key={source.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-700">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{source.name}</h4>
                        <p className="text-sm text-gray-600">{source.percentage}% of total referrals</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">{source.referrals}</div>
                      <div className="text-sm text-gray-500">referrals</div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${source.color}`}
                        style={{ width: `${(source.referrals / Math.max(...referralSources.map(s => s.referrals))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Production: <span className="font-semibold">${source.production.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(source.trend)}
                      <span className={`text-sm font-semibold ${source.trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {source.trend > 0 ? '+' : ''}{source.trend}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights Section */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200/60 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">AI Growth Insights</h3>
              <p className="text-gray-600">Data-driven recommendations for practice expansion</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/60 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Peak Opportunity</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Facebook Ads show 22% growth this month. Consider increasing ad spend by 30% to capture 
                    an estimated 25 additional high-value patients.
                  </p>
                  <div className="text-xs text-emerald-600 font-medium">
                    Projected ROI: +$18,500 monthly revenue
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/60 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-md">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Action Required</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Dr. Emily White referrals dropped 8%. Schedule a lunch meeting to discuss 
                    new referral incentives and strengthen the partnership.
                  </p>
                  <div className="text-xs text-orange-600 font-medium">
                    Risk: -$12,000 potential monthly loss
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Next Analysis:</span> Weekly trends update in 3 days
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold">
                Add to HW Team Tasks
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold">
                Add to My Team Tasks
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};