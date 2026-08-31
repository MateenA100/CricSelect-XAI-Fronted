import { useCallback, useEffect, useState } from "react";
import { BarChart3, BrainCircuit, CalendarRange, Gauge, ShieldCheck, Target, TrendingUp } from "lucide-react";
import { fetchModelComparison, fetchPlayerForecast, searchForecastPlayers } from "../api/client";
import PlayerSearchPanel from "../components/players/PlayerSearchPanel";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import MetricCard from "../components/ui/MetricCard";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import WarningBanner from "../components/ui/WarningBanner";
import styles from "./ForecastPage.module.css";

const pct = (value, digits = 1) => `${(Number(value) * 100).toFixed(digits)}%`;

export default function ForecastPage() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(true);
  const [forecastError, setForecastError] = useState("");
  const [comparisonError, setComparisonError] = useState("");

  const handleSelect = useCallback((player) => setSelectedPlayer(player), []);

  useEffect(() => {
    let active = true;
    setComparisonLoading(true);
    fetchModelComparison()
      .then((payload) => active && setComparison(payload))
      .catch((error) => active && setComparisonError(error.message))
      .finally(() => active && setComparisonLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedPlayer) { setForecast(null); return undefined; }
    let active = true;
    setForecastLoading(true);
    setForecastError("");
    fetchPlayerForecast({ playerName: selectedPlayer.player_name, league: selectedPlayer.league })
      .then((payload) => active && setForecast(payload))
      .catch((error) => active && setForecastError(error.message))
      .finally(() => active && setForecastLoading(false));
    return () => { active = false; };
  }, [selectedPlayer]);

  return (
    <>
      <PageHeader
        title="Next-Season Forecast"
        description="Explore frozen FT-Transformer player forecasts and the complete 2024 model evaluation."
        action={<StatusBadge status="Available" label="FT-Transformer frozen" />}
      />

      <div className={styles.page}>
        <div className={styles.forecastLayout}>
          <PlayerSearchPanel
            onSelect={handleSelect}
            selectedPlayer={selectedPlayer}
            searchFunction={searchForecastPlayers}
            titlePrefix="Forecast"
          />
          <section aria-live="polite">
            {!selectedPlayer && <EmptyState message="Search for a player with a 2024 point-in-time forecast." />}
            {selectedPlayer && forecastLoading && <LoadingState message="Loading the frozen player forecast..." />}
            {selectedPlayer && !forecastLoading && forecastError && <ErrorState message={forecastError} />}
            {forecast && !forecastLoading && !forecastError && (
              <div className={styles.forecastResult}>
                <Card title={forecast.player.player_name} action={<StatusBadge status="Available" label={`${forecast.player.role} · ${forecast.player.league}`} />}>
                  <div className={styles.metrics}>
                    <MetricCard label="Predicted tier" value={forecast.forecast.predicted_tier} subLabel={`${forecast.forecast.model} primary forecast`} icon={Target} />
                    <MetricCard label="Elite probability" value={pct(forecast.forecast.probabilities.elite)} subLabel="Model probability, not a guarantee" icon={TrendingUp} />
                    <MetricCard label="Ranking score" value={Number(forecast.forecast.normalized_ranking_score).toFixed(3)} subLabel="Expected tier normalised to 0–1" icon={Gauge} />
                    <MetricCard label="Forecast window" value={`${forecast.forecast.feature_cutoff_season} → ${forecast.forecast.target_season}`} subLabel="No target-season features used" icon={CalendarRange} />
                  </div>
                  <div className={styles.probabilityPanel}>
                    {Object.entries(forecast.forecast.probabilities).map(([tier, value]) => (
                      <div key={tier}>
                        <div className={styles.probabilityHeading}><span>{tier}</span><strong>{pct(value)}</strong></div>
                        <div className={styles.track}><span className={styles[tier]} style={{ width: pct(value) }} /></div>
                      </div>
                    ))}
                  </div>
                </Card>

                <div className={styles.forecastDetailGrid}>
                  <Card title="Model agreement">
                    <div className={styles.modelAgreement}>
                      {forecast.model_predictions.map((model) => (
                        <div key={model.model}>
                          <span>{model.model}{model.is_primary ? " · primary" : model.is_baseline ? " · baseline" : ""}</span>
                          <strong>{model.predicted_tier}</strong>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card title="Historical context">
                    {forecast.historical_context ? (
                      <div className={styles.contextGrid}>
                        <div><span>Reliability</span><strong>{pct(forecast.historical_context.reliability)}</strong></div>
                        <div><span>Recent-form percentile</span><strong>{forecast.historical_context.recent_form_percentile == null ? "Unavailable" : pct(forecast.historical_context.recent_form_percentile)}</strong></div>
                        <div><span>Recent seasons used</span><strong>{forecast.historical_context.recent_seasons_used}</strong></div>
                      </div>
                    ) : <p>No supporting context is available.</p>}
                  </Card>
                </div>
                <WarningBanner tone="info" message={forecast.interpretation} />
              </div>
            )}
          </section>
        </div>

        <section className={styles.comparisonSection} id="model-comparison">
          <div className={styles.sectionHeading}>
            <div><span>Final evaluation</span><h2>How every forecasting model performed</h2></div>
            {comparison && <StatusBadge status="Available" label={`${comparison.evaluation.holdout_rows} untouched 2024 rows`} />}
          </div>
          {comparisonLoading && <LoadingState message="Loading model-comparison evidence..." />}
          {!comparisonLoading && comparisonError && <ErrorState message={comparisonError} />}
          {!comparisonLoading && comparison && (
            <>
              <WarningBanner tone="info" message={comparison.decision.policy} />
              <div className={styles.decisionGrid}>
                <MetricCard label="Frozen primary model" value={comparison.decision.primary_model} subLabel="Selected before viewing 2024" icon={BrainCircuit} />
                <MetricCard label="Best 2024 point estimate" value={comparison.decision.best_2024_point_estimate} subLabel={`Macro F1 ${comparison.decision.best_2024_macro_f1.toFixed(3)}`} icon={BarChart3} />
                <MetricCard label="Primary evaluation metric" value={comparison.evaluation.primary_metric} subLabel="Equal importance for all three tiers" icon={ShieldCheck} />
              </div>
              <Card title="2024 holdout comparison">
                <div className={styles.tableScroller}>
                <div className={styles.comparisonTable} role="table" aria-label="2024 model performance comparison">
                  <div className={`${styles.comparisonRow} ${styles.tableHeader}`} role="row">
                    <span>Model</span><span>Macro F1</span><span>Balanced accuracy</span><span>Elite recall</span><span>95% F1 interval</span>
                  </div>
                  {comparison.models.map((model) => (
                    <div className={`${styles.comparisonRow} ${model.is_primary ? styles.primaryRow : ""}`} role="row" key={model.model}>
                      <span><strong>{model.model}</strong><small>{model.is_primary ? "Frozen primary" : model.is_baseline ? "Baseline" : "Candidate"}</small></span>
                      <span>{model.macro_f1.toFixed(3)}</span>
                      <span>{model.balanced_accuracy.toFixed(3)}</span>
                      <span>{model.elite_recall.toFixed(3)}</span>
                      <span>{model.macro_f1_ci ? `${model.macro_f1_ci.lower.toFixed(3)}–${model.macro_f1_ci.upper.toFixed(3)}` : "Not bootstrapped"}</span>
                    </div>
                  ))}
                </div>
                </div>
              </Card>
              <WarningBanner tone="warning" message={comparison.conclusion} />
            </>
          )}
        </section>
      </div>
    </>
  );
}
