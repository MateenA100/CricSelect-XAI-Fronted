import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { useLeague } from "../../context/LeagueContextCore";
import { searchPlayers } from "../../api/client";
import Card from "../ui/Card";
import ErrorState from "../ui/ErrorState";
import LoadingState from "../ui/LoadingState";
import SearchInput from "../ui/SearchInput";
import styles from "./PlayerSearchPanel.module.css";

export default function PlayerSearchPanel({ onSelect, selectedPlayer, searchFunction = searchPlayers, titlePrefix = "Search", initialPlayer = null }) {
  const { selectedLeague } = useLeague();
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    setPlayers([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setError("");
    const initialLeague = initialPlayer?.league_key ?? initialPlayer?.league;
    const initialMatchesLeague = initialPlayer && (initialLeague === selectedLeague || initialLeague === selectedLeague.replace(" ", "_"));
    if (initialMatchesLeague) {
      setQuery(initialPlayer.player_name);
      onSelect(initialPlayer);
    } else {
      setQuery("");
      onSelect(null);
    }
  }, [selectedLeague, onSelect, initialPlayer]);

  useEffect(() => {
    const searched = query.trim();
    if (searched.length < 2 || selectedPlayer?.player_name === searched) {
      setLoading(false);
      if (searched.length < 2) setPlayers([]);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError("");
    const timer = window.setTimeout(() => {
      searchFunction({ league: selectedLeague, query: searched, limit: 10 })
        .then((result) => {
          if (!active) return;
          setPlayers(result.players);
          setActiveIndex(result.players.length ? 0 : -1);
          setIsOpen(true);
        })
        .catch((requestError) => {
          if (!active) return;
          setPlayers([]);
          setError(requestError.message);
          setIsOpen(true);
        })
        .finally(() => active && setLoading(false));
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, selectedLeague, selectedPlayer, searchFunction]);

  function choosePlayer(player) {
    setQuery(player.player_name);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(player);
  }

  function handleQueryChange(value) {
    setQuery(value);
    setIsOpen(value.trim().length >= 2);
    setActiveIndex(-1);
    if (selectedPlayer && value !== selectedPlayer.player_name) onSelect(null);
  }

  function handleKeyDown(event) {
    if (!isOpen || players.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % players.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? players.length - 1 : current - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      choosePlayer(players[activeIndex]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <Card title={`${titlePrefix} ${selectedLeague} players`}>
      <div className={styles.autocomplete}>
        <SearchInput
          label="Player name"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder="Start typing a player name"
          hideLabel={false}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="player-suggestions"
          aria-activedescendant={activeIndex >= 0 ? `player-option-${activeIndex}` : undefined}
        />
        <p className={styles.hint}>Suggestions appear after two characters. Use ↑/↓ and Enter to select.</p>

        {loading && <LoadingState message="Finding matching players..." />}
        {!loading && error && <ErrorState message={error} />}
        {isOpen && !loading && !error && query.trim().length >= 2 && players.length === 0 && (
          <p className={styles.note}>No matching player was found in {selectedLeague}.</p>
        )}
        {isOpen && !loading && players.length > 0 && (
          <ul id="player-suggestions" className={styles.results} role="listbox" aria-label="Player suggestions">
          {players.map((player) => {
            const index = players.indexOf(player);
            const isActive = index === activeIndex;
            return (
              <li key={`${player.player_name}-${player.league_key}`}>
                <button
                  id={`player-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={`${styles.result} ${isActive ? styles.selected : ""}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choosePlayer(player)}
                >
                  <UserRound size={18} aria-hidden="true" />
                  <span>
                    <strong>{player.player_name}</strong>
                    <small>{player.role} · {player.league}</small>
                  </span>
                </button>
              </li>
            );
          })}
          </ul>
        )}
      </div>
    </Card>
  );
}
