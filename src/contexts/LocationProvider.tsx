import { useState, useEffect, useCallback, type ReactNode } from "react";
import { LocationContext } from "./locationContext";
import { getLocations, type Location } from "../api/locations";
import { useAuth } from "../hooks/useAuth";

interface LocationProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "selectedLocationId";

export function LocationProvider({ children }: LocationProviderProps) {
  const { userProfile, onboardingCompleted } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocationState] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLocations = useCallback(async () => {
    try {
      setIsLoading(true);
      const locs = await getLocations();
      setLocations(locs);

      // Restore previously selected location from localStorage
      const savedId = localStorage.getItem(STORAGE_KEY);
      const saved = savedId ? locs.find((l) => l.id === Number(savedId)) : null;

      // Default to primary location, then first location
      const primary = locs.find((l) => l.is_primary);
      setSelectedLocationState(saved || primary || locs[0] || null);
    } catch (error) {
      console.error("[LocationProvider] Failed to load locations:", error);
      setLocations([]);
      setSelectedLocationState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userProfile?.organizationId && onboardingCompleted) {
      loadLocations();
    } else {
      setIsLoading(false);
    }
  }, [userProfile?.organizationId, onboardingCompleted, loadLocations]);

  function setSelectedLocation(location: Location) {
    setSelectedLocationState(location);
    localStorage.setItem(STORAGE_KEY, String(location.id));
  }

  const refreshLocations = useCallback(async () => {
    await loadLocations();
  }, [loadLocations]);

  return (
    <LocationContext.Provider
      value={{
        locations,
        selectedLocation,
        setSelectedLocation,
        isLoading,
        refreshLocations,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}
