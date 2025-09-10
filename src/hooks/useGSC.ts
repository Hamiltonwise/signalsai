import { useContext } from "react";
import { GSCContext } from "../contexts/GSCContext";

export interface GSCData {
  avgPosition: {
    prevMonth: number;
    currMonth: number;
  };
  clicks: {
    prevMonth: number;
    currMonth: number;
  };
  impressions: {
    prevMonth: number;
    currMonth: number;
  };
  trendScore: number;
}

export interface GSCAIReadyData {
  overview: {
    totalClicks: number;
    totalImpressions: number;
    avgCTR: number;
    avgPosition: number;
    dateRange: { startDate: string; endDate: string };
  };
  topQueries: Array<{
    keys: Array<string>;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  underperformingPages: Array<{
    keys: Array<string>;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  deviceBreakdown: {
    desktop: {
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    };
    mobile: {
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    };
    tablet: {
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    };
  };
  geoPerformance: Array<{
    keys: Array<string>;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  opportunities: Array<{
    type: string;
    [key: string]: unknown;
  }>;
}

export interface GSCContextType {
  // GSC Data State
  gscData: GSCData;
  isLoading: boolean;
  error: string | null;

  // AI Data State
  aiDataLoading: boolean;
  aiData: GSCAIReadyData | null;
  aiError: string | null;

  // Functions
  fetchGscData: () => Promise<void>;
  fetchAIReadyGscData: () => Promise<void>;
}

export const useGSC = () => {
  const context = useContext(GSCContext);
  if (context === undefined) {
    throw new Error("useGSC must be used within a GSCProvider");
  }
  return context;
};
