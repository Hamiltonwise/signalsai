import { createContext } from "react";

// Domain mapping structure - maps display domains to integration identifiers
export interface DomainMapping {
  domain: string;
  displayName: string;
  gsc_domainkey: string;
  ga4_propertyId: string;
  // Future integrations can be added here:
  // clarity_siteId?: string;
  // gbp_locationId?: string;
}

export interface AuthContextType {
  // Domain State
  domains: DomainMapping[];
  selectedDomain: DomainMapping | null;

  // Functions
  handleDomainChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  setSelectedDomain: (domain: DomainMapping | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
