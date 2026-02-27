/**
 * Billing API Client
 *
 * Frontend functions for Stripe billing integration.
 * All calls go through the standard apiGet/apiPost helpers with JWT auth.
 */

import { apiGet, apiPost } from "./index";

// ─── Types ───

export interface BillingStatus {
  success: boolean;
  tier: string | null;
  subscriptionStatus: string;
  hasStripeSubscription: boolean;
  isAdminGranted: boolean;
  isLockedOut: boolean;
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
}

export interface CheckoutResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export interface PortalResponse {
  success: boolean;
  url?: string;
  error?: string;
}

// ─── API Functions ───

/**
 * Get the current billing/subscription status for the user's org.
 */
export async function getBillingStatus(): Promise<BillingStatus> {
  return apiGet({ path: "/billing/status" });
}

/**
 * Create a Stripe Checkout Session for subscribing to a plan.
 * Returns a URL to redirect the user to Stripe's hosted checkout page.
 *
 * @param tier - "DWY" or "DFY"
 * @param isOnboarding - true if called during the onboarding flow
 */
export async function createCheckoutSession(
  tier: "DWY" | "DFY",
  isOnboarding: boolean = false
): Promise<CheckoutResponse> {
  return apiPost({
    path: "/billing/checkout",
    passedData: { tier, isOnboarding },
  });
}

/**
 * Create a Stripe Customer Portal session for managing an existing subscription.
 * Returns a URL to redirect the user to Stripe's hosted portal.
 */
export async function createPortalSession(): Promise<PortalResponse> {
  return apiPost({
    path: "/billing/portal",
    passedData: {},
  });
}
