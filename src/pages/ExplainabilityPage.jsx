import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, Sparkles, Target } from "lucide-react";
import { fetchPlayerExplanation, searchForecastPlayers } from "../api/client";
import PlayerSearchPanel from "../components/players/PlayerSearchPanel";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import MetricCard from "../components/ui/MetricCard";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import WarningBanner from "../components/ui/WarningBanner";
import styles from "./ExplainabilityPage.module.css";

const pct = (value, digits = 1) => `${(Number(value) * 100).toFixed(digits)}%`;

function displayValue(factor) {
  if (factor.is_missing) return factor.interpretation || "Value unavailable";
  if (typeof factor.feature_value === "number") return Number(factor.feature_value).toLocaleString(undefined, { maximumFractionDigits: 4 });
  return String(factor.feature_value ?? "Not recorded");
}

function FactorList({ factors, direction }) {
  const maximum = Math.max(...factors.map((factor) => Math.abs(Number(factor.shap_value))), 0.000001);
  return (
    <div className={styles.factorList}>
      {factors.map((factor) => (
        <div className={styles.factor} key={`${direction}-${factor.feature}`}>
          <div className={styles.factorHeading}>
            <div><strong>{factor.display_name}</strong><small>{displayValue(factor)}</small></div>
            <span className={direction === "supporting" ? styles.positive : styles.negative}>
              {Number(factor.shap_value) >= 0 ? "+" : ""}{Number(factor.shap_value).toFixed(4)}
            </span>
          </div>
          <div className={styles.track} aria-hidden="true">
            <span className={direction === "supporting" ? styles.positiveBar : styles.negativeBar} style={{ width: `${Math.max(5, Math.abs(Number(factor.shap_value)) / maximum * 100)}%` }} />
          </div>
          {factor.interpretation && !factor.is_missing && <p>{factor.interpretation}</p>}
        </div>
      ))}
    </div>
  );
}

export default function ExplainabilityPage() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSelect = useCallback((player) => setSelectedPlayer(player), []);

  useEffect(() => {
    if (!selectedPlayer) { setData(null); return undefined; }
    let active = true;
    setLoading(true);
    setError("");
    fetchPlayerExplanation({ playerName: selectedPlayer.player_name, league: selectedPlayer.league })
      .then((payload) => active && setData(payload))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [selectedPlayer]);

  return (
    <>
      <PageHeader
        title="Explainability"
        description="See which verified player statistics supported or reduced the frozen FT-Transformer forecast."
        action={<StatusBadge status="Available" label="Notebook 22 SHAP" />}
      />
      <div className={styles.layout}>
        <PlayerSearchPanel onSelect={handleSelect} selectedPlayer={selectedPlayer} searchFunction={searchForecastPlayers} titlePrefix="Explain" />
        <section aria-live="polite">
          {!selectedPlayer && <EmptyState message="Search for a player to understand the model's 2024 tier forecast." />}
          {selectedPlayer && loading && <LoadingState message="Loading the frozen SHAP explanation..." />}
          {selectedPlayer && !loading && error && <ErrorState message={error} />}
          {data && !loading && !error && (
            <div className={styles.results}>
              <Card title={data.player.player_name} action={<StatusBadge status="Available" label={`${data.player.role} · ${data.player.league}`} />}>
                <div className={styles.metrics}>
                  <MetricCard label="Explained forecast" value={data.forecast.predicted_tier} subLabel={`${data.forecast.cutoff_season} → ${data.forecast.target_season}`} icon={Target} />
                  <MetricCard label="Leading probability" value={pct(data.forecast.leading_probability)} subLabel={`${pct(data.forecast.top_two_margin)} ahead of second tier`} icon={Sparkles} />
                  <MetricCard label="Explanation coverage" value={pct(data.explanation.coverage)} subLabel="Frozen player explanation available" icon={CheckCircle2} />
                  <MetricCard label="Validation" value={`${data.validation.checks_passed}/${data.validation.checks_total}`} subLabel="Notebook 22 checks passed" icon={ShieldCheck} />
                </div>
                <div className={styles.probabilities}>
                  {Object.entries(data.forecast.probabilities).map(([tier, probability]) => (
                    <div key={tier}><span>{tier}</span><strong>{pct(probability)}</strong></div>
                  ))}
                </div>
              </Card>

              {data.wording && (
                <Card
                  title="Selector summary"
                  action={<StatusBadge status="Available" label={data.wording.source_label || "Verified explanation"} />}
                >
                  <div className={styles.wordingBody}>
                    <p className={styles.wordingHeadline}>{data.wording.headline}</p>
                    <p className={styles.wordingSummary}>{data.wording.prediction_summary}</p>
                    <p className={styles.wordingSummary}>{data.wording.selector_summary}</p>
                    <p className={styles.wordingSummary}><em>{data.wording.uncertainty_note}</em></p>
                    <p className={styles.wordingNote}>{data.wording.disclaimer}</p>
                    <p className={styles.wordingNote}>{data.wording.source_note}</p>
                  </div>
                </Card>
              )}

              {data.wording?.source === "verified_hybrid_llama" && (
                <WarningBanner tone="info" message="Hybrid explanation: Python supplied verified SHAP facts, Llama produced the summary, and the result passed automatic grounding validation." />
              )}
              {data.wording?.source === "automatic_template_fallback" && (
                <WarningBanner tone="warning" message="Safety fallback used: the Llama summary failed automatic validation, so verified deterministic wording is displayed instead." />
              )}

              <div className={styles.factorGrid}>
                <Card title={`Factors supporting ${data.explanation.explained_class}`}>
                  <FactorList factors={data.explanation.supporting_factors} direction="supporting" />
                </Card>
                <Card title={`Factors limiting ${data.explanation.explained_class}`}>
                  <FactorList factors={data.explanation.limiting_factors} direction="limiting" />
                </Card>
              </div>
              <WarningBanner tone="info" message={data.explanation.interpretation} />
              <WarningBanner tone="warning" message="SHAP explains how the fitted model used these inputs for this forecast. It does not prove that a statistic caused future performance or guarantee the predicted tier." />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
