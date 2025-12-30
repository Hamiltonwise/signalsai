import { useState } from "react";
import { apiPost } from "../../api";
import { showSuccessToast, showErrorToast } from "../../lib/toast";
import { Mail, Lock, ArrowRight, Loader2, CheckCircle } from "lucide-react";

export function AdminLogin() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await apiPost({
        path: "/auth/otp/request",
        passedData: { email, isAdminLogin: true },
      });

      if (res.success) {
        showSuccessToast("OTP Sent", "Check your email for the code");
        setStep("otp");
      } else {
        showErrorToast("Error", res.error || "Failed to send OTP");
      }
    } catch {
      showErrorToast("Error", "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    try {
      const res = await apiPost({
        path: "/auth/otp/verify",
        passedData: { email, code: otp, isAdminLogin: true },
      });

      if (res.success && res.token) {
        localStorage.setItem("admin_token", res.token);
        if (res.user?.googleAccountId) {
          localStorage.setItem(
            "google_account_id",
            res.user.googleAccountId.toString()
          );
        }
        showSuccessToast("Login Successful", "Redirecting to dashboard...");
        window.location.reload();
      } else {
        showErrorToast("Verification Failed", res.error || "Invalid OTP");
      }
    } catch {
      showErrorToast("Error", "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        backgroundImage: "url(/bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-full max-w-md">
        {/* Glass Effect Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/30 p-8 shadow-2xl backdrop-blur-lg">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-alloro-navy text-white shadow-lg backdrop-blur-sm">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-light text-alloro-navy">
              Admin Access
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Verify your identity to continue
            </p>
          </div>

          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-800"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    className="block w-full rounded-xl border border-gray-300 bg-white/80 p-3 pl-10 text-gray-900 placeholder-gray-400 focus:border-alloro-orange focus:ring-2 focus:ring-alloro-orange/50 focus:outline-none transition-all"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-alloro-orange px-5 py-3 text-center text-base font-medium text-white shadow-lg hover:bg-alloro-navy focus:outline-none focus:ring-4 focus:ring-alloro-orange/50 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center">
                <p className="mb-4 text-sm text-gray-700">
                  We sent a 6-digit code to <br />
                  <span className="font-medium text-alloro-navy">{email}</span>
                </p>
              </div>

              <div>
                <label
                  htmlFor="otp"
                  className="mb-2 block text-sm font-medium text-gray-800"
                >
                  Verification Code
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <CheckCircle className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    id="otp"
                    className="block w-full rounded-xl border border-gray-300 bg-white/80 p-3 pl-10 text-center text-2xl font-bold tracking-widest text-gray-900 placeholder-gray-400 focus:border-alloro-orange focus:ring-2 focus:ring-alloro-orange/50 focus:outline-none transition-all"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-alloro-orange px-5 py-3 text-center text-base font-medium text-white shadow-lg hover:bg-alloro-navy focus:outline-none focus:ring-4 focus:ring-alloro-orange/50 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  "Verify & Login"
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep("email")}
                className="w-full text-center text-sm text-gray-600 hover:text-alloro-orange transition-colors"
              >
                Change email address
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-black drop-shadow-sm">
            Protected by SignalsAI Security
          </p>
        </div>
      </div>
    </div>
  );
}
