import { useCallback, useEffect, useState } from "react";
import { CalendarRange, CheckCircle2, Clock3, Database, Layers3, ServerCog, ShieldCheck } from "lucide-react";
import { fetchSystemStatus } from "../api/client";
import Card from "../components/ui/Card";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import MetricCard from "../components/ui/MetricCard";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import styles from "./SystemStatusPage.module.css";

export default function SystemStatusPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setData(await fetchSystemStatus()); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  return (
    <>
      <PageHeader
        title="System Status & Methodology"
        description="Current data coverage, connected modules and deployment method."
        action={<StatusBadge status="Available" label="Backend connected" />}
      />
      {loading && <LoadingState message="Checking saved artifacts..." />}
      {!loading && error && <ErrorState message={error} onRetry={loadStatus} />}
      {!loading && !error && data && (
        <div className={styles.page}>
          <div className={styles.metrics}>
            <MetricCard label="League coverage" value={data.coverage.leagues.length} subLabel={data.coverage.leagues.join(" · ")} icon={Layers3} />
            <MetricCard label="Data available through" value={data.coverage.data_through_season} subLabel="Latest included season" icon={CalendarRange} />
            <MetricCard label="Player-league records" value={data.coverage.player_league_records.toLocaleString()} subLabel="Prepared master dataset" icon={Database} />
          </div>

          <Card title="Module availability" action={<ShieldCheck size={19} aria-hidden="true" />}>
            <div className={styles.moduleGrid}>
              {data.modules.map((module) => {
                const available = module.status === "available";
                const Icon = available ? CheckCircle2 : Clock3;
                return (
                  <article key={module.key} className={`${styles.module} ${available ? styles.available : styles.pending}`}>
                    <div className={styles.moduleTop}>
                      <span className={styles.icon}><Icon size={20} /></span>
                      <StatusBadge status={available ? "Available" : "Pending"} />
                    </div>
                    <h3>{module.name}</h3>
                    <p>{module.description}</p>
                  </article>
                );
              })}
            </div>
          </Card>

          <Card title={data.runtime_method.title} action={<ServerCog size={20} aria-hidden="true" />}>
            <div className={styles.runtime}>
              <div><strong>What happens when the dashboard starts?</strong><p>{data.runtime_method.description}</p></div>
              <div><strong>Why use this approach?</strong><p>{data.runtime_method.benefit}</p></div>
            </div>
            <div className={styles.flow} aria-label="Offline training produces saved artifacts used by the dashboard">
              <span>Offline notebooks</span><i>→</i><span>Saved artifacts</span><i>→</i><span>Backend loads once</span><i>→</i><span>Fast dashboard response</span>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
