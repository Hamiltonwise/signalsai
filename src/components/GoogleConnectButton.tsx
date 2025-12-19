import React from "react";
import { useGoogleAuthContext } from "../contexts/googleAuthContext";

interface GoogleConnectButtonProps {
  className?: string;
  variant?: "primary" | "outline" | "minimal";
  size?: "sm" | "md" | "lg";
}

export const GoogleConnectButton: React.FC<GoogleConnectButtonProps> = ({
  className = "",
  variant = "primary",
  size = "md",
}) => {
  const { isAuthenticated, isLoading, connectGoogle, error, clearError } =
    useGoogleAuthContext();

  const baseClasses =
    "flex items-center justify-center gap-3 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    outline:
      "border-2 border-gray-300 hover:border-blue-500 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-600 focus:ring-blue-500",
    minimal:
      "bg-transparent hover:bg-gray-100 text-gray-600 hover:text-blue-600 focus:ring-gray-500",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  const handleConnect = () => {
    if (error) clearError();
    connectGoogle();
  };

  if (isAuthenticated) {
    return null; // Don't show button when already connected
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className={`${baseClasses} ${variantClasses[variant]} ${
          sizeClasses[size]
        } ${className} ${
          isLoading ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"
        }`}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <GoogleIcon className="w-5 h-5" />
            <span>Continue with Google</span>
          </>
        )}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Connection Failed
              </p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button
                onClick={clearError}
                className="text-sm text-red-700 hover:text-red-800 underline mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Google Icon Component
const GoogleIcon: React.FC<{ className?: string }> = ({
  className = "w-5 h-5",
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);
