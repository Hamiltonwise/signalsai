import React, { useState } from 'react';
import { TrendingUp, Search, Globe, MapPin, MousePointer, Heart, ArrowRight, Lightbulb, Target, Zap, Brain, Activity, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';

// Helper functions - hoisted to avoid TDZ issues
function getGrade(score?: number): string {
  const s = Number.isFinite(score) ? score! : 0;
  if (s >= 97) return 'A+';
  if (s >= 93) return 'A';
  if (s >= 90) return 'A-';
  if (s >= 87) return 'B+';
  if (s >= 83) return 'B';
  if (s >= 80) return 'B-';
  if (s >= 77) return 'C+';
  if (s >= 73) return 'C';
  if (s >= 70) return 'C-';
  if (s >= 60) return 'D';
  return 'F';
}

function getScoreColor(score: number) {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 55) return 'text-orange-500';
  return 'text-red-500';
}

function getScoreGradient(score: number) {
  if (score >= 85) return 'bg-gradient-to-br from-emerald-500 to-green-600';
  if (score >= 70) return 'bg-gradient-to-br from-blue-500 to-indigo-600';
  if (score >= 55) return 'bg-gradient-to-br from-orange-500 to-red-500';
  return 'bg-gradient-to-br from-red-500 to-pink-600';
}

function getMetricStatusStyle(status: string) {
  switch (status) {
    case 'good':
      return 'text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50';
    case 'warning':
      return 'text-orange-700 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50';
    case 'critical':
      return 'text-red-700 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50';
    default:
      return 'text-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200/50';
  }
}

function getTrendIcon(trend: number) {
  return trend > 0 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
}

interface JourneyStage {
  name: string;
  icon: any;
  color: string;
  bgGradient: string;
  borderGradient: string;
  score: number;
  dataSource: string;
  insight: string;
  action: string;
  explainer: string;
  whyItMatters: string;
  metrics: Array<{ label: string; value: string; status: 'good' | 'warning' | 'critical' }>;
  trend: number;
}

interface VitalSignsCardProps {
  ga4Data?: any;
  gscData?: any;
  gbpData?: any;
  clarityData?: any;
  pmsData?: any;
  connectionStatus?: {
    ga4: boolean;
    gbp: boolean;
    gsc: boolean;
    clarity: boolean;
  };
  aiAnalysis?: any;
  isLoadingAI?: boolean;
}

