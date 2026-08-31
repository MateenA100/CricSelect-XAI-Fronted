import { useCallback, useEffect, useState } from "react";
import { Activity, BrainCircuit, ShieldCheck, Sparkles, Target, Users } from "lucide-react";
import { fetchOverview } from "../api/client";
import { useLeague } from "../context/LeagueContextCore";
import Card from "../components/ui/Card";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import MetricCard from "../components/ui/MetricCard";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import styles from "./OverviewPage.module.css";

const formatPercent = (value) => `${(value * 100).toFixed(1)}%`;

function DistributionRow({ label, count, share, accent = false }) {
  return (
    <div className={styles.distributionRow}>
      <div className={styles.rowHeading}>
        <span>{label}</span>
        <strong>{count}</strong>
      </div>
      <div className={styles.track} aria-label={`${label}: ${count}, ${formatPercent(share)}`}>
        <span
          className={accent ? styles.clusterFill : styles.roleFill}
          style={{ width: `${Math.max(share * 100, 1)}%` }}
        />
      </div>
      <span className={styles.share}>{formatPercent(share)} of league players</span>
    </div>
  );
}

export default function OverviewPage() {
  const { selectedLeague } = useLeague();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOverview(await fetchOverview({ league: selectedLeague }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  return (
    <>
      <PageHeader
        title="League Overview"
        description={`Verified player and clustering summary for ${selectedLeague}.`}
        action={<StatusBadge status="Available" label="Live data" />}
      />

      {loading && <LoadingState message={`Loading ${selectedLeague} overview...`} />}
      {!loading && error && <ErrorState message={error} onRetry={loadOverview} />}

      {!loading && !error && overview && (
        <div className={styles.page}>
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <span className={styles.heroEyebrow}><Sparkles size={15} /> Explainable selection intelligence</span>
              <h2>From player evidence to a stronger XI.</h2>
              <p>Profile playing styles, forecast next-season tiers, discover role-compatible replacements and build balanced teams — with every recommendation traceable to saved analytical evidence.</p>
              <div className={styles.heroPills}>
                <span><BrainCircuit size={15} /> Five analytical modules</span>
                <span><Target size={15} /> Five T20 leagues</span>
                <span><ShieldCheck size={15} /> Leakage-safe forecasting</span>
              </div>
            </div>
            <div className={styles.pitchGraphic} aria-hidden="true">
              <span className={styles.pitchLine} />
              <span className={styles.wicket}><i/><i/><i/></span>
              <span className={styles.ball} />
              <span className={styles.trajectory} />
            </div>
          </section>
          <div className={styles.metrics}>
            <MetricCard
              label="Total players"
              value={overview.summary.total_players.toLocaleString()}
              subLabel={`Player records in ${overview.league}`}
              icon={Users}
            />
            <MetricCard
              label="Average performance credit"
              value={overview.summary.average_performance_credit.toFixed(2)}
              subLabel="Mean combined performance score"
              icon={Activity}
            />
            <MetricCard
              label="Average reliability"
              value={formatPercent(overview.summary.average_reliability)}
              subLabel="Mean historical evidence weight"
              icon={ShieldCheck}
            />
          </div>

          <div className={styles.grid}>
            <Card title="Role distribution" action={<span className={styles.cardHint}>All players</span>}>
              <div className={styles.distributionList}>
                {overview.role_distribution.map((item) => (
                  <DistributionRow key={item.role} {...item} />
                ))}
              </div>
            </Card>

            <Card title="K-Means cluster distribution" action={<span className={styles.cardHint}>K = 4</span>}>
              <div className={styles.distributionList}>
                {overview.cluster_distribution.map((item) => (
                  <DistributionRow
                    key={item.cluster}
                    label={`Cluster ${item.cluster + 1}: ${item.name}`}
                    count={item.count}
                    share={item.share}
                    accent
                  />
                ))}
              </div>
              <p className={styles.note}>{overview.interpretation}</p>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
