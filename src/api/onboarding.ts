import { apiGet, apiPost, apiPut } from "./index";

const baseurl = "/onboarding";

/**
 * Check if user has completed onboarding
 */
async function getOnboardingStatus() {
  try {
    return await apiGet({
      path: baseurl + `/status`,
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

/**
 * Fetch all available properties (GA4, GSC, GBP) for the authenticated user
 */
async function getAvailableProperties() {
  try {
    return await apiGet({
      path: baseurl + `/available-properties`,
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

/**
 * Save user's selected properties
 * @param properties Object containing ga4, gsc, and gbp selections
 */
async function saveProperties(data: {
  profile: {
    firstName: string;
    lastName: string;
    practiceName: string;
    domainName: string;
  };
}) {
  try {
    return await apiPost({
      path: baseurl + `/save-properties`,
      passedData: data,
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

/**
 * Check if user has completed the onboarding wizard (product tour)
 */
async function getWizardStatus() {
  try {
    return await apiGet({
      path: baseurl + `/wizard/status`,
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

/**
 * Mark the onboarding wizard as completed
 */
async function completeWizard() {
  try {
    return await apiPut({
      path: baseurl + `/wizard/complete`,
      passedData: {},
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

/**
 * Reset the onboarding wizard (for re-showing the tour)
 */
async function restartWizard() {
  try {
    return await apiPost({
      path: baseurl + `/wizard/restart`,
      passedData: {},
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

const onboarding = {
  getOnboardingStatus,
  getAvailableProperties,
  saveProperties,
  getWizardStatus,
  completeWizard,
  restartWizard,
};

export default onboarding;
