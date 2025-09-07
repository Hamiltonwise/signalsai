import React, { useState, useEffect, type ReactNode } from "react";
import gsc from "../api/gsc";
import type { GSCData, GSCContextType } from "../hooks/useGSC";
import { GSCContext } from "./GSCContext";
import { useAuth } from "../hooks/useAuth";

interface GSCProviderProps {
  children: ReactNode;
}

export const GSCProvider: React.FC<GSCProviderProps> = ({ children }) => {
  const [gscData, setGscData] = useState<GSCData>({
    avgPosition: { prevMonth: 0, currMonth: 0 },
    clicks: { prevMonth: 0, currMonth: 0 },
    impressions: { prevMonth: 0, currMonth: 0 },
    trendScore: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiDataLoading, setAiDataLoading] = useState(false);
  const [aiData, setAiData] = useState<unknown>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Get domain/sites state from AuthContext
  const { selectedDomain } = useAuth();

  const fetchAIReadyGscData = async () => {
    if (!selectedDomain?.gsc_domainkey) return;

    try {
      setAiDataLoading(true);
      setAiError(null);
      const result = await gsc.getAIReadyData(selectedDomain.gsc_domainkey);

      if (result.successful !== false) {
        setAiData(result);
        console.log("AI Ready Data:", result);
      } else {
        setAiError(result.errorMessage || "Failed to fetch AI-ready data");
      }
    } catch (error) {
      setAiError("Failed to fetch AI-ready data");
      console.error("AI Ready Data fetch error:", error);
    } finally {
      setAiDataLoading(false);
    }
  };

  const fetchGscData = async () => {
    if (!selectedDomain?.gsc_domainkey) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await gsc.getKeyDataByDomainProperty(
        selectedDomain.gsc_domainkey
      );

      if (result.successful !== false) {
        setGscData({
          avgPosition: result.avgPosition || { prevMonth: 0, currMonth: 0 },
          clicks: result.clicks || { prevMonth: 0, currMonth: 0 },
          impressions: result.impressions || { prevMonth: 0, currMonth: 0 },
          trendScore: result.trendScore || 0,
        });
      } else {
        setError(result.errorMessage || "Failed to fetch GSC data");
      }
    } catch (error) {
      setError("Failed to fetch GSC data");
      console.error("GSC Data fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch GSC data when domain changes
  useEffect(() => {
    if (selectedDomain?.gsc_domainkey) {
      fetchGscData();
    }
  }, [selectedDomain]);

  const contextValue: GSCContextType = {
    gscData,
    isLoading,
    error,
    aiDataLoading,
    aiData,
    aiError,
    fetchGscData,
    fetchAIReadyGscData,
  };

  return (
    <GSCContext.Provider value={contextValue}>{children}</GSCContext.Provider>
  );
};
