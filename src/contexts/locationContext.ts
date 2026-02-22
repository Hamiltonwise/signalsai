import { createContext, useContext } from "react";
import type { Location } from "../api/locations";

export interface LocationContextType {
  locations: Location[];
  selectedLocation: Location | null;
  setSelectedLocation: (location: Location) => void;
  isLoading: boolean;
  refreshLocations: () => Promise<void>;
}

export const LocationContext = createContext<LocationContextType | null>(null);

/**
 * Hook to access the LocationContext.
 * Must be used inside a LocationProvider.
 * Named useLocationContext to avoid collision with react-router-dom's useLocation.
 */
export function useLocationContext(): LocationContextType {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocationContext must be used within a LocationProvider");
  }
  return context;
}
