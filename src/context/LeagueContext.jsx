import { useState, useMemo } from "react";
import { APP_CONFIG } from "../config/appConfig";
import { LeagueContext } from "./LeagueContextCore";

const DEFAULT_LEAGUE = "IPL";

export function LeagueProvider({ children }) {
  const [selectedLeague, setSelectedLeague] = useState(DEFAULT_LEAGUE);

  const value = useMemo(
    () => ({
      selectedLeague,
      setSelectedLeague,
      leagues: APP_CONFIG.leagues,
    }),
    [selectedLeague]
  );

  return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>;
}
