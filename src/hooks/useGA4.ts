import { useContext } from "react";
import { GA4Context } from "../contexts/ga4Context";

export interface GA4Data {
  activeUsers: {
    prevMonth: number;
    currMonth: number;
  };
  engagementRate: {
    prevMonth: number;
    currMonth: number;
  };
  conversions: {
    prevMonth: number;
    currMonth: number;
  };
  trendScore: number;
}

export interface GA4Property {
  propertyId: string;
  displayName: string;
  timeZone: string;
  currencyCode: string;
  accountId: string;
  accountDisplayName: string;
}

export interface GA4ContextType {
  // GA4 Data State
  ga4Data: GA4Data;
  isLoading: boolean;
  error: string | null;

  // AI Data State
  aiDataLoading: boolean;
  aiData: unknown;
  aiError: string | null;

  // Properties State
  properties: GA4Property[];
  propertiesLoading: boolean;
  propertiesError: string | null;

  // Functions
  fetchGA4Data: (propertyId: string) => Promise<void>;
  fetchAIReadyData: () => Promise<void>;
  fetchProperties: () => Promise<void>;
  fetchPropertiesDetails: () => Promise<void>;
}

export const useGA4 = () => {
  const context = useContext(GA4Context);
  if (context === undefined) {
    throw new Error("useGA4 must be used within a GA4Provider");
  }
  return context;
};
