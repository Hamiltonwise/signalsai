import express from 'express';
import { supabase } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * Store Google Search Console metrics
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
      calculated_score: calculateGSCScore(metric),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Insert metrics (GSC data can have multiple entries per date for different queries/pages)
    const { data, error } = await supabase
      .from('gsc_metrics')
      .insert(processedMetrics)
      .select();

    if (error) {
      throw new Error(`Failed to store GSC metrics: ${error.message}`);
    }

    res.json({
      success: true,
      data,
      message: `Stored ${data.length} GSC metrics successfully`
    });
  } catch (error) {
    console.error('Error storing GSC metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Google Search Console metrics for a client
 */
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;
    const { startDate, endDate, query, page, device = 'all' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate query parameters are required'
      });
    }

    let dbQuery = supabase
      .from('gsc_metrics')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (query) {
      dbQuery = dbQuery.ilike('query', `%${query}%`);
    }

    if (page) {
      dbQuery = dbQuery.ilike('page', `%${page}%`);
    }

    if (device !== 'all') {
      dbQuery = dbQuery.eq('device', device);
    }

    const { data: metrics, error } = await dbQuery;

    if (error) {
      throw new Error(`Failed to retrieve GSC metrics: ${error.message}`);
    }

    // Calculate aggregated metrics
    const aggregatedMetrics = calculateAggregatedGSCMetrics(metrics || []);

    res.json({
      success: true,
      data: aggregatedMetrics,
      rawData: metrics
    });
  } catch (error) {
    console.error('Error retrieving GSC metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get top performing queries
 */
router.get('/top-queries', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;
    const { startDate, endDate, limit = 10 } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate query parameters are required'
      });
    }

    const { data, error } = await supabase
      .from('gsc_metrics')
      .select('query, impressions, clicks, ctr, position')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .not('query', 'is', null)
      .order('clicks', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) {
      throw new Error(`Failed to retrieve top queries: ${error.message}`);
    }

    // Aggregate by query
    const queryMap = new Map();
    data.forEach(row => {
      if (queryMap.has(row.query)) {
        const existing = queryMap.get(row.query);
        existing.impressions += row.impressions;
        existing.clicks += row.clicks;
        existing.positions.push(row.position);
      } else {
        queryMap.set(row.query, {
          query: row.query,
          impressions: row.impressions,
          clicks: row.clicks,
          positions: [row.position]
        });
      }
    });

    // Calculate averages and format results
    const topQueries = Array.from(queryMap.values()).map(item => ({
      query: item.query,
      impressions: item.impressions,
      clicks: item.clicks,
      ctr: item.clicks / item.impressions,
      avgPosition: item.positions.reduce((sum, pos) => sum + pos, 0) / item.positions.length
    })).sort((a, b) => b.clicks - a.clicks);

    res.json({
      success: true,
      data: topQueries
    });
  } catch (error) {
    console.error('Error retrieving top queries:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get top performing pages
 */
router.get('/top-pages', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;
    const { startDate, endDate, limit = 10 } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate query parameters are required'
      });
    }

    const { data, error } = await supabase
      .from('gsc_metrics')
      .select('page, impressions, clicks, ctr, position')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .not('page', 'is', null)
      .order('clicks', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) {
      throw new Error(`Failed to retrieve top pages: ${error.message}`);
    }

    // Aggregate by page
    const pageMap = new Map();
    data.forEach(row => {
      if (pageMap.has(row.page)) {
        const existing = pageMap.get(row.page);
        existing.impressions += row.impressions;
        existing.clicks += row.clicks;
        existing.positions.push(row.position);
      } else {
        pageMap.set(row.page, {
          page: row.page,
          impressions: row.impressions,
          clicks: row.clicks,
          positions: [row.position]
        });
      }
    });

    // Calculate averages and format results
    const topPages = Array.from(pageMap.values()).map(item => ({
      page: item.page,
      impressions: item.impressions,
      clicks: item.clicks,
      ctr: item.clicks / item.impressions,
      avgPosition: item.positions.reduce((sum, pos) => sum + pos, 0) / item.positions.length
    })).sort((a, b) => b.clicks - a.clicks);

    res.json({
      success: true,
      data: topPages
    });
  } catch (error) {
    console.error('Error retrieving top pages:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Calculate GSC performance score
 */
function calculateGSCScore(metrics: any): number {
  let score = 0;

  // Impressions score (0-20 points)
  const impressions = metrics.impressions || 0;
  score += Math.min(impressions / 1000 * 20, 20);

  // Clicks score (0-30 points)
  const clicks = metrics.clicks || 0;
  score += Math.min(clicks / 100 * 30, 30);

  // CTR score (0-25 points)
  const ctr = metrics.ctr || 0;
  score += Math.min(ctr * 100 * 0.25, 25);

  // Position score (0-25 points) - lower position is better
  const position = metrics.position || 100;
  const positionScore = Math.max(25 - (position - 1) * 2.5, 0);
  score += positionScore;

  return Math.round(Math.min(score, 100));
}

/**
 * Calculate aggregated GSC metrics for dashboard display
 */
function calculateAggregatedGSCMetrics(metrics: any[]) {
  if (metrics.length === 0) {
    return {
      totalImpressions: 0,
      totalClicks: 0,
      averageCTR: 0,
      averagePosition: 0,
      totalQueries: 0,
      calculatedScore: 0,
      trend: 'stable',
      changePercent: '0'
    };
  }

  const totals = metrics.reduce((acc, metric) => ({
    totalImpressions: acc.totalImpressions + (metric.impressions || 0),
    totalClicks: acc.totalClicks + (metric.clicks || 0),
    ctrSum: acc.ctrSum + (metric.ctr || 0),
    positionSum: acc.positionSum + (metric.position || 0),
    calculatedScore: acc.calculatedScore + (metric.calculated_score || 0)
  }), {
    totalImpressions: 0,
    totalClicks: 0,
    ctrSum: 0,
    positionSum: 0,
    calculatedScore: 0
  });

  const count = metrics.length;
  const uniqueQueries = new Set(metrics.map(m => m.query).filter(Boolean)).size;
  
  // Calculate trend (compare first half vs second half of period)
  const midPoint = Math.floor(count / 2);
  const firstHalf = metrics.slice(0, midPoint);
  const secondHalf = metrics.slice(midPoint);
  
  const firstHalfClicks = firstHalf.reduce((sum, m) => sum + (m.clicks || 0), 0);
  const secondHalfClicks = secondHalf.reduce((sum, m) => sum + (m.clicks || 0), 0);
  
  let trend = 'stable';
  const changePercent = firstHalfClicks > 0 ? ((secondHalfClicks - firstHalfClicks) / firstHalfClicks) * 100 : 0;
  
  if (changePercent > 5) trend = 'up';
  else if (changePercent < -5) trend = 'down';

  return {
    totalImpressions: totals.totalImpressions,
    totalClicks: totals.totalClicks,
    averageCTR: (totals.ctrSum / count) * 100, // Convert to percentage
    averagePosition: totals.positionSum / count,
    totalQueries: uniqueQueries,
    calculatedScore: Math.round(totals.calculatedScore / count),
    trend,
    changePercent: Math.abs(changePercent).toFixed(1)
  };
}

export default router;