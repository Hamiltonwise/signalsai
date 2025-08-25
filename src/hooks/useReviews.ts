import { useState, useEffect } from 'react';
import { useAuthReady } from './useAuthReady';

interface Review {
  id: string;
  client_id: string;
  review_text: string;
  rating: number;
  author_name: string;
  review_date: string;
  platform: string;
  ai_score: number;
  ai_keywords: string[];
  effectiveness_rating: 'high' | 'medium' | 'low';
  sentiment: 'positive' | 'neutral' | 'negative';
  response_status: 'responded' | 'pending' | 'not_needed';
  external_review_id: string;
  created_at: string;
}

interface ReviewsMetrics {
  totalReviews: number;
  averageRating: number;
  averageAIScore: number;
  highEffectivenessCount: number;
  pendingResponsesCount: number;
  recentReviewsCount: number;
}

export const useReviews = (clientId: string) => {
  const { ready, session } = useAuthReady();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [metrics, setMetrics] = useState<ReviewsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const fetchReviews = async () => {
    if (!ready || !session || !clientId) {
      console.log('Reviews: Waiting for auth ready state');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('=== Fetching Reviews ===');
      console.log('Client ID:', clientId);


      // Validate environment variables
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase environment variables');
      }

      // Step 1: Fetch fresh reviews from GBP API and store them
      console.log('Step 1: Fetching fresh reviews from GBP API...');
      const gbpResponse = await fetch(`${SUPABASE_URL}/functions/v1/gbp-reviews`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'x-client-id': clientId
        }
      });

      // Don't fail if GBP fetch fails - we can still show stored reviews
      if (gbpResponse.ok) {
        const gbpData = await gbpResponse.json();
        console.log('Step 1 - GBP API fetch result:', {
          success: gbpData.ok,
          reviewsCount: gbpData.data?.length || 0,
          message: gbpData.message
        });
      } else {
        console.log('Step 1 - GBP API fetch failed, will use stored reviews only');
      }

      // Step 2: Always fetch all stored reviews from database (includes fresh + historical)
      console.log('Step 2: Fetching all stored reviews from database...');
      const storedUrl = `${SUPABASE_URL}/functions/v1/get-reviews?clientId=${encodeURIComponent(clientId)}`;
      const storedResponse = await fetch(storedUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      });

      if (!storedResponse.ok) {
        const errorText = await storedResponse.text();
        console.error('Failed to fetch stored reviews:', errorText);
        // Set empty state instead of throwing error
        setReviews([]);
        setMetrics(null);
        return;
      }

      const data = await storedResponse.json();
      console.log('Step 2 - Database fetch result:', {
        success: data.success,
        reviewsCount: data.data?.length || 0,
        hasMetrics: !!data.metrics
      });

      if (data.success && data.data) {
        const reviewsData = data.data.map((review: any) => ({
          ...review,
          ai_keywords: typeof review.ai_keywords === 'string' 
            ? JSON.parse(review.ai_keywords) 
            : review.ai_keywords || []
        }));

        console.log('Step 2 completed - Final reviews data processed:', {
          totalReviews: reviewsData.length,
          realReviews: reviewsData.filter(r => !r.external_review_id?.includes('demo')).length,
          demoReviews: reviewsData.filter(r => r.external_review_id?.includes('demo')).length,
          sampleReview: reviewsData[0] ? {
            author: reviewsData[0].author_name,
            rating: reviewsData[0].rating,
            aiScore: reviewsData[0].ai_score,
            platform: reviewsData[0].platform,
            isReal: !reviewsData[0].external_review_id?.includes('demo')
          } : null
        });
        setReviews(reviewsData);
        calculateMetrics(reviewsData);
        
        // Set metrics from API response if available
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      } else {
        console.log('No reviews data returned from get-reviews function');
        setReviews([]);
        setMetrics(null);
      }

    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
      
      // Set empty state on error
      setReviews([]);
      setMetrics(null);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = (reviewsData: Review[]) => {
    if (reviewsData.length === 0) {
      setMetrics({
        totalReviews: 0,
        averageRating: 0,
        averageAIScore: 0,
        highEffectivenessCount: 0,
        pendingResponsesCount: 0,
        recentReviewsCount: 0
      });
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metrics: ReviewsMetrics = {
      totalReviews: reviewsData.length,
      averageRating: reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length,
      averageAIScore: reviewsData.reduce((sum, r) => sum + r.ai_score, 0) / reviewsData.length,
      highEffectivenessCount: reviewsData.filter(r => r.effectiveness_rating === 'high').length,
      pendingResponsesCount: reviewsData.filter(r => r.response_status === 'pending').length,
      recentReviewsCount: reviewsData.filter(r => new Date(r.review_date) >= thirtyDaysAgo).length
    };

    setMetrics(metrics);
  };

  const getTopReviews = (limit: number = 5) => {
    return reviews
      .filter(r => r.rating >= 4)
      .sort((a, b) => b.ai_score - a.ai_score)
      .slice(0, limit);
  };

  const getReviewsByEffectiveness = (effectiveness: 'high' | 'medium' | 'low') => {
    return reviews.filter(r => r.effectiveness_rating === effectiveness);
  };

  const getPendingResponses = () => {
    return reviews.filter(r => r.response_status === 'pending');
  };

  const refreshReviews = async () => {
    await fetchReviews();
  };

  // Auto-fetch reviews when clientId is available
  useEffect(() => {
    if (clientId && ready && session) {
      fetchReviews();
    }
  }, [clientId, ready, session]);

  return {
    reviews,
    metrics,
    isLoading,
    error,
    fetchReviews,
    refreshReviews,
    getTopReviews,
    getReviewsByEffectiveness,
    getPendingResponses
  };
};