import express from 'express';
import { supabase } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * Store Google Business Profile metrics
 */
router.post('/metrics', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;
    const { metrics } = req.body;

    if (!metrics || !Array.isArray(metrics)) {
      return res.status(400).json({
        error: 'Metrics array is required'
      });
    }

    // Add client_id to each metric and calculate scores
    const processedMetrics = metrics.map(metric => ({
      ...metric,
      client_id: clientId,
      calculated_score: calculateGBPScore(metric),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Upsert metrics (handle duplicates by date and location)
    const { data, error } = await supabase
      .from('gbp_metrics')
      .upsert(processedMetrics, {
        onConflict: 'client_id,date,location_name'
      })
      .select();

    if (error) {
      throw new Error(`Failed to store GBP metrics: ${error.message}`);
    }

    res.json({
      success: true,
      data,
      message: `Stored ${data.length} GBP metrics successfully`
    });
  } catch (error) {
    console.error('Error storing GBP metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Google Business Profile metrics for a client
 */
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;
    const { startDate, endDate, location } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate query parameters are required'
      });
    }

    let query = supabase
      .from('gbp_metrics')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (location) {
      query = query.eq('location_name', location);
    }

    const { data: metrics, error } = await query;

    if (error) {
      throw new Error(`Failed to retrieve GBP metrics: ${error.message}`);
    }

    // Calculate aggregated metrics
    const aggregatedMetrics = calculateAggregatedGBPMetrics(metrics || []);

    res.json({
      success: true,
      data: aggregatedMetrics,
      rawData: metrics
    });
  } catch (error) {
    console.error('Error retrieving GBP metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get GBP locations for a client
 */
router.get('/locations', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;

    const { data, error } = await supabase
      .from('gbp_metrics')
      .select('location_name')
      .eq('client_id', clientId)
      .not('location_name', 'is', null);

    if (error) {
      throw new Error(`Failed to retrieve locations: ${error.message}`);
    }

    // Get unique locations
    const locations = [...new Set(data.map(item => item.location_name))];

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Error retrieving GBP locations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Calculate GBP performance score
 */
function calculateGBPScore(metrics: any): number {
  let score = 0;

  // Views score (0-25 points)
  const totalViews = metrics.total_views || 0;
  score += Math.min(totalViews / 100 * 25, 25);

  // Engagement score (0-30 points)
  const engagementActions = (metrics.phone_calls || 0) + 
                           (metrics.website_clicks || 0) + 
                           (metrics.direction_requests || 0);
  score += Math.min(engagementActions / 50 * 30, 30);

  // Reviews score (0-25 points)
  const avgRating = metrics.average_rating || 0;
  const reviewCount = metrics.total_reviews || 0;
  const reviewScore = (avgRating / 5 * 15) + Math.min(reviewCount / 20 * 10, 10);
  score += reviewScore;

  // Content score (0-20 points)
  const contentScore = Math.min((metrics.total_photos || 0) / 10 * 10, 10) +
                      Math.min((metrics.posts_created || 0) * 5, 10);
  score += contentScore;

  return Math.round(Math.min(score, 100));
}

/**
 * Calculate aggregated GBP metrics for dashboard display
 */
function calculateAggregatedGBPMetrics(metrics: any[]) {
  if (metrics.length === 0) {
    return {
      totalViews: 0,
      phoneCallsTotal: 0,
      websiteClicksTotal: 0,
      directionRequestsTotal: 0,
      averageRating: 0,
      totalReviews: 0,
      newReviews: 0,
      calculatedScore: 0,
      trend: 'stable',
      changePercent: '0'
    };
  }

  const totals = metrics.reduce((acc, metric) => ({
    totalViews: acc.totalViews + (metric.total_views || 0),
    phoneCallsTotal: acc.phoneCallsTotal + (metric.phone_calls || 0),
    websiteClicksTotal: acc.websiteClicksTotal + (metric.website_clicks || 0),
    directionRequestsTotal: acc.directionRequestsTotal + (metric.direction_requests || 0),
    totalReviews: Math.max(acc.totalReviews, metric.total_reviews || 0),
    newReviews: acc.newReviews + (metric.new_reviews || 0),
    ratingSum: acc.ratingSum + (metric.average_rating || 0),
    calculatedScore: acc.calculatedScore + (metric.calculated_score || 0)
  }), {
    totalViews: 0,
    phoneCallsTotal: 0,
    websiteClicksTotal: 0,
    directionRequestsTotal: 0,
    totalReviews: 0,
    newReviews: 0,
    ratingSum: 0,
    calculatedScore: 0
  });

  const count = metrics.length;
  
  // Calculate trend (compare first half vs second half of period)
  // This is a simplified trend calculation. For more accuracy, consider comparing full periods.
  const midPoint = Math.floor(count / 2);
  const firstHalf = metrics.slice(0, midPoint);
  const secondHalf = metrics.slice(midPoint);
  
  const firstHalfAvg = firstHalf.reduce((sum, m) => sum + (m.total_views || 0), 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, m) => sum + (m.total_views || 0), 0) / secondHalf.length;
  
  let trend = 'stable';
  const changePercent = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
  
  if (changePercent > 5) trend = 'up';
  else if (changePercent < -5) trend = 'down';

  return {
    totalViews: totals.totalViews,
    phoneCallsTotal: totals.phoneCallsTotal,
    websiteClicksTotal: totals.websiteClicksTotal,
    directionRequestsTotal: totals.directionRequestsTotal,
    averageRating: totals.ratingSum / count,
    totalReviews: totals.totalReviews,
    newReviews: totals.newReviews,
    calculatedScore: Math.round(totals.calculatedScore / count),
    trend,
    changePercent: Math.abs(changePercent).toFixed(1)
  };
}

export default router;