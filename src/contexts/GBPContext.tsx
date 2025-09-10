import React, { useState, useEffect, type ReactNode } from "react";
import gbp from "../api/gbp";
import type {
  GBPData,
  GBPContextType,
  GBPAccount,
  GBPLocation,
  GBPAIReadyData,
} from "../hooks/useGBP";
import { GBPContext } from "./GBPContext";
import { useAuth } from "../hooks/useAuth";

interface GBPProviderProps {
  children: ReactNode;
}

export const GBPProvider: React.FC<GBPProviderProps> = ({ children }) => {
  const [gbpData, setGBPData] = useState<GBPData>({
    newReviews: { prevMonth: 0, currMonth: 0 },
    avgRating: { prevMonth: 0, currMonth: 0 },
    callClicks: { prevMonth: 0, currMonth: 0 },
    trendScore: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Data State
  const [aiDataLoading, setAiDataLoading] = useState(false);
  const [aiData, setAiData] = useState<GBPAIReadyData | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Accounts state
  const [accounts, setAccounts] = useState<GBPAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  // Locations state
  const [locations, setLocations] = useState<GBPLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);

  // Get domain/sites state from AuthContext
  const { selectedDomain } = useAuth();

  const fetchAIReadyData = async (
    accountId: string,
    locationId: string,
    startDate?: string,
    endDate?: string
  ) => {
    try {
      setAiDataLoading(true);
      setAiError(null);
      const result = await gbp.getAIReadyData(
        accountId,
        locationId,
        startDate,
        endDate
      );

      if (result.successful !== false) {
        setAiData(result as GBPAIReadyData);
        console.log("GBP AI Ready Data:", result);
      } else {
        setAiError(result.errorMessage || "Failed to fetch GBP AI-ready data");
      }
    } catch (error) {
      setAiError("Failed to fetch GBP AI-ready data");
      console.error("GBP AI Ready Data fetch error:", error);
    } finally {
      setAiDataLoading(false);
    }
  };

  const fetchGBPData = async (accountId: string, locationId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await gbp.getKeyData(accountId, locationId);

      if (result.successful !== false) {
        setGBPData({
          newReviews: result.newReviews || { prevMonth: 0, currMonth: 0 },
          avgRating: result.avgRating || { prevMonth: 0, currMonth: 0 },
          callClicks: result.callClicks || { prevMonth: 0, currMonth: 0 },
          trendScore: result.trendScore || 0,
        });
      } else {
        setError(result.errorMessage || "Failed to fetch GBP data");
      }
    } catch (error) {
      setError("Failed to fetch GBP data");
      console.error("GBP Data fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      setAccountsLoading(true);
      setAccountsError(null);
      const result = await gbp.getAccounts();

      if (result.successful !== false && Array.isArray(result)) {
        setAccounts(result);
      } else {
        setAccountsError(result.errorMessage || "Failed to fetch GBP accounts");
      }
    } catch (error) {
      setAccountsError("Failed to fetch GBP accounts");
      console.error("GBP Accounts fetch error:", error);
    } finally {
      setAccountsLoading(false);
    }
  };

  const fetchLocations = async (accountName?: string) => {
    try {
      setLocationsLoading(true);
      setLocationsError(null);
      const result = await gbp.getLocations(accountName);

      if (result.successful !== false && Array.isArray(result)) {
        setLocations(result);
      } else {
        setLocationsError(
          result.errorMessage || "Failed to fetch GBP locations"
        );
      }
    } catch (error) {
      setLocationsError("Failed to fetch GBP locations");
      console.error("GBP Locations fetch error:", error);
    } finally {
      setLocationsLoading(false);
    }
  };

  // Auto-fetch GBP data when domain changes
  useEffect(() => {
    if (selectedDomain?.gbp_accountId && selectedDomain?.gbp_locationId) {
      fetchGBPData(selectedDomain.gbp_accountId, selectedDomain.gbp_locationId);
    }
  }, [selectedDomain]);

  const contextValue: GBPContextType = {
    gbpData,
    isLoading,
    error,
    aiDataLoading,
    aiData,
    aiError,
    accounts,
    accountsLoading,
    accountsError,
    locations,
    locationsLoading,
    locationsError,
    fetchGBPData,
    fetchAIReadyData,
    fetchAccounts,
    fetchLocations,
  };

  return (
    <GBPContext.Provider value={contextValue}>{children}</GBPContext.Provider>
  );
};
