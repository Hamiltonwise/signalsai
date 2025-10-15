import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleConnectButton } from "../components/GoogleConnectButton";
import { useGoogleAuthContext } from "../contexts/googleAuthContext";

export default function SignIn() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useGoogleAuthContext();

  // Auto-redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

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
      <div className="max-w-xl w-full">
        {/* Glass Effect Card with Alloro Mascot */}
        <div className="relative p-8 py-12 rounded-2xl bg-white/30 backdrop-blur-lg border border-white/40 shadow-2xl">
          {/* Alloro Pointing Down Mascot - Standing on Top Left of Card */}
          <div className="absolute -top-[115px] left-2 w-32 h-32 z-10">
            <img
              src="/alloro-pointing-down.png"
              alt="Alloro Pointing"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-8">
            <h2 className="text-5xl font-thin text-gray-900 mb-3">
              Welcome to Alloro
            </h2>
            <p className="text-gray-700 text-sm">
              Grow your practice with data-driven decisions.
            </p>
          </div>

          {/* Error/Info message with reserved space to prevent layout shift */}
          {/* <div
            id="signin-msg"
            role="alert"
            aria-live="polite"
            className="mb-6 min-h-[20px] text-center"
          ></div> */}

          {/* Google OAuth Button */}
          <div className="mb-4 flex items-center  justify-center">
            <GoogleConnectButton variant="outline" size="md" />
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            By signing in, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
