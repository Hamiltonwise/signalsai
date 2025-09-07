import { createContext } from "react";
import type { GSCContextType } from "../hooks/useGSC";

export const GSCContext = createContext<GSCContextType | undefined>(undefined);
