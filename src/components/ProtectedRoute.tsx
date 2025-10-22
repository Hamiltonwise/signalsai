import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component that redirects unauthenticated users to signin
 * Checks localStorage for authentication tokens (context-free for route-level protection)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Authenticate based on presence of google_account_id only.
  // Google access tokens are refreshed server-side; frontend should not gate on token expiry.
  const googleAccountId = localStorage.getItem("google_account_id");
  const isAuthenticated = !!googleAccountId;

  if (!isAuthenticated) {
    console.log(
      "[ProtectedRoute] Missing google_account_id; redirecting to signin",
      { currentTime: new Date().toISOString() }
    );
    return <Navigate to="/signin" replace />;
  }

  // If valid token exists, render the protected content
  return <>{children}</>;
};
