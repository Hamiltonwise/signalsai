import { createContext } from "react";

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

  // Properties State
  properties: GA4Property[];
  propertiesLoading: boolean;
  propertiesError: string | null;

  // Functions
  fetchGA4Data: (propertyId: string) => Promise<void>;
  fetchProperties: () => Promise<void>;
  fetchPropertiesDetails: () => Promise<void>;
}

export const GA4Context = createContext<GA4ContextType | undefined>(undefined);
