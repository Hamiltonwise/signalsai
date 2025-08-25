import express from 'express';
import { supabase } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * Store Microsoft Clarity metrics
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
      calculated_score: calculateClarityScore(metric),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Upsert metrics (handle duplicates by date)
    const { data, error } = await supabase
      .from('clarity_metrics')
      .upsert(processedMetrics, {
        onConflict: 'client_id,date'
      })
      .select();

    if (error) {
      throw new Error(`Failed to store Clarity metrics: ${error.message}`);
    }

    res.json({
      success: true,
      data,
      message: `Stored ${data.length} Clarity metrics successfully`
    });
  } catch (error) {
    console.error('Error storing Clarity metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Microsoft Clarity metrics for a client
 */
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate query parameters are required'
      });
    }

    const { data: metrics, error } = await supabase
      .from('clarity_metrics')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Failed to retrieve Clarity metrics: ${error.message}`);
    }

    // Calculate aggregated metrics
    const aggregatedMetrics = calculateAggregatedClarityMetrics(metrics || []);

    res.json({
      success: true,
      data: aggregatedMetrics,
      rawData: metrics
    });
  } catch (error) {
    console.error('Error retrieving Clarity metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user experience issues summary
 */
router.get('/ux-issues', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate query parameters are required'
      });
    }

    const { data: metrics, error } = await supabase
      .from('clarity_metrics')
      .select('dead_clicks, rage_clicks, quick_backs, excessive_scrolling, javascript_errors')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      throw new Error(`Failed to retrieve UX issues: ${error.message}`);
    }

    // Aggregate UX issues
    const issues = metrics.reduce((acc, metric) => ({
      deadClicks: acc.deadClicks + (metric.dead_clicks || 0),
      rageClicks: acc.rageClicks + (metric.rage_clicks || 0),
      quickBacks: acc.quickBacks + (metric.quick_backs || 0),
      excessiveScrolling: acc.excessiveScrolling + (metric.excessive_scrolling || 0),
      javascriptErrors: acc.javascriptErrors + (metric.javascript_errors || 0)
    }), {
      deadClicks: 0,
      rageClicks: 0,
      quickBacks: 0,
      excessiveScrolling: 0,
      javascriptErrors: 0
    });

    // Calculate severity scores
    const totalIssues = Object.values(issues).reduce((sum, count) => sum + count, 0);
    const severityScore = Math.max(100 - (totalIssues / 10), 0); // Lower is worse

    res.json({
      success: true,
      data: {
        ...issues,
        totalIssues,
        severityScore: Math.round(severityScore)
      }
    });
  } catch (error) {
    console.error('Error retrieving UX issues:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Calculate Clarity performance score
 */
function calculateClarityScore(metrics: any): number {
  let score = 100; // Start with perfect score and deduct for issues

  // Session quality (0-30 points deduction)
  const bounceRate = metrics.bounce_rate || 0;
  score -= bounceRate * 30; // High bounce rate reduces score

  // User experience issues (0-40 points deduction)
  const deadClicks = metrics.dead_clicks || 0;
  const rageClicks = metrics.rage_clicks || 0;
  const quickBacks = metrics.quick_backs || 0;
  
  const uxIssues = deadClicks + rageClicks + quickBacks;
  score -= Math.min(uxIssues * 2, 40); // Each issue reduces score

  // Technical issues (0-20 points deduction)
  const jsErrors = metrics.javascript_errors || 0;
  score -= Math.min(jsErrors * 5, 20);

  // Engagement bonus (0-10 points addition)
  const avgSessionDuration = metrics.avg_session_duration || 0;
  if (avgSessionDuration > 120) { // More than 2 minutes
    score += Math.min((avgSessionDuration - 120) / 60 * 5, 10);
  }

  return Math.round(Math.max(Math.min(score, 100), 0));
}

/**
 * Calculate aggregated Clarity metrics for dashboard display
 */
function calculateAggregatedClarityMetrics(metrics: any[]) {
  if (metrics.length === 0) {
    return {
      totalSessions: 0,
      uniqueUsers: 0,
      pageViews: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
      deadClicks: 0,
      rageClicks: 0,
      quickBacks: 0,
      calculatedScore: 0,
      trend: 'stable',
      changePercent: '0'
    };
  }

  const totals = metrics.reduce((acc, metric) => ({
    totalSessions: acc.totalSessions + (metric.total_sessions || 0),
    uniqueUsers: acc.uniqueUsers + (metric.unique_users || 0),
    pageViews: acc.pageViews + (metric.page_views || 0),
    avgSessionDuration: acc.avgSessionDuration + (metric.avg_session_duration || 0),
    bounceRate: acc.bounceRate + (metric.bounce_rate || 0),
    deadClicks: acc.deadClicks + (metric.dead_clicks || 0),
    rageClicks: acc.rageClicks + (metric.rage_clicks || 0),
    quickBacks: acc.quickBacks + (metric.quick_backs || 0),
    calculatedScore: acc.calculatedScore + (metric.calculated_score || 0)
  }), {
    totalSessions: 0,
    uniqueUsers: 0,
    pageViews: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
    deadClicks: 0,
    rageClicks: 0,
    quickBacks: 0,
    calculatedScore: 0
  });

  const count = metrics.length;
  
  // Calculate trend (compare first half vs second half of period)
  const midPoint = Math.floor(count / 2);
  const firstHalf = metrics.slice(0, midPoint);
  const secondHalf = metrics.slice(midPoint);
  
  const firstHalfSessions = firstHalf.reduce((sum, m) => sum + (m.total_sessions || 0), 0);
  const secondHalfSessions = secondHalf.reduce((sum, m) => sum + (m.total_sessions || 0), 0);
  
  let trend = 'stable';
  const changePercent = firstHalfSessions > 0 ? ((secondHalfSessions - firstHalfSessions) / firstHalfSessions) * 100 : 0;
  
  if (changePercent > 5) trend = 'up';
  else if (changePercent < -5) trend = 'down';

  return {
    totalSessions: totals.totalSessions,
    uniqueUsers: totals.uniqueUsers,
    pageViews: totals.pageViews,
    avgSessionDuration: totals.avgSessionDuration / count,
    bounceRate: (totals.bounceRate / count) * 100, // Convert to percentage
    deadClicks: totals.deadClicks,
    rageClicks: totals.rageClicks,
    quickBacks: totals.quickBacks,
    calculatedScore: Math.round(totals.calculatedScore / count),
    trend,
    changePercent: Math.abs(changePercent).toFixed(1)
  };
}

export default router;