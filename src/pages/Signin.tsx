import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleConnectButton } from "../components/GoogleConnectButton";
import { AccountSelectionHelperModal } from "../components/AccountSelectionHelperModal";
import { useGoogleAuthContext } from "../contexts/googleAuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, CheckCircle2, HelpCircle } from "lucide-react";

type LoginMode = "owner" | "collaborator";
type OTPStep = "email" | "code" | "verifying";

export default function SignIn() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useGoogleAuthContext();

  const [mode, setMode] = useState<LoginMode>("collaborator");
  const [otpStep, setOtpStep] = useState<OTPStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isTestAccount, setIsTestAccount] = useState(false);
  const [showAccountHelp, setShowAccountHelp] = useState(false);

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
    setIsTestAccount(false);

    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpStep("code");

        // Check if this is a test account
        if (data.isTestAccount) {
          setIsTestAccount(true);
          setMessage("You are a tester, type anything and proceed");
        } else {
          setMessage("");
        }
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
            data.user.googleAccountId.toString(),
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

  const switchToOwner = () => {
    setMode("owner");
    setOtpStep("email");
    setError("");
    setMessage("");
  };

  const switchToCollaborator = () => {
    setMode("collaborator");
    setOtpStep("email");
    setError("");
    setMessage("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-alloro-bg font-body">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="relative p-8 rounded-2xl bg-white border border-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          {/* Logo/Brand */}
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="Alloro"
              className="w-14 h-14 rounded-xl shadow-lg shadow-blue-900/20"
            />
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-heading text-alloro-navy tracking-tight mb-2">
              Welcome to Alloro
            </h1>
            <p className="text-slate-500 text-sm">
              Growth you can see. Sign in to get started.
            </p>
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
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-green-50 text-green-700 border border-green-200"
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
                <div className="text-center space-y-5">
                  <div className="flex justify-center">
                    <GoogleConnectButton variant="outline" size="lg" />
                  </div>

                  {/* Multiple Accounts Helper Link */}
                  <button
                    onClick={() => setShowAccountHelp(true)}
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-alloro-orange transition-colors group"
                  >
                    <HelpCircle className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="underline decoration-dashed underline-offset-4 decoration-slate-300 group-hover:decoration-alloro-orange">
                      Seeing multiple accounts? Not sure which to use?
                    </span>
                  </button>

                  {/* Switch to Collaborator Link */}
                  <button
                    onClick={switchToCollaborator}
                    className="text-sm text-alloro-orange hover:text-alloro-orange/80 transition-colors font-medium"
                  >
                    Login as collaborator?
                  </button>
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
                      otpStep === "email"
                        ? "text-alloro-orange"
                        : "text-slate-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        otpStep === "email"
                          ? "bg-alloro-orange text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      1
                    </div>
                    <span className="text-xs font-medium hidden sm:inline">
                      Email
                    </span>
                  </div>
                  <div className="w-8 h-px bg-slate-300" />
                  <div
                    className={`flex items-center gap-2 ${
                      otpStep === "code" || otpStep === "verifying"
                        ? "text-alloro-orange"
                        : "text-slate-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        otpStep === "code" || otpStep === "verifying"
                          ? "bg-alloro-orange text-white"
                          : "bg-slate-200 text-slate-500"
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
                          className="block text-sm font-medium text-alloro-navy mb-2"
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
                          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-alloro-orange/20 focus:border-alloro-orange outline-none transition-all placeholder:text-slate-400"
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
                        className="w-full py-3 px-4 bg-alloro-orange hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20"
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
                      {/* Switch to Owner Link */}
                      <p className="text-center">
                        <button
                          onClick={switchToOwner}
                          className="text-sm text-alloro-orange hover:text-alloro-orange/80 transition-colors font-medium"
                        >
                          Login as owner?
                        </button>
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
                        {isTestAccount ? (
                          <p className="text-sm text-green-600 font-semibold">
                            You are a tester, type anything and proceed
                          </p>
                        ) : (
                          <>
                            <p className="text-sm text-slate-600 font-medium">
                              Code sent to
                            </p>
                            <p className="text-sm text-alloro-orange font-semibold">
                              {email}
                            </p>
                          </>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="otp"
                          className="block text-sm font-medium text-alloro-navy mb-2"
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
                          className="w-full px-4 py-4 bg-white border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-alloro-orange/20 focus:border-alloro-orange outline-none transition-all text-center tracking-[0.5em] font-mono text-2xl font-bold placeholder:tracking-normal placeholder:text-base text-alloro-navy"
                          disabled={isLoading}
                          autoFocus
                        />
                      </div>

                      <button
                        onClick={handleVerifyOTP}
                        disabled={isLoading || otp.length !== 6}
                        className="w-full py-3 px-4 bg-alloro-orange hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20"
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
                        className="w-full text-sm text-slate-500 hover:text-alloro-orange transition-colors disabled:opacity-50"
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
          <p className="text-slate-500 text-sm">
            By signing in, you agree to our{" "}
            <a
              href="https://getalloro.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-alloro-orange hover:underline"
            >
              Terms of Service
            </a>
          </p>
        </div>
      </div>

      {/* Account Selection Helper Modal */}
      <AccountSelectionHelperModal
        isOpen={showAccountHelp}
        onClose={() => setShowAccountHelp(false)}
      />
    </div>
  );
}
