import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleConnectButton } from "../components/GoogleConnectButton";
import { useGoogleAuthContext } from "../contexts/googleAuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Shield, Loader2, CheckCircle2 } from "lucide-react";

type LoginMode = "owner" | "collaborator";
type OTPStep = "email" | "code" | "verifying";

export default function SignIn() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useGoogleAuthContext();

  const [mode, setMode] = useState<LoginMode>("owner");
  const [otpStep, setOtpStep] = useState<OTPStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Auto-redirect to dashboard if authenticated
  useEffect(() => {
    const authToken = localStorage.getItem("auth_token");
    if ((isAuthenticated && user) || authToken) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  const handleRequestOTP = async () => {
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpStep("code");
        setMessage("");
      } else {
        setError(data.error || "Failed to send code");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setIsLoading(true);
    setOtpStep("verifying");
    setError("");
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("auth_token", data.token);
        if (data.user.googleAccountId) {
          localStorage.setItem(
            "google_account_id",
            data.user.googleAccountId.toString()
          );
        }
        if (data.user.role) {
          localStorage.setItem("user_role", data.user.role);
        }

        // Show success briefly before redirect
        setMessage("Success! Redirecting...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 800);
      } else {
        setError(data.error || "Invalid code");
        setOtpStep("code");
      }
    } catch {
      setError("An error occurred. Please try again.");
      setOtpStep("code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      action();
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url(/bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-md w-full">
        {/* Glass Effect Card with Alloro Mascot */}
        <div className="relative p-8 rounded-2xl bg-white/30 backdrop-blur-lg border border-white/40 shadow-2xl">
          {/* Alloro Mascot */}
          <div className="absolute -top-[115px] left-2 w-32 h-32 z-10">
            <img
              src="/alloro-pointing-down.png"
              alt="Alloro Pointing"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-6">
            <h2 className="text-4xl font-thin text-gray-900 mb-2">
              Welcome to Alloro
            </h2>
            <p className="text-gray-700 text-sm">
              Grow your practice with data-driven decisions
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex gap-2 mb-6 p-1 bg-white/50 rounded-xl">
            <button
              onClick={() => {
                setMode("owner");
                setOtpStep("email");
                setError("");
                setMessage("");
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                mode === "owner"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Shield className="w-4 h-4" />
              Owner
            </button>
            <button
              onClick={() => {
                setMode("collaborator");
                setOtpStep("email");
                setError("");
                setMessage("");
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                mode === "collaborator"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Mail className="w-4 h-4" />
              Collaborator
            </button>
          </div>

          {/* Error/Success Messages */}
          <AnimatePresence mode="wait">
            {(error || message) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-4 p-3 rounded-lg text-center text-sm ${
                  error
                    ? "bg-red-50/80 text-red-700 border border-red-200"
                    : "bg-blue-50/80 text-blue-700 border border-blue-200"
                }`}
              >
                {error || message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Content */}
          <AnimatePresence mode="wait">
            {mode === "owner" ? (
              <motion.div
                key="owner"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="text-center space-y-6">
                  <p className="text-sm text-gray-600">
                    Sign in with your Google account to access full analytics
                    and management features
                  </p>
                  <div className="flex justify-center">
                    <GoogleConnectButton variant="outline" size="lg" />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collaborator"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div
                    className={`flex items-center gap-2 ${
                      otpStep === "email" ? "text-blue-600" : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        otpStep === "email"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      1
                    </div>
                    <span className="text-xs font-medium hidden sm:inline">
                      Email
                    </span>
                  </div>
                  <div className="w-8 h-px bg-gray-300" />
                  <div
                    className={`flex items-center gap-2 ${
                      otpStep === "code" || otpStep === "verifying"
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        otpStep === "code" || otpStep === "verifying"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      {otpStep === "verifying" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "2"
                      )}
                    </div>
                    <span className="text-xs font-medium hidden sm:inline">
                      Verify
                    </span>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {otpStep === "email" ? (
                    <motion.div
                      key="email-step"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyPress={(e) =>
                            handleKeyPress(e, handleRequestOTP)
                          }
                          placeholder="Enter your work email"
                          className="w-full px-4 py-3 bg-white/80 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                          disabled={isLoading}
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={handleRequestOTP}
                        disabled={
                          isLoading ||
                          !email ||
                          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                        }
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending code...
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            Send Verification Code
                          </>
                        )}
                      </button>
                      <p className="text-xs text-center text-gray-500">
                        You'll receive a 6-digit code to verify your identity
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="code-step"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-700 font-medium">
                          Code sent to
                        </p>
                        <p className="text-sm text-blue-600">{email}</p>
                      </div>

                      <div>
                        <label
                          htmlFor="otp"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Verification Code
                        </label>
                        <input
                          id="otp"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={otp}
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6);
                            setOtp(value);
                            if (value.length === 6) {
                              // Auto-submit when 6 digits entered
                              setTimeout(() => {
                                if (!isLoading) {
                                  handleVerifyOTP();
                                }
                              }, 300);
                            }
                          }}
                          onKeyPress={(e) => handleKeyPress(e, handleVerifyOTP)}
                          placeholder="000000"
                          maxLength={6}
                          className="w-full px-4 py-4 bg-white/80 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-center tracking-[0.5em] font-mono text-2xl font-bold placeholder:tracking-normal placeholder:text-base"
                          disabled={isLoading}
                          autoFocus
                        />
                      </div>

                      <button
                        onClick={handleVerifyOTP}
                        disabled={isLoading || otp.length !== 6}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                      >
                        {otpStep === "verifying" ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Verify & Sign In
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleRequestOTP}
                        disabled={isLoading}
                        className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                      >
                        Didn't receive code? Resend
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-black text-sm drop-shadow">
            By signing in, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
