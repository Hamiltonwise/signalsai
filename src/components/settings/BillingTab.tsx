/**
 * BillingTab Component
 *
 * Displays subscription billing information in the Settings page.
 * Shows current plan, upgrade options, and billing management.
 *
 * Handles three states:
 * 1. Paid subscription (Stripe active) — show plan + manage button
 * 2. Admin-granted (no Stripe) — show plan + add payment CTA
 * 3. Locked out — show urgent payment CTA
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Crown,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Globe,
  BarChart3,
  FileText,
  Users,
  Lock,
} from "lucide-react";
import {
  getBillingStatus,
  createCheckoutSession,
  createPortalSession,
  type BillingStatus,
} from "../../api/billing";

// ─── Plan Details (Single Product) ───

const PLAN = {
  name: "Alloro Intelligence",
  price: "$2,000",
  period: "/month",
  features: [
    { icon: BarChart3, label: "Practice rankings tracking" },
    { icon: FileText, label: "Task management" },
    { icon: Users, label: "Team collaboration" },
    { icon: Zap, label: "AI-powered insights" },
    { icon: Globe, label: "AI-powered website builder" },
    { icon: Crown, label: "Custom domain support" },
  ],
};

export const BillingTab: React.FC = () => {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  useEffect(() => {
    fetchBillingStatus();
  }, []);

  // Check URL params for billing success/cancel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("billing") === "success") {
      // Refresh billing status after successful checkout
      fetchBillingStatus();
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("billing") === "cancelled") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const fetchBillingStatus = async () => {
    try {
      const status = await getBillingStatus();
      if (status.success !== false) {
        setBilling(status);
      }
    } catch (err) {
      console.error("Failed to fetch billing status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async () => {
    setIsCheckoutLoading(true);
    try {
      const response = await createCheckoutSession("DFY");
      if (response.success && response.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const response = await createPortalSession();
      if (response.success && response.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-[2rem] border border-black/5 p-8 shadow-premium animate-pulse">
          <div className="h-6 w-48 bg-slate-100 rounded mb-4" />
          <div className="h-4 w-72 bg-slate-100 rounded mb-8" />
          <div className="h-48 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  const isAdminGranted = billing?.isAdminGranted ?? false;
  const hasStripe = billing?.hasStripeSubscription ?? false;
  const isLockedOut = billing?.isLockedOut ?? false;

  return (
    <div className="space-y-8">
      {/* Locked Out Banner */}
      {isLockedOut && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4"
        >
          <div className="p-2 bg-red-100 rounded-xl shrink-0">
            <Lock size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-red-900 font-bold text-sm">
              Account Locked
            </h3>
            <p className="text-red-700 text-sm mt-1">
              Your account has been locked. Please add a payment method to
              restore full access to the application.
            </p>
          </div>
        </motion.div>
      )}

      {/* Admin-Granted Banner */}
      {isAdminGranted && !isLockedOut && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4"
        >
          <div className="p-2 bg-amber-100 rounded-xl shrink-0">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-amber-900 font-bold text-sm">
              Payment Method Required
            </h3>
            <p className="text-amber-700 text-sm mt-1">
              Your account was set up by an administrator. Add a payment
              method to secure uninterrupted access.
            </p>
          </div>
        </motion.div>
      )}

      {/* Current Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] border border-black/5 p-6 lg:p-8 shadow-premium relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-alloro-orange/[0.03] rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-alloro-navy tracking-tight">
                Current Plan
              </h3>
              <p className="text-slate-500 text-sm">
                Your active subscription details
              </p>
            </div>
            {hasStripe && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                <CheckCircle2 size={14} className="text-green-600" />
                <span className="text-green-700 text-xs font-bold">
                  Active
                </span>
              </div>
            )}
            {isAdminGranted && !isLockedOut && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                <AlertTriangle size={14} className="text-amber-600" />
                <span className="text-amber-700 text-xs font-bold">
                  No Billing
                </span>
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-black text-alloro-navy tracking-tighter">
              {PLAN.price}
            </span>
            <span className="text-slate-400 font-bold text-sm">
              {PLAN.period}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1.5 bg-alloro-orange/10 rounded-lg">
              <span className="text-alloro-orange font-black text-xs tracking-wider uppercase">
                {PLAN.name}
              </span>
            </div>
            {billing?.currentPeriodEnd && (
              <span className="text-slate-400 text-xs font-medium">
                Next billing:{" "}
                {new Date(billing.currentPeriodEnd).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" }
                )}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {PLAN.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <feature.icon
                  size={14}
                  className="text-alloro-orange shrink-0"
                />
                <span className="text-sm text-slate-600 font-medium">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Manage Subscription (for paid users) */}
            {hasStripe && (
              <button
                onClick={handleManageSubscription}
                disabled={isPortalLoading}
                className="px-5 py-2.5 bg-alloro-navy text-white rounded-xl text-sm font-bold hover:bg-alloro-navy/90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <CreditCard size={16} />
                {isPortalLoading
                  ? "Opening..."
                  : "Manage Subscription"}
              </button>
            )}

            {/* Add Payment (for admin-granted or locked) */}
            {(isAdminGranted || isLockedOut) && (
              <button
                onClick={handleCheckout}
                disabled={isCheckoutLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-alloro-orange to-[#c45a47] text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-alloro-orange/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <CreditCard size={16} />
                {isCheckoutLoading
                  ? "Processing..."
                  : "Add Payment Method"}
              </button>
            )}
          </div>
        </div>
      </motion.div>

    </div>
  );
};
