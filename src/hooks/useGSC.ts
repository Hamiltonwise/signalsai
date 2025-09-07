import { useContext } from "react";
import { GSCContext } from "../contexts/gscContext";

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

export interface GSCContextType {
  // GSC Data State
  gscData: GSCData;
  isLoading: boolean;
  error: string | null;

  // AI Data State
  aiDataLoading: boolean;
  aiData: unknown;
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
