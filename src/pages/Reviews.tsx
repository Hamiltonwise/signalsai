import React, { useState } from 'react';
import { Star, Calendar, User, Sparkles, TrendingUp, Copy, Share2, CheckCircle, Bell } from 'lucide-react';

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  avatar?: string;
  verified: boolean;
  aiScore: number;
  aiReason: string;
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  responseStatus: 'responded' | 'pending' | 'not_needed';
}

export const Reviews: React.FC = () => {
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'ai-recommended' | 'recent'>('all');
  const [autoRespond, setAutoRespond] = useState(true);

  const reviews: Review[] = [
    {
      id: '1',
      author: 'Sarah Johnson',
      rating: 5,
      text: 'Dr. Smith and his team are absolutely amazing! I was terrified of dental work, but they made me feel so comfortable. The office is spotless, the staff is incredibly friendly, and the results exceeded my expectations. My teeth have never looked better! I would recommend this practice to anyone looking for exceptional dental care.',
      date: '2024-01-12',
      verified: true,
      aiScore: 95,
      aiReason: 'Perfect combination of emotional appeal, specific details, and strong recommendation. Mentions fear overcome, cleanliness, staff, and results.',
      keywords: ['comfortable', 'friendly staff', 'exceptional care', 'exceeded expectations'],
      sentiment: 'positive',
      responseStatus: 'pending'
    },
    {
      id: '2',
      author: 'Michael Chen',
      rating: 5,
      text: 'Outstanding service from start to finish. The appointment scheduling was seamless, the facility is modern and clean, and Dr. Smith explained everything clearly. My dental cleaning was thorough and painless. The hygienist was gentle and professional. Highly recommend!',
      date: '2024-01-10',
      verified: true,
      aiScore: 88,
      aiReason: 'Great for showcasing process efficiency and professionalism. Mentions scheduling, facility, and staff expertise.',
      keywords: ['seamless scheduling', 'modern facility', 'thorough cleaning', 'professional'],
      sentiment: 'positive',
      responseStatus: 'responded'
    },
    {
      id: '3',
      author: 'Lisa Rodriguez',
      rating: 5,
      text: 'I had a dental emergency and they fit me in the same day. Dr. Smith was so kind and understanding, and fixed my tooth perfectly. The pain relief was immediate. The whole team went above and beyond to help me. Thank you so much!',
      date: '2024-01-08',
      verified: true,
      aiScore: 92,
      aiReason: 'Excellent for emergency care positioning. Shows responsiveness, empathy, and immediate results.',
      keywords: ['emergency care', 'same day', 'immediate relief', 'above and beyond'],
      sentiment: 'positive',
      responseStatus: 'responded'
    },
    {
      id: '4',
      author: 'David Wilson',
      rating: 5,
      text: 'Best dental experience I\'ve ever had! The technology they use is impressive, and Dr. Smith is clearly an expert in his field. My crown looks and feels completely natural. The entire process was smooth and comfortable.',
      date: '2024-01-06',
      verified: true,
      aiScore: 85,
      aiReason: 'Great for highlighting technology and expertise. Appeals to patients seeking advanced dental care.',
      keywords: ['impressive technology', 'expert', 'natural results', 'smooth process'],
      sentiment: 'positive',
      responseStatus: 'responded'
    },
    {
      id: '5',
      author: 'Jennifer Martinez',
      rating: 5,
      text: 'The staff here is wonderful! From the moment I walked in, I felt welcomed. My teeth whitening results are incredible - I can\'t stop smiling! The price was fair and the service was top-notch. Will definitely be back!',
      date: '2024-01-04',
      verified: true,
      aiScore: 78,
      aiReason: 'Good for cosmetic services and value proposition. Shows satisfaction with results and pricing.',
      keywords: ['wonderful staff', 'incredible results', 'fair price', 'top-notch service'],
      sentiment: 'positive',
      responseStatus: 'pending'
    }
  ];

  const aiRecommendedReview = reviews.reduce((prev, current) => 
    prev.aiScore > current.aiScore ? prev : current
  );

  const filteredReviews = reviews.filter(review => {
    switch (filter) {
      case 'ai-recommended':
        return review.aiScore >= 90;
      case 'recent':
        return new Date(review.date) >= new Date('2024-01-10');
      default:
        return true;
    }
  });

  const getAIScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getResponseStatusColor = (status: string) => {
    switch (status) {
      case 'responded':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">5-Star Reviews</h1>
          <p className="text-gray-600">Manage and showcase your best patient feedback</p>
        </div>
        <div className="flex items-center space-x-6">
          {/* Auto-Respond Toggle */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">Auto-Respond</span>
            <button
              onClick={() => setAutoRespond(!autoRespond)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                autoRespond ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoRespond ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <div className="text-xs text-gray-500">
              {autoRespond ? 'Our team responds automatically' : 'Manual responses only'}
            </div>
          </div>
          
          <div className="relative">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">2</span>
            </span>
          </div>
          <span className="text-sm text-gray-600">
            {autoRespond ? '2 reviews being processed by our team' : '2 new reviews to respond to'}
          </span>
        </div>
      </div>

      {/* AI Recommendation Card */}
      <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl border-2 border-purple-200/60 p-8 shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">AI Recommended Review</h2>
              <p className="text-gray-600 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span>Best review to feature this week</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600 mb-1">{aiRecommendedReview.aiScore}</div>
            <div className="text-sm text-gray-500">AI Score</div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/60 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {aiRecommendedReview.author.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{aiRecommendedReview.author}</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">{aiRecommendedReview.date}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Copy className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <p className="text-gray-700 leading-relaxed mb-4">{aiRecommendedReview.text}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {aiRecommendedReview.keywords.map((keyword) => (
              <span key={keyword} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-white to-gray-50/50 rounded-xl p-6 border border-gray-200/50 shadow-sm">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2 text-lg">Why This Review is Perfect</h4>
              <p className="text-sm text-gray-700">{aiRecommendedReview.aiReason}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Impact Potential:</span> High engagement expected
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold">
                Add to HW Team Tasks
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold">
                Add to My Team Tasks
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        {[
          { key: 'all', label: 'All Reviews', count: reviews.length },
          { key: 'ai-recommended', label: 'AI Recommended', count: reviews.filter(r => r.aiScore >= 90).length },
          { key: 'recent', label: 'Recent', count: reviews.filter(r => new Date(r.date) >= new Date('2024-01-10')).length }
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === filterOption.key
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {filterOption.label} ({filterOption.count})
          </button>
        ))}
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 ${
              review.id === aiRecommendedReview.id ? 'ring-2 ring-purple-200 bg-purple-50/30' : ''
            }`}
          >
            {/* Review Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {review.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{review.author}</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{review.date}</span>
                    {review.verified && (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`px-2 py-1 rounded-lg text-xs font-medium border ${getAIScoreColor(review.aiScore)}`}>
                  AI: {review.aiScore}
                </div>
                {review.id === aiRecommendedReview.id && (
                  <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium border border-purple-200">
                    Recommended
                  </div>
                )}
              </div>
            </div>

            {/* Review Text */}
            <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-4">
              {review.text}
            </p>

            {/* Keywords */}
            <div className="flex flex-wrap gap-1 mb-4">
              {review.keywords.slice(0, 3).map((keyword) => (
                <span key={keyword} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  {keyword}
                </span>
              ))}
              {review.keywords.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  +{review.keywords.length - 3} more
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className={`px-2 py-1 rounded text-xs font-medium border ${getResponseStatusColor(review.responseStatus)}`}>
                {review.responseStatus === 'responded' ? 'Responded' : 
                 review.responseStatus === 'pending' ? 'Response Needed' : 'No Response Needed'}
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                {!autoRespond && review.responseStatus === 'pending' && (
                  <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                    Respond
                  </button>
                )}
                {autoRespond && review.responseStatus === 'pending' && (
                  <span className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded border border-orange-200">
                    Auto-responding...
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{reviews.length}</div>
            <div className="text-sm text-gray-600">5-Star Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {Math.round(reviews.reduce((sum, r) => sum + r.aiScore, 0) / reviews.length)}
            </div>
            <div className="text-sm text-gray-600">Avg AI Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {reviews.filter(r => r.responseStatus === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Need Response</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {reviews.filter(r => r.aiScore >= 90).length}
            </div>
            <div className="text-sm text-gray-600">AI Recommended</div>
          </div>
        </div>
      </div>
    </div>
  );
};