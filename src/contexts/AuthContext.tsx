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
    domain: "popupsmiles.com",
    displayName: "PopUp Smiles",
    gsc_domainkey: "sc-domain:popupsmiles.com",
    ga4_propertyId: "properties/493224130",
  },
  {
    domain: "hamiltonwise.com",
    displayName: "HamiltonWise & Associates",
    gsc_domainkey: "sc-domain:hamiltonwise.com",
    ga4_propertyId: "properties/348149125",
  },
  // Add more domain mappings as needed
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
