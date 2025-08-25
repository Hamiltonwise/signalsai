import React, { useState } from 'react';
import { Star, Calendar, User, Sparkles, TrendingUp, Copy, Share2, CheckCircle, Bell, RefreshCw, Filter, Brain, Target, Lightbulb } from 'lucide-react';
import { useReviews } from '../hooks/useReviews';
import { useClient } from '../contexts/ClientContext';

export default function Reviews() {
  const { clientId } = useClient();
  const { 
    reviews, 
    metrics, 
    isLoading, 
    error, 
    refreshReviews, 
    getTopReviews, 
    getPendingResponses 
  } = useReviews(clientId);
  
  const [filter, setFilter] = useState<'all' | 'ai-recommended' | 'recent'>('all');
  const [autoRespond, setAutoRespond] = useState(true);
  const [aiRecommendedReview, setAiRecommendedReview] = useState<any>(null);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);

  // Get AI recommended review and generate recommendation
  React.useEffect(() => {
    if (reviews.length > 0) {
      console.log('=== Processing Reviews for AI Recommendation ===');
      console.log('Total reviews:', reviews.length);
      console.log('Sample review scores:', reviews.slice(0, 3).map(r => ({ author: r.author_name, score: r.ai_score })));
      
      const highestScoringReview = reviews.reduce((prev, current) => 
        prev.ai_score > current.ai_score ? prev : current
      );
      
      console.log('Highest scoring review:', {
        author: highestScoringReview.author_name,
        score: highestScoringReview.ai_score,
        rating: highestScoringReview.rating
      });
      
      setAiRecommendedReview(highestScoringReview);
      
      // Generate AI recommendation for the highest scoring review
      generateAIRecommendation(highestScoringReview);
    }
  }, [reviews]);

  const filteredReviews = reviews.filter(review => {
    switch (filter) {
      case 'ai-recommended':
        return review.ai_score >= 90;
      case 'recent':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(review.review_date) >= thirtyDaysAgo;
      default:
        return true;
    }
  });

  const getAIScoreColor = (score: number): string => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getResponseStatusColor = (status: string): string => {
    switch (status) {
      case 'responded':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const generateAIRecommendation = async (review: any) => {
    if (!review || isGeneratingRecommendation) return;
    
    console.log('=== Generating AI Recommendation ===');
    console.log('Review to analyze:', {
      author: review.author_name,
      rating: review.rating,
      textLength: review.review_text?.length || 0,
      aiScore: review.ai_score
    });
    
    setIsGeneratingRecommendation(true);
    setAiRecommendation(null);
    
    try {
      // Validate environment variables
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase environment variables');
      }
      
      console.log('Calling AI review analysis function...');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-review-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          reviewText: review.review_text,
          rating: review.rating,
          analysisType: 'response_suggestion'
        })
      });

      console.log('AI analysis response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('AI analysis response data:', data);
        
        if (data.success && data.data) {
          console.log('AI recommendation generated successfully:', {
            hasSuggestedResponse: !!data.data.suggestedResponse,
            tone: data.data.tone,
            keyPointsCount: data.data.keyPoints?.length || 0
          });
          
          setAiRecommendation(data.data);
        } else {
          console.log('AI analysis failed, using fallback:', data.error || 'No data returned');
          // Use fallback instead of throwing error
          setAiRecommendation({
            suggestedResponse: `Thank you so much for your wonderful ${review.rating}-star review, ${review.author_name}! We truly appreciate your feedback and are delighted that you had such a positive experience with our practice. Your kind words mean the world to our team.`,
            tone: 'grateful',
            keyPoints: ['Thank for specific feedback', 'Acknowledge positive experience', 'Appreciate the review'],
            callToAction: 'We look forward to seeing you again soon!',
            fallback: true,
            error: data.error
          });
        }
      } else {
        const errorText = await response.text();
        console.error('AI analysis request failed:', response.status, errorText);
        // Use fallback instead of throwing error
        setAiRecommendation({
          suggestedResponse: `Thank you so much for your wonderful ${review.rating}-star review, ${review.author_name}! We truly appreciate your feedback and are delighted that you had such a positive experience with our practice. Your kind words mean the world to our team.`,
          tone: 'grateful',
          keyPoints: ['Thank for specific feedback', 'Acknowledge positive experience'],
          callToAction: 'We look forward to seeing you again soon!',
          fallback: true,
          error: `API request failed: ${response.status}`
        });
      }
    } catch (error) {
      console.error('Error generating AI recommendation:', error);
      setAiRecommendation({
        suggestedResponse: `Thank you so much for your wonderful ${review.rating}-star review, ${review.author_name}! We truly appreciate your feedback and are delighted that you had such a positive experience with our practice. Your kind words mean the world to our team, and we look forward to seeing you again soon!`,
        tone: 'grateful',
        keyPoints: ['Thank for specific feedback', 'Acknowledge positive experience', 'Personal touch'],
        callToAction: 'We look forward to continuing to provide excellent care!',
        fallback: true,
        error: error.message
      });
    } finally {
      setIsGeneratingRecommendation(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">5-Star Reviews</h1>
          <p className="text-gray-500 text-lg font-medium">Manage and showcase your best patient feedback</p>
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
          
          <button
            onClick={refreshReviews}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          
          {metrics && (
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-400" />
              {metrics.pendingResponsesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{metrics.pendingResponsesCount}</span>
                </span>
              )}
            </div>
          )}
          {metrics && (
            <span className="text-sm text-gray-600">
              {autoRespond 
                ? `${metrics.pendingResponsesCount} reviews being processed by our team` 
                : `${metrics.pendingResponsesCount} new reviews to respond to`
              }
            </span>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && reviews.length === 0 && (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 text-blue-600 mx-auto mb-3 animate-spin" />
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      )}

      {/* AI Recommendation Card */}
      {aiRecommendedReview && (
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
              <div className="text-3xl font-bold text-purple-600 mb-1">{aiRecommendedReview.ai_score}</div>
              <div className="text-sm text-gray-500">AI Score</div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/60 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {aiRecommendedReview.author_name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{aiRecommendedReview.author_name}</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(aiRecommendedReview.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{new Date(aiRecommendedReview.review_date).toLocaleDateString()}</span>
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
            
            <p className="text-gray-700 leading-relaxed mb-4">{aiRecommendedReview.review_text}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {aiRecommendedReview.ai_keywords.map((keyword) => (
                <span key={keyword} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* AI Response Recommendation */}
          {aiRecommendation && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-200/50 shadow-sm">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2 text-lg">AI-Generated Response</h4>
                  <div className="bg-white/80 rounded-lg p-4 border border-green-200/50">
                    <p className="text-sm text-gray-700 leading-relaxed italic">
                      "{aiRecommendation.suggestedResponse}"
                    </p>
                    {aiRecommendation.error && (
                      <p className="text-xs text-orange-600 mt-2">
                        Note: Using fallback response ({aiRecommendation.error})
                      </p>
                    )}
                  </div>
                  {aiRecommendation.fallback && (
                    <p className="text-xs text-blue-600 mt-2">
                      💡 Personalized fallback response generated
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-4 text-xs text-green-700">
                      <span><strong>Tone:</strong> {aiRecommendation.tone}</span>
                      <span><strong>Key Points:</strong> {aiRecommendation.keyPoints?.join(', ')}</span>
                    </div>
                    <button 
                      onClick={() => navigator.clipboard?.writeText(aiRecommendation.suggestedResponse)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"
                    >
                      Copy Response
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isGeneratingRecommendation && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200/50 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-blue-700">AI is generating a personalized response recommendation...</span>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-white to-gray-50/50 rounded-xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2 text-lg">Why This Review is Perfect</h4>
                <p className="text-sm text-gray-700">
                  This review scores {aiRecommendedReview.ai_score}/100 for marketing effectiveness. 
                  It combines emotional appeal with specific details about your practice, making it highly influential for potential patients.
                </p>
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
      )}

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Filter className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        {[
          { key: 'all', label: 'All Reviews', count: reviews.length },
          { key: 'ai-recommended', label: 'AI Recommended', count: reviews.filter(r => r.ai_score >= 90).length },
          { key: 'recent', label: 'Recent', count: reviews.filter(r => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return new Date(r.review_date) >= thirtyDaysAgo;
          }).length }
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
      {!isLoading && filteredReviews.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 ${
                aiRecommendedReview && review.id === aiRecommendedReview.id ? 'ring-2 ring-purple-200 bg-purple-50/30' : ''
              }`}
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {review.author_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{review.author_name}</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{new Date(review.review_date).toLocaleDateString()}</span>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium border ${getAIScoreColor(review.ai_score)}`}>
                    AI: {review.ai_score}
                  </div>
                  {aiRecommendedReview && review.id === aiRecommendedReview.id && (
                    <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium border border-purple-200">
                      Recommended
                    </div>
                  )}
                </div>
              </div>

              {/* Review Text */}
              <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-4">
                {review.review_text}
              </p>

              {/* Keywords */}
              <div className="flex flex-wrap gap-1 mb-4">
                {review.ai_keywords.slice(0, 3).map((keyword) => (
                  <span key={keyword} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    {keyword}
                  </span>
                ))}
                {review.ai_keywords.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    +{review.ai_keywords.length - 3} more
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className={`px-2 py-1 rounded text-xs font-medium border ${getResponseStatusColor(review.response_status)}`}>
                  {review.response_status === 'responded' ? 'Responded' : 
                   review.response_status === 'pending' ? 'Response Needed' : 'No Response Needed'}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                  {!autoRespond && review.response_status === 'pending' && (
                    <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                      Respond
                    </button>
                  )}
                  {autoRespond && review.response_status === 'pending' && (
                    <span className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded border border-orange-200">
                      Auto-responding...
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredReviews.length === 0 && !error && (
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">
            {reviews.length === 0 ? 'No reviews found' : 'No reviews match the selected filter'}
          </p>
          <p className="text-sm text-gray-400">
            {reviews.length === 0 
              ? 'Reviews will appear here once they are fetched from Google Business Profile'
              : 'Try adjusting your filters or refresh for the latest reviews'
            }
          </p>
        </div>
      )}

      {/* Stats Summary */}
      {metrics && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{metrics.totalReviews}</div>
              <div className="text-sm text-gray-600">Total Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">{metrics.averageRating.toFixed(1)}★</div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{Math.round(metrics.averageAIScore)}</div>
              <div className="text-sm text-gray-600">Avg AI Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">{metrics.pendingResponsesCount}</div>
              <div className="text-sm text-gray-600">Need Response</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{metrics.highEffectivenessCount}</div>
              <div className="text-sm text-gray-600">High Effectiveness</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { Reviews }