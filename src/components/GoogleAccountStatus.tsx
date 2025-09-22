import React from "react";
import { useGoogleAuthContext } from "../contexts/googleAuthContext";

export const GoogleAccountStatus: React.FC = () => {
  const { isAuthenticated, user, googleAccount, disconnect, isLoading } =
    useGoogleAuthContext();

  if (!isAuthenticated || !user || !googleAccount) {
    return null;
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Unknown";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  const getScopes = () => {
    if (!googleAccount.scopes) return [];
    return googleAccount.scopes.split(",").map((scope) => {
      switch (scope.trim()) {
        case "https://www.googleapis.com/auth/analytics.readonly":
          return "Google Analytics 4";
        case "https://www.googleapis.com/auth/webmasters.readonly":
          return "Google Search Console";
        case "https://www.googleapis.com/auth/business.manage":
          return "Google Business Profile";
        default:
          return scope.trim();
      }
    });
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-green-800 mb-1">
              Google Account Connected
            </h3>

            <div className="space-y-2 text-sm text-green-700">
              <div className="flex items-center gap-2">
                <span className="font-medium">Email:</span>
                <span>{user.email}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Name:</span>
                <span>{user.name || "Not provided"}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Connected:</span>
                <span>{formatDate(googleAccount.created_at)}</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-medium">Access to:</span>
                <div className="flex flex-wrap gap-1">
                  {getScopes().map((scope, index) => (
                    <span
                      key={index}
                      className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={disconnect}
          disabled={isLoading}
          className="flex-shrink-0 ml-4 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-md transition-colors duration-200 disabled:opacity-50"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};
