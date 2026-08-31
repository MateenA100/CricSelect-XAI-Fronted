import { useCallback, useEffect, useState } from "react";
import { GitBranch, Layers3, Users } from "lucide-react";
import { fetchKMeansProfiles } from "../api/client";
import { useLeague } from "../context/LeagueContextCore";
import Card from "../components/ui/Card";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import styles from "./KMeansProfilesPage.module.css";

const percent = (value) => `${(value * 100).toFixed(1)}%`;

export default function KMeansProfilesPage() {
  const { selectedLeague } = useLeague();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchKMeansProfiles({ league: selectedLeague }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  return (
    <>
      <PageHeader
        title="K-Means Player Profiles"
        description={`Explore broad and role-specific player groupings for ${selectedLeague}.`}
        action={<StatusBadge status="Available" label="Frozen K-Means" />}
      />
      {loading && <LoadingState message="Loading cluster profiles..." />}
      {!loading && error && <ErrorState message={error} onRetry={loadProfiles} />}
      {!loading && !error && data && (
        <div className={styles.page}>
          <section>
            <div className={styles.sectionHeading}>
              <div><span className={styles.eyebrow}>General model</span><h2>Four broad player clusters</h2></div>
              <span className={styles.total}><Users size={17} /> {data.total_players} {data.league} players</span>
            </div>
            <div className={styles.clusterGrid}>
              {data.general_clusters.map((cluster) => (
                <Card
                  key={cluster.cluster}
                  title={`Cluster ${cluster.cluster + 1}`}
                  action={<strong className={styles.count}>{cluster.count}</strong>}
                >
                  <h3 className={styles.clusterName}>{cluster.name}</h3>
                  <div className={styles.track}><span style={{ width: `${cluster.share * 100}%` }} /></div>
                  <p className={styles.share}>{percent(cluster.share)} of selected-league players</p>
                  <p className={styles.description}>{cluster.description}</p>
                  <div className={styles.representatives}>
                    <strong>Nearest-centre examples</strong>
                    <p>Global examples from all five leagues—not a ranking.</p>
                    <ul>
                      {cluster.representative_players.slice(0, 3).map((player) => (
                        <li key={`${player.player_name}-${player.league}`}>
                          <span>{player.player_name}</span><small>{player.role} · {player.league.replace("_", " ")}</small>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <Card title="General versus role-specific K-Means" action={<GitBranch size={19} aria-hidden="true" />}>
            <div className={styles.comparison}>
              <div><Layers3 size={22} /><h3>General clusters</h3><p>{data.comparison.general}</p></div>
              <div><GitBranch size={22} /><h3>Role-specific clusters</h3><p>{data.comparison.role_specific}</p></div>
            </div>
            <p className={styles.relationship}>{data.comparison.relationship}</p>
          </Card>

          <section>
            <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Detailed view</span><h2>Role-specific styles</h2></div></div>
            <div className={styles.roleGrid}>
              {data.role_specific_models.map((model) => (
                <Card key={model.population} title={model.population} action={<span className={styles.modelCount}>{model.player_count} players</span>}>
                  <ul className={styles.profileList}>
                    {model.profiles.map((profile) => (
                      <li key={profile.cluster}><span>{profile.name}</span><strong>{profile.count}</strong></li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
