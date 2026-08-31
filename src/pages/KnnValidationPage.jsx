import { useCallback, useEffect, useState } from "react";
import { Activity, BadgeCheck, CircleDot, FlaskConical, Gauge, ShieldAlert, Users } from "lucide-react";
import { fetchKnnValidation } from "../api/client";
import Card from "../components/ui/Card";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import MetricCard from "../components/ui/MetricCard";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import WarningBanner from "../components/ui/WarningBanner";
import styles from "./KnnValidationPage.module.css";

const pct = (value, digits = 1) => `${(value * 100).toFixed(digits)}%`;

export default function KnnValidationPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadValidation = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setData(await fetchKnnValidation()); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadValidation(); }, [loadValidation]);

  return (
    <>
      <PageHeader
        title="KNN Validation & Methodology"
        description="Evidence supporting the deployed similar-player recommender."
        action={<StatusBadge status="Available" label="Validated KNN" />}
      />
      {loading && <LoadingState message="Loading KNN validation evidence..." />}
      {!loading && error && <ErrorState message={error} onRetry={loadValidation} />}
      {!loading && !error && data && (
        <div className={styles.page}>
          <div className={styles.metrics}>
            <MetricCard label="Neighbours returned" value={`K = ${data.design.k}`} subLabel="Five alternatives by default" icon={Users} />
            <MetricCard label="Distance metric" value="Euclidean" subLabel="Frozen deployed configuration" icon={CircleDot} />
            <MetricCard label="Recommendation stability" value={pct(data.stability.overall_mean_jaccard)} subLabel="Mean neighbour-list overlap" icon={Gauge} />
            <MetricCard label="Live player coverage" value={pct(data.neighbour_quality.live_coverage, 0)} subLabel="Default recommendation mode" icon={BadgeCheck} />
          </div>

          <WarningBanner tone="info" message={data.design.similarity_interpretation} />

          <div className={styles.twoColumn}>
            <Card title="How the deployed KNN works" action={<Activity size={19} aria-hidden="true" />}>
              <ol className={styles.steps}>
                <li><span>1</span><p><strong>Role matching</strong>{data.design.population_rule}</p></li>
                <li><span>2</span><p><strong>Feature standardisation</strong>Role-relevant statistics are placed on comparable numerical scales.</p></li>
                <li><span>3</span><p><strong>Distance calculation</strong>Euclidean distance measures how far each eligible player is from the query player.</p></li>
                <li><span>4</span><p><strong>Neighbour retrieval</strong>The five closest eligible players become the recommendations.</p></li>
              </ol>
            </Card>

            <Card title="Stability under small input changes" action={<FlaskConical size={19} aria-hidden="true" />}>
              <p className={styles.explanation}>{data.stability.interpretation}</p>
              <div className={styles.roleStability}>
                {data.stability.by_role.map((role) => (
                  <div key={role.role_population}>
                    <div><span>{role.role_population}</span><strong>{pct(role.mean_jaccard_overlap)}</strong></div>
                    <div className={styles.track}><span style={{ width: `${role.mean_jaccard_overlap * 100}%` }} /></div>
                    <small>{role.repetitions} perturbation runs · sample {role.sample_size}</small>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card title="Leakage-safe 2024 outcome validation" action={<StatusBadge status="Available" label={`${data.temporal_validation.included_players} players`} />}>
            <p className={styles.explanation}>{data.temporal_validation.interpretation}</p>
            <div className={styles.evidenceGrid}>
              <div><span>Validation coverage</span><strong>{pct(data.temporal_validation.coverage_rate)}</strong><small>{data.temporal_validation.included_players} of {data.temporal_validation.initial_eligible_players}</small></div>
              <div><span>Future-tier agreement</span><strong>{pct(data.temporal_validation.future_tier_agreement)}</strong><small>Similarity evidence—not accuracy</small></div>
              <div><span>Elite-neighbour precision</span><strong>{pct(data.temporal_validation.elite_neighbour_precision)}</strong><small>Elite neighbours with elite outcomes</small></div>
              <div><span>Outcome correlation</span><strong>{data.temporal_validation.outcome_spearman.toFixed(3)}</strong><small>Spearman association</small></div>
            </div>
          </Card>

          <Card title="Additional quality checks">
            <div className={styles.qualityGrid}>
              <div><strong>{pct(data.neighbour_quality.reciprocal_neighbour_rate)}</strong><span>Reciprocal-neighbour rate</span><p>How often a recommendation also identifies the query as a close neighbour.</p></div>
              <div><strong>{pct(data.neighbour_quality.hubness_top_one_percent_share)}</strong><span>Top-1% hub share</span><p>No hubness concern was detected; a few players do not dominate recommendation lists.</p></div>
            </div>
          </Card>

          <Card title="Important limitations" action={<ShieldAlert size={19} aria-hidden="true" />}>
            <ul className={styles.limitations}>{data.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
          </Card>
        </div>
      )}
    </>
  );
}
