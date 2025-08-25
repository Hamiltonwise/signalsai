import express from 'express';
import { GA4Service } from '../services/ga4Service';

const router = express.Router();
const ga4Service = new GA4Service();

/**
 * Fetch GA4 data for a client
 */
router.post('/fetch-data', async (req, res) => {
  try {
    const { clientId, propertyId, startDate, endDate } = req.body;

    if (!clientId || !propertyId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: clientId, propertyId, startDate, endDate' 
      });
    }

    const result = await ga4Service.fetchGA4Data(clientId, propertyId, startDate, endDate);
    res.json(result);
  } catch (error) {
    console.error('Error fetching GA4 data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get stored GA4 metrics for a client
 */
router.get('/metrics/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required query parameters: startDate, endDate' 
      });
    }

    const metrics = await ga4Service.getGA4Metrics(
      clientId, 
      startDate as string, 
      endDate as string
    );

    // Calculate aggregated metrics for the dashboard
    const aggregatedMetrics = calculateAggregatedMetrics(metrics);
    
    res.json({
      success: true,
      data: aggregatedMetrics,
      rawData: metrics
    });
  } catch (error) {
    console.error('Error retrieving GA4 metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Calculate aggregated metrics for dashboard display
 */
function calculateAggregatedMetrics(metrics: any[]) {
  if (metrics.length === 0) {
    return {
      totalUsers: 0,
      newUsers: 0,
      engagementRate: 0,
      conversions: 0,
      avgSessionDuration: 0,
      calculatedScore: 0,
      trend: 'stable'
    };
  }

  const totals = metrics.reduce((acc, metric) => ({
    totalUsers: acc.totalUsers + metric.total_users,
    newUsers: acc.newUsers + metric.new_users,
    sessions: acc.sessions + metric.sessions,
    conversions: acc.conversions + metric.conversions,
    engagementRate: acc.engagementRate + metric.engagement_rate,
    avgSessionDuration: acc.avgSessionDuration + metric.avg_session_duration,
    calculatedScore: acc.calculatedScore + metric.calculated_score
  }), {
    totalUsers: 0,
    newUsers: 0,
    sessions: 0,
    conversions: 0,
    engagementRate: 0,
    avgSessionDuration: 0,
    calculatedScore: 0
  });

  const count = metrics.length;
  
  // Calculate trend (compare first half vs second half of period)
  const midPoint = Math.floor(count / 2);
  const firstHalf = metrics.slice(0, midPoint);
  const secondHalf = metrics.slice(midPoint);
  
  const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.total_users, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.total_users, 0) / secondHalf.length;
  
  let trend = 'stable';
  const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
  
  if (changePercent > 5) trend = 'up';
  else if (changePercent < -5) trend = 'down';

  return {
    totalUsers: totals.totalUsers,
    newUsers: totals.newUsers,
    engagementRate: (totals.engagementRate / count) * 100, // Convert to percentage
    conversions: totals.conversions,
    avgSessionDuration: totals.avgSessionDuration / count,
    calculatedScore: Math.round(totals.calculatedScore / count),
    trend,
    changePercent: Math.abs(changePercent).toFixed(1)
  };
}

export default router;