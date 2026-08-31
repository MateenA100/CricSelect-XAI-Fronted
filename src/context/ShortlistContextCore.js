import { createContext, useContext } from "react";

export const ShortlistContext = createContext(undefined);

export function useShortlist() {
  const context = useContext(ShortlistContext);
  if (context === undefined) throw new Error("useShortlist must be used within a ShortlistProvider");
  return context;
}
