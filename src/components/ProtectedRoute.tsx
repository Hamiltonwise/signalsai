import { Navigate } from "react-router-dom";
import { getPriorityItem } from "../hooks/useLocalStorage";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component that redirects unauthenticated users to signin
 * Checks localStorage for authentication tokens (context-free for route-level protection)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Authenticate based on presence of google_account_id OR auth_token (OTP)
  // Use priority item to support pilot mode (sessionStorage)
  const googleAccountId = getPriorityItem("google_account_id");
  const authToken = getPriorityItem("auth_token");
  // Also check for 'token' key which is used by pilot handler and some auth flows
  const token = getPriorityItem("token");

  const isAuthenticated = !!googleAccountId || !!authToken || !!token;

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
