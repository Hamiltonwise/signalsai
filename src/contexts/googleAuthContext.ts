import { createContext, useContext } from "react";
import type { GoogleAuthContextType } from "../types/google-auth";

export const GoogleAuthContext = createContext<
  GoogleAuthContextType | undefined
>(undefined);

export const useGoogleAuthContext = (): GoogleAuthContextType => {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error(
      "useGoogleAuthContext must be used within GoogleAuthProvider"
    );
  }
  return context;
};
