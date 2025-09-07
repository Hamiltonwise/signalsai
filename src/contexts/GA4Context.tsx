import React, { useState, useEffect, type ReactNode } from "react";
import ga4 from "../api/ga4";
import type { GA4Data, GA4Property, GA4ContextType } from "./ga4Context";
import { GA4Context } from "./ga4Context";
import { useAuth } from "../hooks/useAuth";

interface GA4ProviderProps {
  children: ReactNode;
}

export const GA4Provider: React.FC<GA4ProviderProps> = ({ children }) => {
  const [ga4Data, setGA4Data] = useState<GA4Data>({
    activeUsers: { prevMonth: 0, currMonth: 0 },
    engagementRate: { prevMonth: 0, currMonth: 0 },
    conversions: { prevMonth: 0, currMonth: 0 },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Properties state
  const [properties, setProperties] = useState<GA4Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);

  // Get domain/sites state from AuthContext
  const { selectedDomain } = useAuth();

  const fetchGA4Data = async (propertyId?: string) => {
    const propertyIdToUse = propertyId || selectedDomain?.ga4_propertyId;
    if (!propertyIdToUse) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await ga4.getKeyDataByPropertyId(propertyIdToUse);

      if (result.successful !== false) {
        setGA4Data({
          activeUsers: result.activeUsers || { prevMonth: 0, currMonth: 0 },
          engagementRate: result.engagementRate || {
            prevMonth: 0,
            currMonth: 0,
          },
          conversions: result.conversions || { prevMonth: 0, currMonth: 0 },
        });
      } else {
        setError(result.errorMessage || "Failed to fetch GA4 data");
      }
    } catch (error) {
      setError("Failed to fetch GA4 data");
      console.error("GA4 Data fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      setPropertiesLoading(true);
      setPropertiesError(null);
      const result = await ga4.getProperties();

      if (result.successful !== false && Array.isArray(result)) {
        // Convert simple property IDs to property objects for basic usage
        const propertyObjects = result.map((propertyId: string) => ({
          propertyId,
          displayName: propertyId,
          timeZone: "Unknown",
          currencyCode: "USD",
          accountId: "Unknown",
          accountDisplayName: "Unknown",
        }));
        setProperties(propertyObjects);
      } else {
        setPropertiesError(
          result.errorMessage || "Failed to fetch GA4 properties"
        );
      }
    } catch (error) {
      setPropertiesError("Failed to fetch GA4 properties");
      console.error("GA4 Properties fetch error:", error);
    } finally {
      setPropertiesLoading(false);
    }
  };

  const fetchPropertiesDetails = async () => {
    try {
      setPropertiesLoading(true);
      setPropertiesError(null);
      const result = await ga4.getPropertiesDetails();

      if (
        result.successful !== false &&
        result.properties &&
        Array.isArray(result.properties)
      ) {
        setProperties(result.properties);
      } else {
        setPropertiesError(
          result.errorMessage || "Failed to fetch GA4 property details"
        );
      }
    } catch (error) {
      setPropertiesError("Failed to fetch GA4 property details");
      console.error("GA4 Property details fetch error:", error);
    } finally {
      setPropertiesLoading(false);
    }
  };

  // Auto-fetch GA4 data when domain changes
  useEffect(() => {
    if (selectedDomain?.ga4_propertyId) {
      fetchGA4Data();
    }
  }, [selectedDomain]);

  const contextValue: GA4ContextType = {
    ga4Data,
    isLoading,
    error,
    properties,
    propertiesLoading,
    propertiesError,
    fetchGA4Data,
    fetchProperties,
    fetchPropertiesDetails,
  };

  return (
    <GA4Context.Provider value={contextValue}>{children}</GA4Context.Provider>
  );
};
