import React, { type ReactNode } from "react";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { GoogleAuthContext } from "./googleAuthContext";

interface GoogleAuthProviderProps {
  children: ReactNode;
}

export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({
  children,
}) => {
  const auth = useGoogleAuth();

  return (
    <GoogleAuthContext.Provider value={auth}>
      {children}
    </GoogleAuthContext.Provider>
  );
};
