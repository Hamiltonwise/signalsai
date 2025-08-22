import React, { useState } from 'react';
import { TrendingUp, Search, Globe, MapPin, MousePointer, Heart, ArrowRight, Lightbulb, Target, Zap, Brain, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

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

export const VitalSignsCard: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const overallScore = 78;
  const overallTrend = 12;
  
  const journeyStages: JourneyStage[] = [
    {
      name: 'Awareness',
      icon: Search,
      color: 'text-purple-600',
      bgGradient: 'bg-gradient-to-br from-purple-50 via-purple-25 to-indigo-50',
      borderGradient: 'border-purple-200/60',
      score: 82,
      trend: 8,
      dataSource: 'Google Search Console + GA4',
      explainer: 'The first moment potential patients discover your practice exists',
      whyItMatters: 'Without visibility, even the best dental practice remains unknown. This stage determines your practice\'s discoverability when patients search for dental care in your area.',
      insight: 'Your practice dominates local search with 73% visibility. Strong performance for "dentist near me" and "dental cleaning" keywords.',
      action: 'Target "emergency dentist" keywords - 340% higher conversion potential',
      metrics: [
        { label: 'Search Impressions', value: '12.4K', status: 'good' },
        { label: 'Avg. Position', value: '3.2', status: 'good' },
        { label: 'CTR', value: '2.8%', status: 'warning' }
      ]
    },
    {
      name: 'Research',
      icon: Globe,
      color: 'text-blue-600',
      bgGradient: 'bg-gradient-to-br from-blue-50 via-cyan-25 to-sky-50',
      borderGradient: 'border-blue-200/60',
      score: 75,
      trend: -3,
      dataSource: 'Website Analytics + Clarity',
      explainer: 'When patients explore your services and evaluate your expertise',
      whyItMatters: 'This is where trust begins. Patients research your credentials, services, and approach. A strong research experience builds confidence and moves patients toward booking.',
      insight: 'Visitors engage deeply with your content (2.3min avg). Top interests: whitening, implants, preventive care.',
      action: 'Add video testimonials to service pages - proven 40% engagement boost',
      metrics: [
        { label: 'Page Views', value: '3.2K', status: 'good' },
        { label: 'Session Time', value: '2:18', status: 'good' },
        { label: 'Bounce Rate', value: '45%', status: 'warning' }
      ]
    },
    {
      name: 'Consideration',
      icon: MapPin,
      color: 'text-orange-600',
      bgGradient: 'bg-gradient-to-br from-orange-50 via-amber-25 to-yellow-50',
      borderGradient: 'border-orange-200/60',
      score: 91,
      trend: 15,
      dataSource: 'Google Business Profile',
      explainer: 'The critical moment patients decide if your practice is right for them',
      whyItMatters: 'Reviews and local reputation are the deciding factors. Patients compare you to competitors and seek social proof before making their choice.',
      insight: 'Outstanding local reputation! 4.9★ rating drives 67% more bookings than competitors. Patients love your "gentle approach".',
      action: 'Share weekly before/after photos - visual content gets 3x more engagement',
      metrics: [
        { label: 'Review Rating', value: '4.9★', status: 'good' },
        { label: 'Profile Views', value: '2.1K', status: 'good' },
        { label: 'Photo Views', value: '890', status: 'good' }
      ]
    },
    {
      name: 'Decision',
      icon: MousePointer,
      color: 'text-green-600',
      bgGradient: 'bg-gradient-to-br from-green-50 via-emerald-25 to-teal-50',
      borderGradient: 'border-green-200/60',
      score: 68,
      trend: -8,
      dataSource: 'Forms + Call Tracking',
      explainer: 'The moment of truth when patients take action to book an appointment',
      whyItMatters: 'All your marketing efforts culminate here. A smooth booking process converts interested patients into scheduled appointments, while friction causes them to choose competitors.',
      insight: 'Strong desktop conversions but mobile booking friction detected. 32% of users abandon mobile forms.',
      action: 'Streamline mobile booking - reduce from 8 fields to 4 essentials',
      metrics: [
        { label: 'Conversion', value: '4.2%', status: 'warning' },
        { label: 'Form Starts', value: '156', status: 'good' },
        { label: 'Mobile Conv.', value: '23%', status: 'critical' }
      ]
    },
    {
      name: 'Loyalty',
      icon: Heart,
      color: 'text-red-600',
      bgGradient: 'bg-gradient-to-br from-red-50 via-rose-25 to-pink-50',
      borderGradient: 'border-red-200/60',
      score: 73,
      trend: 5,
      dataSource: 'PMS + Email Analytics',
      explainer: 'Where one-time patients become lifelong advocates for your practice',
      whyItMatters: 'Loyal patients are 5x more valuable than new ones. They return regularly, refer friends and family, and provide the foundation for sustainable practice growth.',
      insight: 'Excellent retention (78%) but untapped referral potential. Your loyal patients could generate 40% more revenue.',
      action: 'Launch "Refer a Friend" program with $50 credit incentive',
      metrics: [
        { label: 'New Reviews', value: '8 this week', status: 'good' },
        { label: 'Referrals', value: '12%', status: 'warning' },
        { label: 'Positive Sentiment', value: '94%', status: 'good' }
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

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 55) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 85) return 'bg-gradient-to-br from-emerald-500 to-green-600';
    if (score >= 70) return 'bg-gradient-to-br from-blue-500 to-indigo-600';
    if (score >= 55) return 'bg-gradient-to-br from-orange-500 to-red-500';
    return 'bg-gradient-to-br from-red-500 to-pink-600';
  };

  const getMetricStatusStyle = (status: string) => {
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
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-3 h-3 text-emerald-500" />;
    if (trend < 0) return <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />;
    return <div className="w-3 h-3 bg-gray-300 rounded-full" />;
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
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Practice Vital Signs
              </h2>
              <p className="text-gray-600 flex items-center space-x-2">
                <Brain className="w-4 h-4 text-blue-500" />
                <span>AI-powered patient journey intelligence</span>
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
                  <div className="text-xs font-medium text-gray-500 -mt-1">OVERALL</div>
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
                  <p className="text-sm text-gray-700 leading-relaxed">{activeStage.insight}</p>
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
                    <p className="text-sm text-gray-700">{activeStage.action}</p>
                  </div>
                </div>
                <button className={`px-6 py-4 text-sm font-semibold text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${
                  activeStage.color.includes('purple') ? 'bg-gradient-to-r from-purple-500 to-indigo-600' :
                  activeStage.color.includes('blue') ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                  activeStage.color.includes('orange') ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                  activeStage.color.includes('green') ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                  'bg-gradient-to-r from-red-500 to-pink-600'
                }`}>
                  {activeStage.name === 'Awareness' || activeStage.name === 'Research' || activeStage.name === 'Consideration' 
                    ? 'Add to HW Team Tasks' 
                    : 'Add to My Team Tasks'}
                </button>
              </div>
            </div>
          </div>

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