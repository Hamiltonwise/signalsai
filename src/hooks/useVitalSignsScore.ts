import { useState, useEffect } from 'react';

interface VitalSignsData {
  score: number;
  grade: string;
  monthlyChange: number;
  breakdown: {
    ga4Score: number;
    gbpScore: number;
    gscScore: number;
    clarityScore: number;
    pmsScore: number;
  };
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

interface MetricData {
  ga4?: {
    totalUsers: number;
    engagementRate: number;
    conversions: number;
    calculatedScore: number;
  };
  gbp?: {
    totalViews: number;
    phoneCallsTotal: number;
    averageRating: number;
    calculatedScore: number;
  };
  gsc?: {
    totalClicks: number;
    averageCTR: number;
    averagePosition: number;
    calculatedScore: number;
  };
  clarity?: {
    bounceRate: number;
    deadClicks: number;
    calculatedScore: number;
  };
  pms?: {
    totalPatients: number;
    trend: string;
    calculatedScore: number;
  };
}

export const useVitalSignsScore = (clientId: string) => {
  const [vitalSignsData, setVitalSignsData] = useState<VitalSignsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateVitalSignsScore = (metrics: MetricData): VitalSignsData => {
    // Weight distribution for each platform (total = 100%)
    const weights = {
      ga4: 0.25,    // 25% - Website performance
      gbp: 0.25,    // 25% - Local presence
      gsc: 0.20,    // 20% - Search visibility
      clarity: 0.15, // 15% - User experience
      pms: 0.15     // 15% - Practice growth
    };

    // Calculate individual scores (0-100 scale)
    const ga4Score = metrics.ga4?.calculatedScore || calculateGA4Score(metrics.ga4);
    const gbpScore = metrics.gbp?.calculatedScore || calculateGBPScore(metrics.gbp);
    const gscScore = metrics.gsc?.calculatedScore || calculateGSCScore(metrics.gsc);
    const clarityScore = metrics.clarity?.calculatedScore || calculateClarityScore(metrics.clarity);
    const pmsScore = metrics.pms?.calculatedScore || calculatePMSScore(metrics.pms);

    // Calculate weighted overall score
    const overallScore = Math.round(
      (ga4Score * weights.ga4) +
      (gbpScore * weights.gbp) +
      (gscScore * weights.gsc) +
      (clarityScore * weights.clarity) +
      (pmsScore * weights.pms)
    );

    // Calculate grade based on score
    const grade = getGradeFromScore(overallScore);

    // Get previous month's score for comparison
    const previousScore = getPreviousMonthScore(clientId);
    const monthlyChange = overallScore - previousScore;
    
    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (monthlyChange > 2) trend = 'up';
    else if (monthlyChange < -2) trend = 'down';

    // Store current score for next month's comparison
    storePreviousMonthScore(clientId, overallScore);

    return {
      score: overallScore,
      grade,
      monthlyChange,
      breakdown: {
        ga4Score,
        gbpScore,
        gscScore,
        clarityScore,
        pmsScore
      },
      trend,
      lastUpdated: new Date().toISOString()
    };
  };

  // GA4 Score Calculation (0-100)
  const calculateGA4Score = (ga4?: MetricData['ga4']): number => {
    if (!ga4) return 50; // Default score if no data

    let score = 0;
    
    // Users score (0-25 points)
    const usersScore = Math.min((ga4.totalUsers / 1000) * 25, 25);
    score += usersScore;

    // Engagement rate (0-35 points)
    const engagementScore = Math.min(ga4.engagementRate * 35, 35);
    score += engagementScore;

    // Conversions (0-40 points)
    const conversionScore = Math.min((ga4.conversions / 50) * 40, 40);
    score += conversionScore;

    return Math.round(Math.min(score, 100));
  };

  // GBP Score Calculation (0-100)
  const calculateGBPScore = (gbp?: MetricData['gbp']): number => {
    if (!gbp) return 50; // Default score if no data

    let score = 0;

    // Views score (0-30 points)
    const viewsScore = Math.min((gbp.totalViews / 1000) * 30, 30);
    score += viewsScore;

    // Phone calls (0-35 points)
    const callsScore = Math.min((gbp.phoneCallsTotal / 100) * 35, 35);
    score += callsScore;

    // Rating score (0-35 points)
    const ratingScore = (gbp.averageRating / 5) * 35;
    score += ratingScore;

    return Math.round(Math.min(score, 100));
  };

  // GSC Score Calculation (0-100)
  const calculateGSCScore = (gsc?: MetricData['gsc']): number => {
    if (!gsc) return 50; // Default score if no data

    let score = 0;

    // Clicks score (0-40 points)
    const clicksScore = Math.min((gsc.totalClicks / 500) * 40, 40);
    score += clicksScore;

    // CTR score (0-30 points)
    const ctrScore = Math.min(gsc.averageCTR * 100 * 0.3, 30);
    score += ctrScore;

    // Position score (0-30 points) - lower position is better
    const positionScore = Math.max(30 - ((gsc.averagePosition - 1) * 3), 0);
    score += positionScore;

    return Math.round(Math.min(score, 100));
  };

  // Clarity Score Calculation (0-100)
  const calculateClarityScore = (clarity?: MetricData['clarity']): number => {
    if (!clarity) return 50; // Default score if no data

    let score = 100; // Start with perfect score and deduct

    // Bounce rate penalty (0-40 points deduction)
    const bounceRatePenalty = clarity.bounceRate * 40;
    score -= bounceRatePenalty;

    // Dead clicks penalty (0-30 points deduction)
    const deadClicksPenalty = Math.min((clarity.deadClicks / 50) * 30, 30);
    score -= deadClicksPenalty;

    return Math.round(Math.max(score, 0));
  };

  // PMS Score Calculation (0-100)
  const calculatePMSScore = (pms?: MetricData['pms']): number => {
    if (!pms) return 50; // Default score if no data

    let score = 50; // Base score

    // Patient volume (0-40 points)
    const volumeScore = Math.min((pms.totalPatients / 200) * 40, 40);
    score += volumeScore;

    // Growth trend bonus/penalty (0-10 points)
    if (pms.trend === 'up') score += 10;
    else if (pms.trend === 'down') score -= 10;

    return Math.round(Math.min(Math.max(score, 0), 100));
  };

  // Convert score to letter grade
  const getGradeFromScore = (score: number): string => {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 67) return 'D+';
    if (score >= 65) return 'D';
    return 'F';
  };

  // Get previous month's score from localStorage
  const getPreviousMonthScore = (clientId: string): number => {
    const key = `vital_signs_score_${clientId}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored) : 80; // Default previous score
  };

  // Store current score for next month's comparison
  const storePreviousMonthScore = (clientId: string, score: number): void => {
    const key = `vital_signs_score_${clientId}`;
    localStorage.setItem(key, score.toString());
  };

  // Fetch all metrics and calculate score
  const fetchVitalSignsScore = async (metrics: MetricData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Calculate the vital signs score from provided metrics
      const vitalSigns = calculateVitalSignsScore(metrics);
      setVitalSignsData(vitalSigns);

      return vitalSigns;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate vital signs score');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update score when metrics change
  const updateScore = (metrics: MetricData) => {
    const vitalSigns = calculateVitalSignsScore(metrics);
    setVitalSignsData(vitalSigns);
  };

  return {
    vitalSignsData,
    isLoading,
    error,
    fetchVitalSignsScore,
    updateScore
  };
};