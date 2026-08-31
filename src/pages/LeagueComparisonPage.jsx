import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, CalendarRange, Database, ShieldCheck } from "lucide-react";
import { fetchLeagueComparison } from "../api/client";
import Card from "../components/ui/Card";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import MetricCard from "../components/ui/MetricCard";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import WarningBanner from "../components/ui/WarningBanner";
import styles from "./LeagueComparisonPage.module.css";

const pct = (value) => `${(value * 100).toFixed(1)}%`;
const ROLE_CLASSES = ["batters", "bowlers", "allRounders", "wicketkeepers"];

function ComparisonBars({ leagues, metric, format, label }) {
  const maximum = Math.max(...leagues.map((league) => league[metric]));
  return (
    <div className={styles.barList}>
      {leagues.map((league) => (
        <div key={league.league} className={styles.barRow}>
          <span>{league.league}</span>
          <div className={styles.track} aria-label={`${league.league} ${label}: ${format(league[metric])}`}>
            <i style={{ width: `${(league[metric] / maximum) * 100}%` }} />
          </div>
          <strong>{format(league[metric])}</strong>
        </div>
      ))}
    </div>
  );
}

export default function LeagueComparisonPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadComparison = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setData(await fetchLeagueComparison()); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadComparison(); }, [loadComparison]);
  const roleLabels = useMemo(() => data?.leagues[0]?.roles.map((role) => role.label) ?? [], [data]);

  return (
    <>
      <PageHeader
        title="Cross-League Comparison"
        description="Compare dataset coverage and player composition across all five competitions."
        action={<StatusBadge status="Available" label="Five leagues" />}
      />
      {loading && <LoadingState message="Preparing cross-league comparison..." />}
      {!loading && error && <ErrorState message={error} onRetry={loadComparison} />}
      {!loading && !error && data && (
        <div className={styles.page}>
          <div className={styles.summaryMetrics}>
            <MetricCard label="Leagues compared" value={data.leagues.length} subLabel={data.leagues.map((league) => league.league).join(" · ")} icon={BarChart3} />
            <MetricCard label="Player-league records" value={data.total_player_league_records.toLocaleString()} subLabel="Complete prepared master dataset" icon={Database} />
            <MetricCard label="Data through" value={data.data_through_season} subLabel="Latest included season" icon={CalendarRange} />
          </div>

          <WarningBanner tone="info" message={data.interpretation} />

          <div className={styles.leagueGrid}>
            {data.leagues.map((league) => (
              <Card key={league.league} title={league.league} action={<strong className={styles.playerCount}>{league.total_players}</strong>}>
                <p className={styles.datasetShare}>{pct(league.dataset_share)} of all prepared records</p>
                <div className={styles.miniMetrics}>
                  <div><Activity size={17} /><span>Average credit</span><strong>{league.average_performance_credit.toFixed(2)}</strong></div>
                  <div><ShieldCheck size={17} /><span>Reliability</span><strong>{pct(league.average_reliability)}</strong></div>
                </div>
                <div className={styles.stackedBar} aria-label={`${league.league} role distribution`}>
                  {league.roles.map((role, index) => <span key={role.role} className={styles[ROLE_CLASSES[index]]} style={{ width: `${role.share * 100}%` }} />)}
                </div>
                <ul className={styles.roleCounts}>
                  {league.roles.map((role, index) => <li key={role.role}><i className={styles[ROLE_CLASSES[index]]} /><span>{role.label}</span><strong>{role.count}</strong></li>)}
                </ul>
              </Card>
            ))}
          </div>

          <div className={styles.comparisonGrid}>
            <Card title="Player-record coverage by league">
              <ComparisonBars leagues={data.leagues} metric="total_players" label="players" format={(value) => value.toLocaleString()} />
            </Card>
            <Card title="Average performance credit">
              <ComparisonBars leagues={data.leagues} metric="average_performance_credit" label="average performance credit" format={(value) => value.toFixed(2)} />
            </Card>
            <Card title="Average reliability">
              <ComparisonBars leagues={data.leagues} metric="average_reliability" label="average reliability" format={pct} />
            </Card>
          </div>

          <Card title="Exact role counts" action={<span className={styles.tableNote}>Prepared player-league records</span>}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>League</th><th>Total</th>{roleLabels.map((label) => <th key={label}>{label}</th>)}<th>Average credit</th><th>Reliability</th></tr></thead>
                <tbody>{data.leagues.map((league) => <tr key={league.league}><td><strong>{league.league}</strong></td><td>{league.total_players}</td>{league.roles.map((role) => <td key={role.role}>{role.count}</td>)}<td>{league.average_performance_credit.toFixed(2)}</td><td>{pct(league.average_reliability)}</td></tr>)}</tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
