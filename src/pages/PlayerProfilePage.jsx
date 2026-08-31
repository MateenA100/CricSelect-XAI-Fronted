import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Activity, Award, ShieldCheck, Trophy } from "lucide-react";
import { fetchPlayerProfile } from "../api/client";
import PlayerSearchPanel from "../components/players/PlayerSearchPanel";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import MetricCard from "../components/ui/MetricCard";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import styles from "./PlayerProfilePage.module.css";

const formatNumber = (value, digits = 2) => value == null ? "Not available" : Number(value).toFixed(digits);

function StatGroup({ title, rows }) {
  return (
    <div className={styles.statGroup}>
      <h4>{title}</h4>
      <dl className={styles.stats}>
        {rows.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>
    </div>
  );
}

export default function PlayerProfilePage() {
  const location = useLocation();
  const initialPlayer = location.state?.player ?? null;
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = useCallback((player) => setSelectedPlayer(player), []);

  useEffect(() => {
    if (!selectedPlayer) {
      setProfile(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    fetchPlayerProfile({ playerName: selectedPlayer.player_name, league: selectedPlayer.league })
      .then((result) => active && setProfile(result.player))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [selectedPlayer]);

  return (
    <>
      <PageHeader
        title="Player Profile"
        description="Explore verified career statistics and K-Means player archetypes."
        action={<StatusBadge status="Available" label="K-Means available" />}
      />
      <div className={styles.layout}>
        <PlayerSearchPanel onSelect={handleSelect} selectedPlayer={selectedPlayer} initialPlayer={initialPlayer} />
        <section className={styles.content} aria-live="polite">
          {!selectedPlayer && <EmptyState message="Search for and select a player to view their profile." />}
          {selectedPlayer && loading && <LoadingState message="Loading player profile..." />}
          {selectedPlayer && !loading && error && <ErrorState message={error} />}
          {profile && !loading && !error && (
            <>
              <Card title={profile.player_name} action={<StatusBadge status="Available" label={profile.role} />}>
                <p className={styles.league}>{profile.league} · Data through 2024</p>
                <div className={styles.metrics}>
                  <MetricCard label="Matches" value={formatNumber(profile.statistics.total_matches, 0)} icon={Activity} />
                  <MetricCard label="Performance credit" value={formatNumber(profile.statistics.performance_credit)} icon={Trophy} />
                  <MetricCard label="Reliability" value={`${formatNumber(profile.statistics.reliability_weight * 100, 1)}%`} icon={ShieldCheck} />
                  <MetricCard label="Role" value={profile.role} icon={Award} />
                </div>
              </Card>

              <div className={styles.clusters}>
                <Card title="General K-Means profile">
                  <p className={styles.clusterName}>{profile.clusters.general.name}</p>
                  <p className={styles.help}>{profile.clusters.general.meaning}</p>
                </Card>
                <Card title="Role-specific K-Means style">
                  <p className={styles.clusterName}>{profile.clusters.role_specific.name}</p>
                  <p className={styles.help}>{profile.clusters.role_specific.meaning}</p>
                </Card>
              </div>

              <Card title="Supporting statistics">
                <div className={styles.statSections}>
                  {Boolean(profile.statistics.has_batting_record) && (
                    <StatGroup title="Batting" rows={[
                      ["Total runs", formatNumber(profile.statistics.total_runs, 0)],
                      ["Batting average", formatNumber(profile.statistics.batting_average)],
                      ["Strike rate", formatNumber(profile.statistics.strike_rate)],
                      ["Recent strike rate", formatNumber(profile.statistics.recent_strike_rate)],
                      ["Recent runs per match", formatNumber(profile.statistics.recent_runs_per_match)],
                    ]} />
                  )}
                  {Boolean(profile.statistics.has_bowling_record) && (
                    <StatGroup title="Bowling" rows={[
                      ["Wickets", formatNumber(profile.statistics.wickets, 0)],
                      ["Economy rate", formatNumber(profile.statistics.economy_rate)],
                      ["Wickets per match", formatNumber(profile.statistics.wickets_per_match)],
                      ["Recent economy rate", formatNumber(profile.statistics.recent_economy_rate)],
                      ["Recent wickets per match", formatNumber(profile.statistics.recent_wickets_per_match)],
                    ]} />
                  )}
                </div>
              </Card>
            </>
          )}
        </section>
      </div>
    </>
  );
}
