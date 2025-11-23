import { useState, useCallback, useRef } from "react";
import googleAuth from "../api/google-auth";
import type { AuthState, AuthResponse } from "../types/google-auth";

const POPUP_WIDTH = 500;
const POPUP_HEIGHT = 600;
const POPUP_TIMEOUT = 300000; // 5 minutes

export const useGoogleAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    googleAccount: null,
    error: null,
  });

  const popupRef = useRef<Window | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef<boolean>(false);

  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setAuthState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string) => {
    setAuthState((prev) => ({
      ...prev,
      error,
      isLoading: false,
    }));
  }, []);

  const setAuthenticated = useCallback(
    (authResponse: AuthResponse & { role?: string }) => {
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: authResponse.user,
        googleAccount: authResponse.googleAccount,
        error: null,
      });

      // Do NOT store Google access tokens or expiry in the browser.
      // The backend refreshes Google tokens; frontend gates on google_account_id only.
      // Store googleAccountId for multi-tenant API requests
      if (authResponse.googleAccountId) {
        localStorage.setItem(
          "google_account_id",
          authResponse.googleAccountId.toString()
        );
        console.log(
          "[OAuth] Stored google account ID:",
          authResponse.googleAccountId
        );
      }

      // Store user role from OAuth response
      if (authResponse.role) {
        localStorage.setItem("user_role", authResponse.role);
        console.log("[OAuth] Stored user role:", authResponse.role);
      } else {
        // Default OAuth users to admin if no role provided (backwards compatibility)
        localStorage.setItem("user_role", "admin");
        console.log("[OAuth] Defaulted to admin role");
      }
    },
    []
  );

  const clearAuth = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      googleAccount: null,
      error: null,
    });

    // Clear stored tokens and account ID
    localStorage.removeItem("google_access_token");
    localStorage.removeItem("google_token_expiry");
    localStorage.removeItem("google_account_id");
    localStorage.removeItem("auth_token"); // Clear OTP auth token
    localStorage.removeItem("user_role"); // Clear user role
  }, []);

  const closePopup = useCallback(() => {
    try {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    } catch {
      // COOP policy may block access to .closed property - ignore
      console.log("[OAuth] Popup close check blocked by COOP policy");
    }
    popupRef.current = null;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Reset the connection lock
    isConnectingRef.current = false;
  }, []);

  const centerPopup = (width: number, height: number) => {
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    return `left=${left},top=${top},width=${width},height=${height}`;
  };

  const connectGoogle = useCallback(async () => {
    // IMMEDIATE GUARD: Use ref for synchronous blocking
    if (isConnectingRef.current) {
      console.log("[OAuth] Already connecting (ref check), aborting");
      return;
    }

    // GUARD: Also check state
    if (authState.isLoading) {
      console.log("[OAuth] Already loading (state check), aborting");
      return;
    }

    // Set BOTH locks immediately
    isConnectingRef.current = true;

    clearError();
    setLoading(true);

    try {
      // Step 1: Get OAuth URL from backend
      const response = await googleAuth.getOAuthUrl();

      if (!response.success || !response.authUrl) {
        throw new Error(response.message || "Failed to generate OAuth URL");
      }

      // Step 2: Open popup with OAuth URL
      const popupFeatures = [
        centerPopup(POPUP_WIDTH, POPUP_HEIGHT),
        "resizable=yes",
        "scrollbars=yes",
        "status=no",
        "toolbar=no",
        "menubar=no",
        "location=no",
      ].join(",");

      popupRef.current = window.open(
        response.authUrl,
        "google_oauth",
        popupFeatures
      );

      if (!popupRef.current) {
        throw new Error(
          "Popup was blocked. Please allow popups for this site."
        );
      }

      // Step 3: Monitor popup for completion
      const checkClosed = () => {
        try {
          if (popupRef.current?.closed) {
            setError("Authentication was cancelled");
            setLoading(false);
            closePopup();
            return;
          }
        } catch {
          // COOP policy may block access to .closed property
          // This is expected after OAuth redirect - popup is likely still open
          // Continue checking via postMessage which is COOP-safe
        }

        // Check for completion by looking at popup URL
        try {
          const popupUrl = popupRef.current?.location?.href;
          if (popupUrl && popupUrl.includes("/auth/success")) {
            return;
          } else if (popupUrl && popupUrl.includes("/auth/error")) {
            return;
          }
        } catch {
          // Cross-origin restrictions - normal behavior
        }

        // Continue checking
        setTimeout(checkClosed, 1000);
      };

      checkClosed();

      // Step 4: Set timeout for popup
      timeoutRef.current = setTimeout(() => {
        setError("Authentication timed out. Please try again.");
        closePopup();
      }, POPUP_TIMEOUT);

      // Step 5: Listen for messages from popup
      const handleMessage = (event: MessageEvent) => {
        // Verify origin for security - accept from frontend or backend
        const allowedOrigins = [
          window.location.origin, // Frontend (e.g., http://localhost:5174)
          "http://localhost:3000", // Backend
          "http://localhost:5173", // Vite default
        ];

        if (!allowedOrigins.includes(event.origin)) {
          console.log("[OAuth] Rejected message from origin:", event.origin);
          return;
        }

        console.log("[OAuth] Received message:", event.data.type);

        if (event.data.type === "GOOGLE_OAUTH_SUCCESS") {
          console.log(
            "[OAuth] Success! User:",
            event.data.payload?.user?.email
          );
          setAuthenticated(event.data.payload);
          isConnectingRef.current = false;
          closePopup();
          window.removeEventListener("message", handleMessage);
        } else if (event.data.type === "GOOGLE_OAUTH_ERROR") {
          console.log("[OAuth] Error:", event.data.error);
          setError(event.data.error || "Authentication failed");
          isConnectingRef.current = false;
          closePopup();
          window.removeEventListener("message", handleMessage);
        }
      };

      window.addEventListener("message", handleMessage);
    } catch (error) {
      console.error("OAuth error:", error);
      setError(
        error instanceof Error ? error.message : "Authentication failed"
      );
      isConnectingRef.current = false;
      closePopup();
    }
  }, [clearError, setLoading, setError, setAuthenticated, closePopup]);

  const validateTokenFn = useCallback(async (googleAccountId: number) => {
    try {
      const response = await googleAuth.validateToken(googleAccountId);
      return response.success;
    } catch (error) {
      console.error("Token validation error:", error);
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    clearAuth();
    closePopup();
  }, [clearAuth, closePopup]);

  return {
    ...authState,
    connectGoogle,
    disconnect,
    validateToken: validateTokenFn,
    clearError,
  };
};
