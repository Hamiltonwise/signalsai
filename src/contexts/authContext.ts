import { createContext } from "react";

// Domain mapping structure - maps display domains to integration identifiers
export interface DomainMapping {
  domain: string;
  displayName: string;
  gsc_domainkey: string;
  ga4_propertyId: string;
  // GBP integration properties
  gbp_accountId?: string;
  gbp_locationId?: string;
  // Future integrations can be added here:
  // clarity_siteId?: string;
}

// User profile information
export interface UserProfile {
  firstName: string | null;
  lastName: string | null;
  practiceName: string | null;
  domainName: string | null;
}

export interface AuthContextType {
  // Domain State
  domains: DomainMapping[];
  selectedDomain: DomainMapping | null;
  isLoadingUserProperties: boolean;

  // Profile State
  userProfile: UserProfile | null;

  // Functions
  handleDomainChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  setSelectedDomain: (domain: DomainMapping | null) => void;
  refreshUserProperties: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
