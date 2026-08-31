import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Download, SlidersHorizontal } from "lucide-react";
import { fetchRecommendations } from "../api/client";
import PlayerSearchPanel from "../components/players/PlayerSearchPanel";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import Select from "../components/ui/Select";
import StatusBadge from "../components/ui/StatusBadge";
import WarningBanner from "../components/ui/WarningBanner";
import styles from "./SimilarPlayersPage.module.css";
import Button from "../components/ui/Button";
import { downloadCsv } from "../utils/csvExport";

const labelFor = (key) => key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const RELIABILITY_OPTIONS = {
  "No minimum": 0,
  "At least 25%": 0.25,
  "At least 50%": 0.5,
  "At least 75%": 0.75,
};

function FeatureComparison({ player, queryName }) {
  return (
    <details className={styles.featureDetails}>
      <summary><span>Feature-by-feature comparison</span><ChevronDown size={17} /></summary>
      <div className={styles.featureTableWrap}>
        <table className={styles.featureTable}>
          <thead><tr><th>Feature</th><th>{queryName}</th><th>{player.player_name}</th><th>Similarity</th><th>Distance share</th></tr></thead>
          <tbody>
            {player.feature_breakdown.map((feature) => (
              <tr key={feature.feature}>
                <td>{labelFor(feature.feature)}</td>
                <td>{feature.query_value.toFixed(2)}</td>
                <td>{feature.candidate_value.toFixed(2)}</td>
                <td><span className={styles.category}>{labelFor(feature.similarity_category)}</span></td>
                <td>{(feature.distance_contribution * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default function SimilarPlayersPage() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [scope, setScope] = useState("Cross-league pool");
  const [reliabilityLabel, setReliabilityLabel] = useState("No minimum");
  const [styleMatch, setStyleMatch] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = useCallback((player) => setSelectedPlayer(player), []);

  function exportRecommendations() {
    const rows = result.recommendations.map((player) => ({
      rank: player.rank,
      query_player: result.query.player_name,
      player_name: player.player_name,
      league: player.league,
      role: player.role,
      similarity_score: player.similarity_score,
      reliability: player.statistics.reliability_weight,
      broad_profile: player.clusters.broad_archetype,
      role_style: player.clusters.role_specific_style,
      why_similar: player.why_similar,
      trade_offs: player.trade_offs,
      recommendation_scope: scope,
      minimum_reliability: RELIABILITY_OPTIONS[reliabilityLabel],
      same_kmeans_style: styleMatch,
    }));
    const columns = [
      { key: "rank", label: "Rank" }, { key: "query_player", label: "Query player" },
      { key: "player_name", label: "Recommended player" }, { key: "league", label: "League" },
      { key: "role", label: "Role" }, { key: "similarity_score", label: "Similarity score" },
      { key: "reliability", label: "Reliability" }, { key: "broad_profile", label: "General K-Means profile" },
      { key: "role_style", label: "Role-specific style" }, { key: "why_similar", label: "Why similar" },
      { key: "trade_offs", label: "Trade-offs" }, { key: "recommendation_scope", label: "Scope" },
      { key: "minimum_reliability", label: "Minimum reliability" }, { key: "same_kmeans_style", label: "Same K-Means style" },
    ];
    downloadCsv(`${result.query.player_name}_KNN_recommendations.csv`, columns, rows);
  }

  useEffect(() => {
    if (!selectedPlayer) {
      setResult(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    fetchRecommendations({
      playerName: selectedPlayer.player_name,
      league: selectedPlayer.league,
      sameLeague: scope === "Same league only",
      minimumReliability: RELIABILITY_OPTIONS[reliabilityLabel],
      styleMatch,
    })
      .then((payload) => active && setResult(payload))
      .catch((requestError) => { if (active) { setResult(null); setError(requestError.message); } })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [selectedPlayer, scope, reliabilityLabel, styleMatch]);

  return (
    <>
      <PageHeader
        title="Similar Players"
        description="Find role-compatible alternatives using the frozen KNN recommender."
        action={<StatusBadge status="Available" label="KNN available" />}
      />
      <div className={styles.layout}>
        <aside className={styles.controlsColumn}>
          <PlayerSearchPanel onSelect={handleSelect} selectedPlayer={selectedPlayer} />
          <Card title="Recommendation controls" action={<SlidersHorizontal size={18} aria-hidden="true" />}>
            <div className={styles.controls}>
              <Select
                label="Recommendation scope"
                value={scope}
                onChange={setScope}
                options={["Cross-league pool", "Same league only"]}
              />
              <Select
                label="Minimum reliability"
                value={reliabilityLabel}
                onChange={setReliabilityLabel}
                options={Object.keys(RELIABILITY_OPTIONS)}
              />
              <label className={styles.checkControl}>
                <input type="checkbox" checked={styleMatch} onChange={(event) => setStyleMatch(event.target.checked)} />
                <span><strong>Same K-Means style</strong><small>Only recommend players in the same role-specific cluster.</small></span>
              </label>
            </div>
          </Card>
        </aside>

        <section className={styles.content} aria-live="polite">
          {!selectedPlayer && <EmptyState message="Select a player to find statistically similar alternatives." />}
          {selectedPlayer && loading && <LoadingState message="Applying KNN recommendation controls..." />}
          {selectedPlayer && !loading && error && <ErrorState message={error} />}
          {result?.low_confidence_warning && <WarningBanner message={`Low confidence: ${result.low_confidence_warning}`} />}
          {result?.warning && <WarningBanner message={result.warning} />}
          {result && !loading && !error && (
            <>
              <Card
                title={`Alternatives to ${result.query.player_name}`}
                action={<Button variant="secondary" size="sm" icon={Download} onClick={exportRecommendations}>Export CSV</Button>}
              >
                <p className={styles.context}>
                  {result.method} · {result.metric} distance · {result.n_eligible_candidates} eligible candidates
                </p>
                <div className={styles.activeFilters}>
                  <span>{scope}</span>
                  <span>{reliabilityLabel}</span>
                  {styleMatch && <span>Same K-Means style</span>}
                </div>
                <p className={styles.disclaimer}>{result.interpretation}</p>
              </Card>
              <div className={styles.recommendations}>
                {result.recommendations.map((player) => (
                  <Card
                    key={`${player.player_name}-${player.league_key}`}
                    title={`${player.rank}. ${player.player_name}`}
                    action={(
                      <StatusBadge
                        status={player.similarity_score < 50 ? "Low confidence" : "Available"}
                        label={`${player.similarity_score}/100 similar`}
                      />
                    )}
                  >
                    <p className={styles.context}>{player.role} · {player.league} · Reliability {(player.statistics.reliability_weight * 100).toFixed(1)}%</p>
                    <p className={styles.why}>{player.why_similar}</p>
                    <div className={styles.similarities}>
                      {Object.entries(player.group_similarities).map(([key, value]) => (
                        <div key={key}><span>{labelFor(key)}</span><strong>{value}/100</strong></div>
                      ))}
                    </div>
                    <p className={styles.tradeoff}>{player.trade_offs}</p>
                    <p className={styles.archetype}>
                      Broad profile: {player.clusters.broad_archetype} · Role style: {player.clusters.role_specific_style}
                    </p>
                    <FeatureComparison player={player} queryName={result.query.player_name} />
                  </Card>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
