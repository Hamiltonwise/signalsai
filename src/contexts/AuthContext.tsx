import React, { useState, type ReactNode } from "react";
import {
  AuthContext,
  type AuthContextType,
  type DomainMapping,
} from "./authContext";

interface AuthProviderProps {
  children: ReactNode;
}

// Domain mappings array - single source of truth for domain selection
const domainMappings: DomainMapping[] = [
  {
    domain: "artfulorthodontics.com",
    displayName: "Artful Orthodontics",
    gbp_accountId: "114810842911950437772",
    gbp_locationId: "10282052848626216313",
    gsc_domainkey: "sc-domain:artfulorthodontics.com",
    ga4_propertyId: "381278947",
  },
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [selectedDomain, setSelectedDomain] = useState<DomainMapping | null>(
    domainMappings.length > 0 ? domainMappings[0] : null
  );

  const handleDomainChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const domainValue = event.target.value;
    const mapping = domainMappings.find(
      (mapping) => mapping.domain === domainValue
    );
    setSelectedDomain(mapping || null);
  };

  const contextValue: AuthContextType = {
    domains: domainMappings,
    selectedDomain,
    handleDomainChange,
    setSelectedDomain,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
