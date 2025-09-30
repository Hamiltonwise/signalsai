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

  const setAuthenticated = useCallback((authResponse: AuthResponse) => {
    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      user: authResponse.user,
      googleAccount: authResponse.googleAccount,
      error: null,
    });

    // Store tokens in localStorage for persistence
    if (authResponse.accessToken) {
      localStorage.setItem("google_access_token", authResponse.accessToken);
    }
    if (authResponse.expiresAt) {
      localStorage.setItem(
        "google_token_expiry",
        authResponse.expiresAt.toString()
      );
    }
  }, []);

  const clearAuth = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      googleAccount: null,
      error: null,
    });

    // Clear stored tokens
    localStorage.removeItem("google_access_token");
    localStorage.removeItem("google_token_expiry");
  }, []);

  const closePopup = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const centerPopup = (width: number, height: number) => {
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    return `left=${left},top=${top},width=${width},height=${height}`;
  };

  const connectGoogle = useCallback(async () => {
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
        if (popupRef.current?.closed) {
          setError("Authentication was cancelled");
          setLoading(false);
          closePopup();
          return;
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
        // Verify origin for security
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === "GOOGLE_OAUTH_SUCCESS") {
          setAuthenticated(event.data.payload);
          closePopup();
          window.removeEventListener("message", handleMessage);
        } else if (event.data.type === "GOOGLE_OAUTH_ERROR") {
          setError(event.data.error || "Authentication failed");
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
