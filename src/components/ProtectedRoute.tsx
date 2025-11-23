import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component that redirects unauthenticated users to signin
 * Checks localStorage for authentication tokens (context-free for route-level protection)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Authenticate based on presence of google_account_id OR auth_token (OTP)
  const googleAccountId = localStorage.getItem("google_account_id");
  const authToken = localStorage.getItem("auth_token");
  const isAuthenticated = !!googleAccountId || !!authToken;

  if (!isAuthenticated) {
    console.log(
      "[ProtectedRoute] Missing authentication (google_account_id or auth_token); redirecting to signin",
      { currentTime: new Date().toISOString() }
    );
    return <Navigate to="/signin" replace />;
  }

  // If valid token exists, render the protected content
  return <>{children}</>;
};
