import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Building2 } from "lucide-react";
import { OnboardingWizard } from "../components/OnboardingWizard";
import { supabase } from "../lib/supabaseClient";
import { useAuthReady } from "../hooks/useAuthReady";
import { AuthService } from "../utils/authService";

export default function SignIn() {
  const { ready, session } = useAuthReady();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSignUp, setIsSignUp] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // If already authenticated, redirect to intended page (but only after ready)
  useEffect(() => {
    if (!ready) return;
    if (session) {
      const from = location.state?.from?.pathname || "/dashboard";
      console.log("🔐 Already authenticated, redirecting to:", from);
      navigate(from, { replace: true });
    }
  }, [ready, session, navigate, location.state]);

  // Show loading while auth state is being determined
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If session exists, don't render form (effect above will navigate)
  if (session) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setInfo(null);

    try {
      if (isSignUp) {
        // For new users, show onboarding wizard
        setShowOnboarding(true);
        setIsLoading(false);
      } else {
        // Sign in existing user using Supabase Auth
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (signInError) {
          // Surface clear, specific reasons to avoid "mystery 400"
          const msg = signInError.message?.toLowerCase() || "";
          if (msg.includes("email not confirmed")) {
            setError(
              'Email not confirmed. Please check your inbox or click "Resend confirmation".'
            );
          } else if (msg.includes("invalid login credentials")) {
            setError(
              "Invalid email or password. If you recently moved projects or changed env, verify you are signing into THIS project."
            );
          } else {
            setError(signInError.message || "Sign in failed.");
          }

          // Check if this is a new user (just registered)
          const isNewUser = location.state?.isNewUser || false;

          if (isNewUser) {
            // For new users, show welcome message and redirect to settings
            navigate("/settings", {
              replace: true,
              state: {
                showWelcome: true,
                message:
                  "Welcome! Let's connect your analytics tools to get started.",
              },
            });
          } else {
            navigate("/signin", { replace: true });
          }
          return;
        }

        // Wait for session to be established
        let retries = 0;
        const maxRetries = 5;

        while (retries < maxRetries) {
          const {
            data: { session: newSession },
          } = await supabase.auth.getSession();

          if (newSession) {
            console.log(
              "Sign-in: Session established, fetching user profile..."
            );

            // Fetch the user record to get the correct client_id
            const { data: userRecord, error: userError } = await supabase
              .from("users")
              .select("client_id, first_name, last_name, role")
              .eq("id", newSession.user.id)
              .single();

            if (userError || !userRecord) {
              console.error("Sign-in: Failed to fetch user record:", userError);
              setError("Failed to load user profile. Please try again.");
              setIsLoading(false);
              return;
            }

            console.log("Sign-in: User record fetched successfully:", {
              userId: newSession.user.id,
              clientId: userRecord.client_id,
              email: newSession.user.email,
            });

            // Store the authentication data properly for AuthService with correct client_id
            AuthService.setAuthData(
              newSession.access_token,
              userRecord.client_id, // Use client_id as the primary identifier for dashboard
              {
                id: newSession.user.id,
                user_id: newSession.user.id, // Keep user_id separate
                client_id: userRecord.client_id, // Store client_id for database queries
                email: newSession.user.email,
                first_name: userRecord.first_name,
                last_name: userRecord.last_name,
                role: userRecord.role,
              },
              newSession.access_token
            );

            // Verify the data was stored correctly
            const storedClientId = AuthService.getUserId();
            const storedUserData = AuthService.getUserData();
            console.log("Sign-in: Verification after storage:", {
              storedClientId,
              storedUserDataClientId: storedUserData?.client_id,
              authServiceIsAuthenticated: AuthService.isAuthenticated(),
            });

            console.log(
              "Sign-in: Auth data stored, navigating to dashboard..."
            );
            const from = location.state?.from?.pathname || "/dashboard";
            navigate(from, { replace: true });
            return;
          }

          // Wait a bit and retry
          retries++;
          console.log(
            `Sign-in: Session not ready, retry ${retries}/${maxRetries}`
          );
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        setError(
          "Sign-in completed but session not established. Please refresh and try again."
        );
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError(err instanceof Error ? err.message : "Authentication failed");
      setIsLoading(false);
    }
  };

  const resendConfirmation = async () => {
    setError(null);
    setInfo(null);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });
      if (error) {
        setError(error.message);
        return;
      }
      setInfo("Confirmation email sent. Check your inbox.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to resend confirmation.");
    }
  };

  const sendReset = async () => {
    setError(null);
    setInfo(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: window.location.origin + "/reset-password",
        }
      );
      if (error) {
        setError(error.message);
        return;
      }
      setInfo("Password reset email sent. Check your inbox.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to send reset email.");
    }
  };

  const handleOnboardingComplete = (clientData: any) => {
    // After onboarding, redirect to sign in page
    if (clientData?.redirect === "/signin") {
      setShowOnboarding(false);
      setIsSignUp(false);
      setInfo(
        "Account created successfully! Please sign in to access your dashboard."
      );
      // Mark this as a new user for the welcome flow
      location.state = { ...location.state, isNewUser: true };
    } else {
      // Fallback to dashboard redirect
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  };

  if (showOnboarding) {
    return (
      <OnboardingWizard
        isOpen={true}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Show welcome message for redirected users
  const isRedirected = location.state?.from?.pathname;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Show redirect message if user was redirected */}
        {isRedirected && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg text-center">
            <p className="text-blue-800 text-sm">
              Welcome! Please sign in to access your dashboard
            </p>
          </div>
        )}

        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/8d831870a_HWLogo.png"
              alt="Hamiltonwise Logo"
              className="w-12 h-12 object-contain"
            />
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900">
                Hamiltonwise.com
              </h1>
              <p className="text-sm text-gray-600">
                Dental Vital Signs Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Sign In Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-gray-600">
              {isSignUp
                ? "Set up your dental practice dashboard"
                : "Sign in to your dashboard"}
            </p>
          </div>

          {/* Error/Info message with reserved space to prevent layout shift */}
          <div
            id="signin-msg"
            role="alert"
            aria-live="polite"
            className="mb-4 min-h-[20px]"
          >
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            {info && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm">{info}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby="signin-msg"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby="signin-msg"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Building2 className="w-5 h-5" />
              )}
              {isLoading
                ? "Please wait..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
            </button>
          </form>

          {/* Helper buttons */}
          <div className="mt-4 flex gap-2 justify-center">
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={!email || isLoading}
              className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resend confirmation
            </button>
            <span className="text-xs text-gray-400">•</span>
            <button
              type="button"
              onClick={sendReset}
              disabled={!email || isLoading}
              className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset password
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "New to Hamiltonwise? Create account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
