import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookmarkCheck, BookmarkPlus, Download, Search, SlidersHorizontal, UserRoundSearch, Users } from "lucide-react";
import { fetchPlayerDirectory } from "../api/client";
import { useLeague } from "../context/LeagueContextCore";
import { useShortlist } from "../context/ShortlistContextCore";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import SearchInput from "../components/ui/SearchInput";
import Select from "../components/ui/Select";
import StatusBadge from "../components/ui/StatusBadge";
import styles from "./PlayerDirectoryPage.module.css";
import { downloadCsv } from "../utils/csvExport";

const ROLE_OPTIONS = ["All", "Batsman", "Bowler", "All-Rounder", "Wicketkeeper-Batsman"];
const SORT_OPTIONS = {
  "Matches played": "total_matches",
  "Total runs": "total_runs",
  Wickets: "wickets",
  Reliability: "reliability_weight",
};

export default function PlayerDirectoryPage() {
  const navigate = useNavigate();
  const { selectedLeague } = useLeague();
  const { addPlayer, removePlayer, isShortlisted } = useShortlist();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [cluster, setCluster] = useState("All");
  const [sortLabel, setSortLabel] = useState("Matches played");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchPlayerDirectory({
        league: selectedLeague,
        query: query.trim(),
        role,
        cluster,
        sortBy: SORT_OPTIONS[sortLabel],
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [selectedLeague, query, role, cluster, sortLabel]);

  useEffect(() => {
    const timer = window.setTimeout(loadPlayers, query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [loadPlayers, query]);

  useEffect(() => {
    setQuery("");
    setRole("All");
    setCluster("All");
    setShowSuggestions(false);
  }, [selectedLeague]);

  const clusterOptions = useMemo(() => ["All", ...(data?.filters.clusters ?? [])], [data]);
  const suggestions = query.trim().length >= 2 ? (data?.players ?? []).slice(0, 6) : [];

  function chooseSuggestion(playerName) {
    setQuery(playerName);
    setShowSuggestions(false);
  }

  function exportDirectory() {
    const columns = [
      { key: "player_name", label: "Player" }, { key: "league", label: "League" },
      { key: "role", label: "Role" }, { key: "cluster_name", label: "K-Means profile" },
      { key: "total_matches", label: "Matches" }, { key: "total_runs", label: "Runs" },
      { key: "wickets", label: "Wickets" }, { key: "reliability_weight", label: "Reliability" },
      { key: "performance_credit", label: "Performance credit" },
    ];
    downloadCsv(`${selectedLeague}_filtered_player_directory.csv`, columns, data.players);
  }

  return (
    <>
      <PageHeader
        title="Player Directory"
        description={`Browse and compare verified ${selectedLeague} player records.`}
        action={<StatusBadge status="Available" label="Connected" />}
      />

      <Card className={styles.filterCard} title="Find players" action={<SlidersHorizontal size={18} aria-hidden="true" />}>
        <div className={styles.filters}>
          <div className={styles.searchWrap}>
            <SearchInput
              label="Search player name"
              value={query}
              onChange={(value) => { setQuery(value); setShowSuggestions(value.trim().length >= 2); }}
              onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
              placeholder="Start typing a player name"
              hideLabel={false}
              autoComplete="off"
              role="combobox"
              aria-expanded={showSuggestions && suggestions.length > 0}
              aria-controls="directory-suggestions"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul id="directory-suggestions" className={styles.suggestions} role="listbox">
                {suggestions.map((player) => (
                  <li key={`${player.player_name}-${player.league_key}`}>
                    <button type="button" onClick={() => chooseSuggestion(player.player_name)}>
                      <Search size={15} aria-hidden="true" />
                      <span><strong>{player.player_name}</strong><small>{player.role}</small></span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Select label="Role" value={role} onChange={setRole} options={ROLE_OPTIONS} />
          <Select label="K-Means profile" value={cluster} onChange={setCluster} options={clusterOptions} />
          <Select label="Sort by" value={sortLabel} onChange={setSortLabel} options={Object.keys(SORT_OPTIONS)} />
        </div>
      </Card>

      {loading && <LoadingState message="Loading player directory..." />}
      {!loading && error && <ErrorState message={error} onRetry={loadPlayers} />}
      {!loading && !error && data && (
        <Card
          title={`${data.count.toLocaleString()} player${data.count === 1 ? "" : "s"}`}
          action={(
            <div className={styles.resultActions}>
              <span className={styles.resultContext}><Users size={16} /> {data.league}</span>
              <Button variant="secondary" size="sm" icon={Download} onClick={exportDirectory}>Export CSV</Button>
            </div>
          )}
        >
          {data.players.length === 0 ? (
            <div className={styles.empty}>No players match these filters.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Player</th><th>Role</th><th>K-Means profile</th><th>Matches</th><th>Runs</th><th>Wickets</th><th>Reliability</th><th>Actions</th></tr></thead>
                <tbody>
                  {data.players.map((player) => (
                    <tr key={`${player.player_name}-${player.league_key}`}>
                      <td><strong>{player.player_name}</strong><small>Credit {player.performance_credit.toFixed(1)}</small></td>
                      <td><span className={styles.roleBadge}>{player.role}</span></td>
                      <td><span className={styles.clusterName}>{player.cluster_name}</span></td>
                      <td>{player.total_matches.toLocaleString()}</td>
                      <td>{Math.round(player.total_runs).toLocaleString()}</td>
                      <td>{Math.round(player.wickets).toLocaleString()}</td>
                      <td><strong>{(player.reliability_weight * 100).toFixed(1)}%</strong></td>
                      <td>
                        <div className={styles.rowActions}>
                          <Button variant="ghost" size="sm" icon={UserRoundSearch} onClick={() => navigate("/player-profile", { state: { player } })}>Profile</Button>
                          {isShortlisted(player) ? (
                            <Button variant="secondary" size="sm" icon={BookmarkCheck} onClick={() => removePlayer(player)}>Saved</Button>
                          ) : (
                            <Button variant="secondary" size="sm" icon={BookmarkPlus} onClick={() => addPlayer(player)}>Add</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
