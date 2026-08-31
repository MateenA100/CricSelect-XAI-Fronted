import { useEffect, useMemo, useState } from "react";
import { ShortlistContext } from "./ShortlistContextCore";

const STORAGE_KEY = "cricselect-player-shortlist-v1";

function loadSavedShortlist() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item?.player_name && item?.league_key) : [];
  } catch {
    return [];
  }
}

const playerKey = (player) => `${player.league_key}::${player.player_name}`;

export function ShortlistProvider({ children }) {
  const [shortlist, setShortlist] = useState(loadSavedShortlist);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shortlist));
  }, [shortlist]);

  const value = useMemo(() => ({
    shortlist,
    addPlayer(player) {
      setShortlist((current) => current.some((item) => playerKey(item) === playerKey(player)) ? current : [...current, player]);
    },
    removePlayer(player) {
      setShortlist((current) => current.filter((item) => playerKey(item) !== playerKey(player)));
    },
    clearLeague(leagueKey) {
      setShortlist((current) => current.filter((item) => item.league_key !== leagueKey));
    },
    isShortlisted(player) {
      return shortlist.some((item) => playerKey(item) === playerKey(player));
    },
  }), [shortlist]);

  return <ShortlistContext.Provider value={value}>{children}</ShortlistContext.Provider>;
}
