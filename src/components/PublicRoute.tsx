import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { getPriorityItem } from "../hooks/useLocalStorage";

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * PublicRoute component that redirects authenticated users to dashboard
 * Used for signin page to prevent logged-in users from accessing it
 * Checks localStorage for authentication tokens (context-free for route-level protection)
 * Uses delayed check to avoid interfering with OAuth flow
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Small delay to allow OAuth flow to complete if in progress
    const timer = setTimeout(() => {
      const googleAccountId = getPriorityItem("google_account_id");
      const isAuthenticated = !!googleAccountId;

      if (isAuthenticated) {
        console.log(
          "[PublicRoute] google_account_id present; redirecting to dashboard"
        );
        setShouldRedirect(true);
      }
      setHasChecked(true);
    }, 100); // Small delay to let OAuth complete

    return () => clearTimeout(timer);
  }, []);

  // Wait for check to complete before deciding
  if (!hasChecked) {
    return <>{children}</>;
  }

  // If authenticated, redirect to dashboard
  if (shouldRedirect) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, render the public content (signin page)
  return <>{children}</>;
};