export const VitalSignsCard: React.FC<VitalSignsCardProps> = ({
  ga4Data,
  gscData,
  gbpData,
  clarityData,
  pmsData,
  connectionStatus = { ga4: false, gbp: false, gsc: false, clarity: false },
  aiAnalysis,
  isLoadingAI = false
}) => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  
  // Calculate overall score from connected integrations or use AI analysis
  function calculateOverallScore() {
    // Use AI analysis score if available
    if (aiAnalysis?.overallScore) {
      return aiAnalysis.overallScore;
    }
    
    let totalScore = 0;
    let connectedCount = 0;
    
    if (connectionStatus.ga4 && ga4Data?.calculatedScore) {
      totalScore += ga4Data.calculatedScore;
      connectedCount++;
    }
    if (connectionStatus.gsc && gscData?.calculatedScore) {
      totalScore += gscData.calculatedScore;
      connectedCount++;
    }
    if (connectionStatus.gbp && gbpData?.calculatedScore) {
      totalScore += gbpData.calculatedScore;
      connectedCount++;
    }
    if (connectionStatus.clarity && clarityData?.calculatedScore) {
      totalScore += clarityData.calculatedScore;
      connectedCount++;
    }
    
    // If no connections, use demo score
    if (connectedCount === 0) return 78;
    
    return Math.round(totalScore / connectedCount);
  }

  const overallScore = calculateOverallScore();
  const overallTrend = aiAnalysis?.monthlyChange || 12;
  const overallGrade = aiAnalysis?.grade || getGrade(overallScore);
  
  const trend = aiAnalysis?.trend || 'stable';
  
  const journeyStages: JourneyStage[] = [
    {
      name: 'Awareness',
      icon: Search,
      color: 'text-purple-600',
      bgGradient: 'bg-gradient-to-br from-purple-50 via-purple-25 to-indigo-50',
      borderGradient: 'border-purple-200/60',
      score: aiAnalysis?.breakdown?.gscScore || (connectionStatus.gsc ? (gscData?.calculatedScore || 0) : 82),
      trend: connectionStatus.gsc ? parseFloat(gscData?.changePercent || '0') : 8,
      dataSource: 'Google Search Console + GA4',
      explainer: 'The first moment potential patients discover your practice exists',
      whyItMatters: 'Without visibility, even the best dental practice remains unknown. This stage determines your practice\'s discoverability when patients search for dental care in your area.',
      insight: connectionStatus.gsc 
        ? `Your practice has ${(gscData?.totalImpressions || 0).toLocaleString()} search impressions with ${(gscData?.totalClicks || 0).toLocaleString()} clicks. Average position: ${(gscData?.averagePosition || 0).toFixed(1)}.`
        : 'Your practice dominates local search with 73% visibility. Strong performance for "dentist near me" and "dental cleaning" keywords.',
      action: aiAnalysis?.priorityOpportunities?.find(op => op.category === 'search')?.title || 
              (connectionStatus.gsc && (gscData?.averagePosition || 0) > 5
                ? 'Improve keyword rankings - currently averaging position ' + (gscData?.averagePosition || 0).toFixed(1)
                : 'Target "emergency dentist" keywords - 340% higher conversion potential'),
      metrics: [
        { 
          label: 'Search Impressions', 
          value: connectionStatus.gsc ? (gscData?.totalImpressions || 0).toLocaleString() : '12.4K', 
          status: connectionStatus.gsc ? ((gscData?.totalImpressions || 0) > 1000 ? 'good' : 'warning') : 'good' 
        },
        { 
          label: 'Avg. Position', 
          value: connectionStatus.gsc ? (gscData?.averagePosition || 0).toFixed(1) : '3.2', 
          status: connectionStatus.gsc ? ((gscData?.averagePosition || 0) < 5 ? 'good' : 'warning') : 'good' 
        },
        { 
          label: 'Total Clicks', 
          value: connectionStatus.gsc ? (gscData?.totalClicks || 0).toLocaleString() : '347', 
          status: connectionStatus.gsc ? ((gscData?.totalClicks || 0) > 50 ? 'good' : 'warning') : 'good' 
        }
      ]
    },
    {
      name: 'Research',
      icon: Globe,
      color: 'text-blue-600',
      bgGradient: 'bg-gradient-to-br from-blue-50 via-cyan-25 to-sky-50',
      borderGradient: 'border-blue-200/60',
      score: aiAnalysis?.breakdown?.ga4Score || (connectionStatus.ga4 ? (ga4Data?.calculatedScore || 0) : 75),
      trend: connectionStatus.ga4 ? parseFloat(ga4Data?.changePercent || '0') : -3,
      dataSource: 'Website Analytics + Clarity',
      explainer: 'When patients explore your services and evaluate your expertise',
      whyItMatters: 'This is where trust begins. Patients research your credentials, services, and approach. A strong research experience builds confidence and moves patients toward booking.',
      insight: connectionStatus.ga4 
        ? `${(ga4Data?.totalUsers || 0).toLocaleString()} total users with ${(ga4Data?.engagementRate || 0).toFixed(1)}% engagement rate. ${ga4Data?.conversions || 0} conversions tracked.`
        : 'Visitors engage deeply with your content (2.3min avg). Top interests: whitening, implants, preventive care.',
      action: aiAnalysis?.priorityOpportunities?.find(op => op.category === 'website')?.title ||
              (connectionStatus.ga4 && (ga4Data?.engagementRate || 0) < 50
                ? 'Improve page engagement - currently at ' + (ga4Data?.engagementRate || 0).toFixed(1) + '%'
                : 'Add video testimonials to service pages - proven 40% engagement boost'),
      metrics: [
        { 
          label: 'Total Users', 
          value: connectionStatus.ga4 ? (ga4Data?.totalUsers || 0).toLocaleString() : '3.2K', 
          status: connectionStatus.ga4 ? ((ga4Data?.totalUsers || 0) > 1000 ? 'good' : 'warning') : 'good' 
        },
        { 
          label: 'Engagement Rate', 
          value: connectionStatus.ga4 ? `${(ga4Data?.engagementRate || 0).toFixed(1)}%` : '57.7%', 
          status: connectionStatus.ga4 ? ((ga4Data?.engagementRate || 0) > 50 ? 'good' : 'warning') : 'good' 
        },
        { 
          label: 'Conversions', 
          value: connectionStatus.ga4 ? (ga4Data?.conversions || 0).toString() : '126', 
          status: connectionStatus.ga4 ? ((ga4Data?.conversions || 0) > 10 ? 'good' : 'warning') : 'good' 
        }
      ]
    },
    {
      name: 'Consideration',
      icon: MapPin,
      color: 'text-orange-600',
      bgGradient: 'bg-gradient-to-br from-orange-50 via-amber-25 to-yellow-50',
      borderGradient: 'border-orange-200/60',
      score: aiAnalysis?.breakdown?.gbpScore || (connectionStatus.gbp ? (gbpData?.calculatedScore || 0) : 91),
      trend: connectionStatus.gbp ? parseFloat(gbpData?.changePercent || '0') : 15,
      dataSource: 'Google Business Profile',
      explainer: 'The critical moment patients decide if your practice is right for them',
      whyItMatters: 'Reviews and local reputation are the deciding factors. Patients compare you to competitors and seek social proof before making their choice.',
      insight: connectionStatus.gbp 
        ? `${(gbpData?.totalViews || 0).toLocaleString()} profile views with ${(gbpData?.averageRating || 0).toFixed(1)}★ rating from ${gbpData?.totalReviews || 0} reviews. ${gbpData?.phoneCallsTotal || 0} phone calls this period.`
        : 'Outstanding local reputation! 4.9★ rating drives 67% more bookings than competitors. Patients love your "gentle approach".',
      action: aiAnalysis?.priorityOpportunities?.find(op => op.category === 'local')?.title ||
              (connectionStatus.gbp && (gbpData?.averageRating || 0) < 4.5
                ? 'Focus on improving review quality - currently at ' + (gbpData?.averageRating || 0).toFixed(1) + ' stars'
                : 'Share weekly before/after photos - visual content gets 3x more engagement'),
      metrics: [
        { 
          label: 'Review Rating', 
          value: connectionStatus.gbp ? `${(gbpData?.averageRating || 0).toFixed(1)}★` : '4.9★', 
          status: connectionStatus.gbp ? (Number(gbpData?.averageRating || 0) >= 4.5 ? 'good' : 'warning') : 'good' 
        },
        { 
          label: 'Total Reviews', 
          value: connectionStatus.gbp ? (gbpData?.totalReviews?.toString() || '0') : '127', 
          status: connectionStatus.gbp ? (Number(gbpData?.totalReviews || 0) > 20 ? 'good' : 'warning') : 'good' 
        },
        { 
          label: 'Phone Calls', 
          value: connectionStatus.gbp ? (gbpData?.phoneCallsTotal?.toString() || '0') : '8', 
          status: connectionStatus.gbp ? (Number(gbpData?.phoneCallsTotal || 0) > 5 ? 'good' : 'warning') : 'good' 
        }
      ]
    },
    {
      name: 'Decision',
      icon: MousePointer,
      color: 'text-green-600',
      bgGradient: 'bg-gradient-to-br from-green-50 via-emerald-25 to-teal-50',
      borderGradient: 'border-green-200/60',
      score: aiAnalysis?.breakdown?.clarityScore || (connectionStatus.clarity ? (clarityData?.calculatedScore || 0) : 68),
      trend: connectionStatus.clarity ? parseFloat(clarityData?.changePercent || '0') : -8,
      dataSource: 'Forms + Call Tracking + Clarity',
      explainer: 'The moment of truth when patients take action to book an appointment',
      whyItMatters: 'All your marketing efforts culminate here. A smooth booking process converts interested patients into scheduled appointments, while friction causes them to choose competitors.',
      insight: connectionStatus.clarity 
        ? `${(clarityData?.totalSessions || 0).toLocaleString()} sessions with ${(clarityData?.bounceRate || 0).toFixed(1)}% bounce rate. ${clarityData?.deadClicks || 0} dead clicks detected.`
        : 'Strong desktop conversions but mobile booking friction detected. 32% of users abandon mobile forms.',
      action: aiAnalysis?.priorityOpportunities?.find(op => op.category === 'experience')?.title ||
              (connectionStatus.clarity && (clarityData?.deadClicks || 0) > 10
                ? `Fix ${clarityData?.deadClicks || 0} dead clicks detected on your site`
                : 'Streamline mobile booking - reduce from 8 fields to 4 essentials'),
      metrics: [
        { 
          label: 'Total Sessions', 
          value: connectionStatus.clarity ? (clarityData?.totalSessions || 0).toLocaleString() : '15.4K', 
          status: connectionStatus.clarity ? ((clarityData?.totalSessions || 0) > 1000 ? 'good' : 'warning') : 'good' 
        },
        { 
          label: 'Bounce Rate', 
          value: connectionStatus.clarity ? `${(clarityData?.bounceRate || 0).toFixed(1)}%` : '32%', 
          status: connectionStatus.clarity ? ((clarityData?.bounceRate || 0) < 40 ? 'good' : 'warning') : 'good' 
        },
        { 
          label: 'Dead Clicks', 
          value: connectionStatus.clarity ? (clarityData?.deadClicks || 0).toString() : '45', 
          status: connectionStatus.clarity ? ((clarityData?.deadClicks || 0) < 20 ? 'good' : 'critical') : 'warning' 
        }
      ]
    },
    {
      name: 'Loyalty',
      icon: Heart,
      color: 'text-red-600',
      bgGradient: 'bg-gradient-to-br from-red-50 via-rose-25 to-pink-50',
      borderGradient: 'border-red-200/60',
      score: aiAnalysis?.breakdown?.pmsScore || (pmsData ? 75 : 73),
      trend: pmsData ? (pmsData.trend === 'up' ? 5 : pmsData.trend === 'down' ? -5 : 0) : 5,
      dataSource: 'PMS + Email Analytics',
      explainer: 'Where one-time patients become lifelong advocates for your practice',
      whyItMatters: 'Loyal patients are 5x more valuable than new ones. They return regularly, refer friends and family, and provide the foundation for sustainable practice growth.',
      insight: pmsData 
        ? `${pmsData.totalPatients || 0} total referral events with ${pmsData.selfReferred || 0} self-referrals and ${pmsData.drReferred || 0} doctor referrals. $${((pmsData.totalProduction || 0) / 1000).toFixed(0)}K total production.`
        : 'Excellent retention (78%) but untapped referral potential. Your loyal patients could generate 40% more revenue.',
      action: aiAnalysis?.priorityOpportunities?.find(op => op.category === 'growth')?.title ||
              (pmsData && pmsData.selfReferred < pmsData.drReferred
                ? 'Boost self-referrals - currently only ' + Math.round((pmsData.selfReferred / pmsData.totalPatients) * 100) + '% of referrals'
                : 'Launch "Refer a Friend" program with $50 credit incentive'),
      metrics: [
        { 
          label: 'Total Patients', 
          value: pmsData ? (pmsData.totalPatients?.toString() || '0') : '156', 
          status: pmsData ? (pmsData.totalPatients > 50 ? 'good' : 'warning') : 'good' 
        },
        { 
          label: 'Self-Referrals', 
          value: pmsData ? `${Math.round((pmsData.selfReferred / Math.max(pmsData.totalPatients, 1)) * 100)}%` : '12%', 
          status: pmsData ? (pmsData.selfReferred / Math.max(pmsData.totalPatients, 1) > 0.3 ? 'good' : 'warning') : 'warning' 
        },
        { 
          label: 'Production', 
          value: pmsData ? `$${((pmsData.totalProduction || 0) / 1000).toFixed(0)}K` : '$94K', 
          status: pmsData ? ((pmsData.totalProduction || 0) > 50000 ? 'good' : 'warning') : 'good' 
        }
      ]
    },
    {
      name: 'Growth',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgGradient: 'bg-gradient-to-br from-emerald-50 via-green-25 to-teal-50',
      borderGradient: 'border-emerald-200/60',
      score: aiAnalysis?.breakdown?.pmsScore || (pmsData ? 75 : 73),
      trend: pmsData ? (pmsData.trend === 'up' ? 5 : pmsData.trend === 'down' ? -5 : 0) : 5,
      dataSource: 'Practice Management System',
      explainer: 'Where it all comes together - tying our digital work to your business metrics',
      whyItMatters: 'This is the ultimate measure of success. All digital marketing efforts should drive real business growth through increased referrals, higher production, and stronger referral partnerships.',
      insight: pmsData 
        ? `${pmsData.totalPatients || 0} referrals this month generating $${((pmsData.totalProduction || 0) / 1000).toFixed(0)}K in production. Top sources: Website, Dr. Smith, Friend referrals.`
        : 'Strong month with 156 referrals generating $94K in production. Top sources: Website (35%), Dr. Smith (28%), Friend referrals (22%).',
      action: aiAnalysis?.recommendations?.[0]?.title ||
              (pmsData && pmsData.selfReferred < pmsData.drReferred
                ? 'Boost digital referrals - currently only ' + Math.round((pmsData.selfReferred / Math.max(pmsData.totalPatients, 1)) * 100) + '% of referrals'
                : 'Launch "Refer a Friend" program with $50 credit incentive to boost word-of-mouth growth'),
      metrics: [
        { 
          label: 'Referrals This Month', 
          value: pmsData ? (pmsData.totalPatients?.toString() || '0') : '156', 
          status: pmsData ? (pmsData.totalPatients > 50 ? 'good' : 'warning') : 'good' 
        },
        { 
          label: 'Total Production', 
          value: pmsData ? `$${((pmsData.totalProduction || 0) / 1000).toFixed(0)}K` : '$94K', 
          status: pmsData ? ((pmsData.totalProduction || 0) > 50000 ? 'good' : 'warning') : 'good' 
        },
        { 
          label: 'Top Source', 
          value: pmsData ? 'Website' : 'Website (35%)', 
          status: 'good' 
        }
      ]
    }
  ];

  const activeStage = journeyStages[activeStageIndex];

  const nextStage = () => {
    setActiveStageIndex((prev) => (prev + 1) % journeyStages.length);
  };

  const prevStage = () => {
    setActiveStageIndex((prev) => (prev - 1 + journeyStages.length) % journeyStages.length);
  };

  const goToStage = (index: number) => {
    setActiveStageIndex(index);
  };

  return (
    <div className="bg-gradient-to-br from-white via-gray-50/30 to-blue-50/20 rounded-2xl shadow-xl border border-gray-200/50 backdrop-blur-sm">
      {/* Header Section */}
      <div className="p-8 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                <div className={`w-1.5 h-1.5 bg-white rounded-full ${isLoadingAI ? 'animate-pulse' : ''}`} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Practice Vital Signs
              </h2>
              <p className="text-gray-600 flex items-center space-x-2">
                <Brain className="w-4 h-4 text-blue-500" />
                <span>
                  {isLoadingAI ? 'Generating AI insights...' : 
                   aiAnalysis ? `AI insights • Grade ${overallGrade} • Updated ${aiAnalysis.cached ? 'from cache' : 'now'}` :
                   'AI-powered patient journey intelligence'}
                </span>
              </p>
            </div>
          </div>
          
          {/* Overall Score Display */}
          <div className="relative">
            <div className={`w-24 h-24 rounded-2xl ${getScoreGradient(overallScore)} p-0.5 shadow-2xl`}>
              <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-3xl font-black ${getScoreColor(overallScore)}`}>
                    {overallScore}
                  </div>
                  <div className="text-xs font-medium text-gray-500 -mt-1">{overallGrade}</div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white rounded-lg px-2 py-1 shadow-lg border border-gray-200/50">
              <div className="flex items-center space-x-1">
                {getTrendIcon(overallTrend)}
                <span className={`text-xs font-semibold ${overallTrend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {overallTrend > 0 ? '+' : ''}{overallTrend}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Interactive Journey Flow */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-3 border border-gray-200/50 shadow-sm">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Patient Journey Flow</span>
            {isLoadingAI && (
              <div className="flex items-center space-x-2 ml-4">
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-blue-600">AI analyzing...</span>
              </div>
            )}
            <div className="flex items-center space-x-2 ml-4">
              {journeyStages.map((stage, index) => {
                const Icon = stage.icon;
                const isActive = index === activeStageIndex;
                return (
                  <div key={stage.name} className="flex items-center">
                    <button
                      onClick={() => goToStage(index)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transform transition-all duration-300 ${
                        isActive 
                          ? 'scale-125 shadow-xl' 
                          : 'hover:scale-110 opacity-70 hover:opacity-100'
                      } ${
                        stage.score >= 85 ? 'bg-gradient-to-br from-emerald-400 to-green-500' : 
                        stage.score >= 70 ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
                        stage.score >= 55 ? 'bg-gradient-to-br from-orange-400 to-red-400' : 
                        'bg-gradient-to-br from-red-400 to-pink-500'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </button>
                    {index < journeyStages.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-gray-400 mx-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Carousel Container */}
      <div className="px-8 pb-8">
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevStage}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200/50 flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:scale-110"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            onClick={nextStage}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200/50 flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:scale-110"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>

          {/* Active Stage Card */}
          <div className={`${activeStage.bgGradient} rounded-2xl border-2 ${activeStage.borderGradient} p-8 shadow-lg transition-all duration-500 transform`}>
            {/* Stage Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-xl ${getScoreGradient(activeStage.score)} p-0.5 shadow-lg`}>
                    <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                      <activeStage.icon className={`w-8 h-8 ${activeStage.color}`} />
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-white rounded-lg px-2 py-1 shadow-md border border-gray-200/50">
                    <span className={`text-sm font-bold ${getScoreColor(activeStage.score)}`}>
                      {activeStage.score}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{activeStage.name}</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <p className="text-sm font-medium text-gray-600">{activeStage.dataSource}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {getTrendIcon(activeStage.trend)}
                <span className={`text-lg font-semibold ${activeStage.trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {activeStage.trend > 0 ? '+' : ''}{activeStage.trend}%
                </span>
              </div>
            </div>
            
            {/* Stage Explainer */}
            <div className="bg-gradient-to-r from-white/90 to-gray-50/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/60 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                  <span className="text-white text-lg font-bold">{activeStageIndex + 1}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2 text-lg">{activeStage.explainer}</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{activeStage.whyItMatters}</p>
                </div>
              </div>
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              {activeStage.metrics.map((metric) => (
                <div key={metric.label} className={`rounded-xl p-5 ${getMetricStatusStyle(metric.status)} transform hover:scale-105 transition-transform duration-200`}>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {metric.value}
                    </div>
                    <div className="text-sm font-medium text-gray-600">
                      {metric.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* AI Insight */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/50 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2 text-lg">AI Insight</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {isLoadingAI ? 'AI is analyzing your practice data to provide personalized insights...' : activeStage.insight}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Step */}
            <div className="bg-gradient-to-r from-white to-gray-50/50 rounded-xl p-6 border border-gray-200/50 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2 text-lg">Recommended Action</h4>
                    <p className="text-sm text-gray-700">
                      {isLoadingAI ? 'AI is analyzing your data to provide the most impactful next step...' : activeStage.action}
                    </p>
                    {aiAnalysis?.priorityOpportunities?.find(op => 
                      op.category === (activeStageIndex === 0 ? 'search' : 
                                     activeStageIndex === 1 ? 'website' :
                                     activeStageIndex === 2 ? 'local' :
                                     activeStageIndex === 3 ? 'experience' : 'growth')
                    ) && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span className="font-medium">Estimated Impact:</span> {
                          aiAnalysis.priorityOpportunities.find(op => 
                            op.category === (activeStageIndex === 0 ? 'search' : 
                                           activeStageIndex === 1 ? 'website' :
                                           activeStageIndex === 2 ? 'local' :
                                           activeStageIndex === 3 ? 'experience' : 'growth')
                          )?.estimatedImpact
                        } • <span className="font-medium">Timeline:</span> {
                          aiAnalysis.priorityOpportunities.find(op => 
                            op.category === (activeStageIndex === 0 ? 'search' : 
                                           activeStageIndex === 1 ? 'website' :
                                           activeStageIndex === 2 ? 'local' :
                                           activeStageIndex === 3 ? 'experience' : 'growth')
                          )?.timeframe
                        }
                      </div>
                    )}
                  </div>
                </div>
                <button className={`px-6 py-4 text-sm font-semibold text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${
                  activeStage.color.includes('purple') ? 'bg-gradient-to-r from-purple-500 to-indigo-600' :
                  activeStage.color.includes('blue') ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                  activeStage.color.includes('orange') ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                  activeStage.color.includes('green') ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                  'bg-gradient-to-r from-red-500 to-pink-600'
                } ${isLoadingAI ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoadingAI}>
                  Add to Team Tasks
                </button>
              </div>
            </div>
          </div>

          {/* AI Insights Panel */}
          {aiAnalysis && !isLoadingAI && (
            <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-semibold text-indigo-900">AI Practice Insights</h4>
                </div>
                <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                  Updated {aiAnalysis.cached ? 'from cache' : 'now'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Priority Opportunities */}
                <div>
                  <h5 className="font-medium text-indigo-900 mb-3">🎯 Priority Opportunities</h5>
                  <div className="space-y-2">
                    {(aiAnalysis.priorityOpportunities || []).slice(0, 2).map((opportunity, index) => (
                      <div key={index} className="bg-white/60 rounded-lg p-3 border border-white/50">
                        <h6 className="font-medium text-gray-900 text-sm">{opportunity.title}</h6>
                        <p className="text-xs text-gray-700 mt-1">{opportunity.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            opportunity.impact === 'high' ? 'bg-red-100 text-red-700' :
                            opportunity.impact === 'medium' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {opportunity.impact} impact
                          </span>
                          <span className="text-xs text-gray-600">{opportunity.timeframe}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Recent Wins */}
                <div>
                  <h5 className="font-medium text-indigo-900 mb-3">🏆 Recent Wins</h5>
                  <div className="space-y-2">
                    {(aiAnalysis.recentWins || []).slice(0, 2).map((win, index) => (
                      <div key={index} className="bg-white/60 rounded-lg p-3 border border-white/50">
                        <h6 className="font-medium text-gray-900 text-sm">{win.title}</h6>
                        <p className="text-xs text-gray-700 mt-1">{win.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                            {win.improvement}
                          </span>
                          <span className="text-xs text-gray-600">{win.timeframe}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Stage Indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            {journeyStages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStage(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === activeStageIndex 
                    ? 'bg-blue-500 scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};