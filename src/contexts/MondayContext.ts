import { createContext } from "react";
import type { MondayContextType } from "../hooks/useMonday";

export const MondayContext = createContext<MondayContextType | undefined>(
  undefined
);
