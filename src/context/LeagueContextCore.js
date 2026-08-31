import { createContext, useContext } from "react";

export const LeagueContext = createContext(undefined);

export function useLeague() {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error("useLeague must be used within a LeagueProvider");
  }
  return context;
}
