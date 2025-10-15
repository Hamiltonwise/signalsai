import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component that redirects unauthenticated users to signin
 * Checks localStorage for authentication tokens (context-free for route-level protection)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Check localStorage for tokens
  const hasToken = localStorage.getItem("google_access_token");
  const tokenExpiry = localStorage.getItem("google_token_expiry");

  // Check if token exists and is not expired
  const isTokenValid =
    hasToken && (!tokenExpiry || Date.now() < parseInt(tokenExpiry));

  // If no valid token, redirect to signin
  if (!isTokenValid) {
    console.log(
      "[ProtectedRoute] No valid authentication found, redirecting to signin",
      {
        hasToken: !!hasToken,
        tokenExpiry,
        expiryDate: tokenExpiry
          ? new Date(parseInt(tokenExpiry)).toISOString()
          : null,
        currentTime: new Date().toISOString(),
        isExpired: tokenExpiry ? Date.now() >= parseInt(tokenExpiry) : null,
      }
    );
    return <Navigate to="/signin" replace />;
  }

  // If valid token exists, render the protected content
  return <>{children}</>;
};
