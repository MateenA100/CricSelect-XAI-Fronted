import { useEffect, useState } from "react";
import { Plus, Search, Trash2, Users } from "lucide-react";
import { fetchPlayerProfile, searchPlayers } from "../api/client";
import { useLeague } from "../context/LeagueContextCore";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import SearchInput from "../components/ui/SearchInput";
import StatusBadge from "../components/ui/StatusBadge";
import styles from "./PlayerComparisonPage.module.css";

const STAT_ROWS = [
  { group: "Overall", label: "Role", value: (p) => p.role },
  { group: "Overall", label: "Matches", value: (p) => format(p.statistics.total_matches, 0) },
  { group: "Overall", label: "Performance credit", value: (p) => format(p.statistics.performance_credit) },
  { group: "Overall", label: "Reliability", value: (p) => `${format(p.statistics.reliability_weight * 100, 1)}%` },
  { group: "Batting", label: "Total runs", batting: true, value: (p) => format(p.statistics.total_runs, 0) },
  { group: "Batting", label: "Batting average", batting: true, value: (p) => format(p.statistics.batting_average) },
  { group: "Batting", label: "Strike rate", batting: true, value: (p) => format(p.statistics.strike_rate) },
  { group: "Batting", label: "Recent strike rate", batting: true, value: (p) => format(p.statistics.recent_strike_rate) },
  { group: "Batting", label: "Recent runs per match", batting: true, value: (p) => format(p.statistics.recent_runs_per_match) },
  { group: "Bowling", label: "Wickets", bowling: true, value: (p) => format(p.statistics.wickets, 0) },
  { group: "Bowling", label: "Economy rate", bowling: true, value: (p) => format(p.statistics.economy_rate) },
  { group: "Bowling", label: "Wickets per match", bowling: true, value: (p) => format(p.statistics.wickets_per_match) },
  { group: "Bowling", label: "Recent economy rate", bowling: true, value: (p) => format(p.statistics.recent_economy_rate) },
  { group: "Bowling", label: "Recent wickets per match", bowling: true, value: (p) => format(p.statistics.recent_wickets_per_match) },
];

function format(value, digits = 2) {
  return value == null ? "—" : Number(value).toFixed(digits);
}

function displayStat(row, player) {
  if (row.batting && !player.statistics.has_batting_record) return "Not applicable";
  if (row.bowling && !player.statistics.has_bowling_record) return "Not applicable";
  return row.value(player);
}

export default function PlayerComparisonPage() {
  const { selectedLeague } = useLeague();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [players, setPlayers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setPlayers([]);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    setError("");
  }, [selectedLeague]);

  useEffect(() => {
    const searched = query.trim();
    if (searched.length < 2 || players.length >= 3) {
      setSuggestions([]);
      setSearching(false);
      return undefined;
    }
    let active = true;
    setSearching(true);
    const timer = window.setTimeout(() => {
      searchPlayers({ league: selectedLeague, query: searched, limit: 8 })
        .then((result) => {
          if (!active) return;
          const selectedNames = new Set(players.map((player) => player.player_name));
          setSuggestions(result.players.filter((player) => !selectedNames.has(player.player_name)));
          setOpen(true);
        })
        .catch((requestError) => active && setError(requestError.message))
        .finally(() => active && setSearching(false));
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, selectedLeague, players]);

  async function addPlayer(player) {
    setAdding(true);
    setError("");
    setOpen(false);
    try {
      const result = await fetchPlayerProfile({ playerName: player.player_name, league: player.league });
      setPlayers((current) => [...current, result.player].slice(0, 3));
      setQuery("");
      setSuggestions([]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAdding(false);
    }
  }

  const groups = ["Overall", "Batting", "Bowling"];

  return (
    <>
      <PageHeader
        title="Player Comparison"
        description={`Compare up to three ${selectedLeague} players using verified career and recent-form statistics.`}
        action={<StatusBadge status="Available" label="Live data" />}
      />

      <Card className={styles.selectorCard} title="Choose players" action={<span className={styles.slotCount}><Users size={16} /> {players.length}/3 selected</span>}>
        <div className={styles.selector}>
          <div className={styles.searchWrap}>
            <SearchInput
              label="Player name"
              value={query}
              onChange={(value) => { setQuery(value); setOpen(value.trim().length >= 2); }}
              onFocus={() => query.trim().length >= 2 && setOpen(true)}
              placeholder={players.length >= 3 ? "Maximum three players selected" : "Start typing a player name"}
              hideLabel={false}
              disabled={players.length >= 3}
              autoComplete="off"
              role="combobox"
              aria-expanded={open && suggestions.length > 0}
              aria-controls="comparison-suggestions"
            />
            {open && suggestions.length > 0 && (
              <ul id="comparison-suggestions" className={styles.suggestions} role="listbox">
                {suggestions.map((player) => (
                  <li key={`${player.player_name}-${player.league_key}`}>
                    <button type="button" onClick={() => addPlayer(player)}>
                      <Search size={16} /><span><strong>{player.player_name}</strong><small>{player.role}</small></span><Plus size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {searching && <span className={styles.searchState}>Searching…</span>}
          {adding && <span className={styles.searchState}>Adding player…</span>}
        </div>
        {players.length > 0 && (
          <div className={styles.selectedPlayers}>
            {players.map((player) => (
              <div key={player.player_name} className={styles.selectedPlayer}>
                <span><strong>{player.player_name}</strong><small>{player.role}</small></span>
                <Button variant="ghost" size="sm" icon={Trash2} aria-label={`Remove ${player.player_name}`} onClick={() => setPlayers((current) => current.filter((item) => item.player_name !== player.player_name))}>Remove</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {error && <ErrorState message={error} />}
      {adding && players.length === 0 && <LoadingState message="Loading verified player statistics..." />}
      {!adding && players.length === 0 && <EmptyState message="Add two or three players to begin a side-by-side comparison." />}

      {players.length > 0 && (
        <div className={styles.results}>
          <div className={styles.profileGrid}>
            {players.map((player) => (
              <Card key={player.player_name} title={player.player_name} action={<StatusBadge status="Available" label={player.role} />}>
                <div className={styles.profileItem}><span>General profile</span><strong>{player.clusters.general.name}</strong></div>
                <div className={styles.profileItem}><span>Role-specific style</span><strong>{player.clusters.role_specific.name}</strong></div>
              </Card>
            ))}
          </div>

          <Card title="Statistical comparison" action={<span className={styles.honesty}>Descriptive comparison—not a ranking</span>}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Statistic</th>{players.map((player) => <th key={player.player_name}>{player.player_name}</th>)}</tr></thead>
                <tbody>
                  {groups.map((group) => (
                    <ComparisonGroup key={group} group={group} rows={STAT_ROWS.filter((row) => row.group === group)} players={players} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

function ComparisonGroup({ group, rows, players }) {
  return (
    <>
      <tr className={styles.groupRow}><th colSpan={players.length + 1}>{group}</th></tr>
      {rows.map((row) => (
        <tr key={row.label}><td>{row.label}</td>{players.map((player) => <td key={player.player_name}>{displayStat(row, player)}</td>)}</tr>
      ))}
    </>
  );
}
