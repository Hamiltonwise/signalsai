import { createContext } from "react";
import type { GA4ContextType } from "../hooks/useGA4";

export const GA4Context = createContext<GA4ContextType | undefined>(undefined);
