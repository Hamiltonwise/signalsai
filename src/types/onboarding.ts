// Property types for each Google service
export interface GA4Property {
  propertyId: string;
  displayName: string;
  accountName?: string;
}

export interface GSCSite {
  siteUrl: string;
  displayName: string;
  permissionLevel?: string;
}

export interface GBPLocation {
  accountId: string;
  locationId: string;
  displayName: string;
  storeCode?: string | null;
  fullName?: string;
}

// User profile information
export interface ProfileInfo {
  firstName: string;
  lastName: string;
  practiceName: string;
  domainName: string;
}

// Available properties response from API
export interface AvailableProperties {
  ga4: GA4Property[];
  gsc: GSCSite[];
  gbp: GBPLocation[];
}

// Saved property selections (stored in database)
export interface PropertySelections {
  profile: ProfileInfo;
  ga4: {
    propertyId: string;
    displayName: string;
  } | null;
  gsc: {
    siteUrl: string;
    displayName: string;
  } | null;
  gbp: Array<{
    accountId: string;
    locationId: string;
    displayName: string;
  }>;
}

// Onboarding status response
export interface OnboardingStatus {
  success: boolean;
  onboardingCompleted: boolean;
  hasPropertyIds: boolean;
  propertyIds: PropertySelections | null;
}

// Onboarding step information
export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  serviceName: "ga4" | "gsc" | "gbp";
  icon?: string;
}

// Onboarding context type
export interface OnboardingContextType {
  currentStep: number;
  totalSteps: number;
  availableProperties: AvailableProperties | null;
  selections: PropertySelections;
  isLoading: boolean;
  error: string | null;

  // Profile setters
  firstName: string;
  lastName: string;
  practiceName: string;
  domainName: string;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setPracticeName: (value: string) => void;
  setDomainName: (value: string) => void;

  // Actions
  fetchAvailableProperties: () => Promise<void>;
  selectGA4Property: (property: GA4Property | null) => void;
  selectGSCSite: (site: GSCSite | null) => void;
  selectGBPLocations: (locations: GBPLocation[]) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipStep: () => void;
  completeOnboarding: () => Promise<boolean>;
  resetOnboarding: () => void;
}
