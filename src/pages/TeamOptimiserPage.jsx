import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Activity, ArrowLeft, CheckCircle2, Crosshair, ListChecks, ShieldCheck, Sparkles, Target, Users } from "lucide-react";
import { fetchIlpTeam, fetchIlpValidation, optimiseShortlistTeam } from "../api/client";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import MetricCard from "../components/ui/MetricCard";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import WarningBanner from "../components/ui/WarningBanner";
import { useLeague } from "../context/LeagueContextCore";
import { useShortlist } from "../context/ShortlistContextCore";
import styles from "./TeamOptimiserPage.module.css";

const pct = (value, digits = 1) => `${(Number(value) * 100).toFixed(digits)}%`;
const score = (value) => Number(value).toFixed(3);
const ROLE_ORDER = ["Batsman", "Wicketkeeper-Batsman", "All-Rounder", "Bowler"];

function TeamRoster({ team, title, statusLabel }) {
  const grouped = ROLE_ORDER.map((role) => ({ role, players: team.filter((player) => player.role === role) }))
    .filter((group) => group.players.length);
  return (
    <Card title={title} action={<StatusBadge status="Optimal" label={statusLabel} />}>
      <div className={styles.roleGroups}>
        {grouped.map((group) => (
          <section key={group.role} className={styles.roleGroup}>
            <header><h4>{group.role}</h4><span>{group.players.length} selected</span></header>
            <div className={styles.playerList}>
              {group.players.map((player) => (
                <article className={styles.playerCard} key={`${player.player_name}-${player.league_key}`}>
                  <div className={styles.playerHeading}>
                    <div><strong>{player.player_name}</strong><span>{player.league}</span></div>
                    <span className={`${styles.tier} ${styles[player.predicted_tier.toLowerCase()]}`}>{player.predicted_tier}</span>
                  </div>
                  <div className={styles.scoreRow}><span>Selection score</span><strong>{score(player.selection_score)}</strong></div>
                  <div className={styles.probabilityBar} aria-label={`Tier probabilities for ${player.player_name}`}>
                    <span className={styles.poorBar} style={{ width: pct(player.probabilities.poor) }} />
                    <span className={styles.averageBar} style={{ width: pct(player.probabilities.average) }} />
                    <span className={styles.eliteBar} style={{ width: pct(player.probabilities.elite) }} />
                  </div>
                  <div className={styles.probabilityLabels}>
                    <span>Poor {pct(player.probabilities.poor, 0)}</span>
                    <span>Average {pct(player.probabilities.average, 0)}</span>
                    <span>Elite {pct(player.probabilities.elite, 0)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Card>
  );
}

function SelectionRules({ constraints }) {
  return (
    <Card title="Selection rules" action={<CheckCircle2 size={19} aria-hidden="true" />}>
      <dl className={styles.rules}>
        <div><dt>Team size</dt><dd>Exactly {constraints.team_size}</dd></div>
        {Object.entries(constraints.role_ranges).map(([role, range]) => (
          <div key={role}><dt>{role}</dt><dd>{range[0]}–{range[1]}</dd></div>
        ))}
        <div><dt>Batting options</dt><dd>At least {constraints.min_batting_options}</dd></div>
        <div><dt>Bowling options</dt><dd>At least {constraints.min_bowling_options}</dd></div>
      </dl>
    </Card>
  );
}

export default function TeamOptimiserPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedLeague } = useLeague();
  const { shortlist } = useShortlist();
  const leagueKey = selectedLeague === "T20 Blast" ? "T20_Blast" : selectedLeague;
  const shortlistedPlayers = shortlist.filter((player) => player.league_key === leagueKey);
  const activeView = searchParams.get("view") === "frozen" ? "frozen" : "shortlist";

  const [scope, setScope] = useState("league");
  const [data, setData] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveResult, setLiveResult] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState("");
  const shortlistSignature = useMemo(
    () => shortlistedPlayers.map((player) => `${player.player_name}|${player.league_key}`).sort().join(";"),
    [shortlistedPlayers]
  );

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [teamPayload, validationPayload] = await Promise.all([
        fetchIlpTeam({ league: selectedLeague, scope }),
        fetchIlpValidation(),
      ]);
      setData(teamPayload);
      setValidation(validationPayload);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [scope, selectedLeague]);

  useEffect(() => { loadTeam(); }, [loadTeam]);
  useEffect(() => { setLiveResult(null); setLiveError(""); }, [shortlistSignature, leagueKey]);

  async function buildShortlistXi() {
    setLiveLoading(true);
    setLiveError("");
    try {
      const result = await optimiseShortlistTeam({
        league: leagueKey,
        players: shortlistedPlayers.map((player) => ({ player_name: player.player_name, league_key: player.league_key })),
      });
      setLiveResult(result);
    } catch (requestError) {
      setLiveResult(null);
      setLiveError(requestError.message);
    } finally {
      setLiveLoading(false);
    }
  }

  function changeView(view) {
    setSearchParams({ view });
  }

  return (
    <>
      <PageHeader
        title="Optimal Team Selection"
        description="Build a live XI from your shortlist or inspect the frozen ILP teams used in dissertation evaluation."
        action={<StatusBadge status="Available" label="ILP connected" />}
      />

      <div className={styles.viewTabs} role="tablist" aria-label="Team optimiser sections">
        <button className={activeView === "shortlist" ? styles.activeView : ""} onClick={() => changeView("shortlist")} type="button">
          <ListChecks size={18} aria-hidden="true" /> Create XI from my shortlist
        </button>
        <button className={activeView === "frozen" ? styles.activeView : ""} onClick={() => changeView("frozen")} type="button">
          <ShieldCheck size={18} aria-hidden="true" /> Frozen evaluation teams
        </button>
      </div>

      {activeView === "shortlist" && (
        <div className={styles.page}>
          <WarningBanner tone="info" message={`ILP will consider only the ${shortlistedPlayers.length} players currently saved in your ${selectedLeague} shortlist. It will not use players outside this pool.`} />
          <div className={styles.shortlistControl}>
            <div>
              <span className={styles.eyebrow}>Interactive candidate pool</span>
              <h3>{selectedLeague} shortlist: {shortlistedPlayers.length} players</h3>
              <p>Add more than 11 players and include enough batters, bowlers, wicketkeepers and all-rounders.</p>
            </div>
            <div className={styles.controlActions}>
              <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate("/shortlist")}>Edit shortlist</Button>
              <Button icon={Sparkles} disabled={shortlistedPlayers.length < 11 || liveLoading} onClick={buildShortlistXi}>
                {liveLoading ? "Optimising…" : "Optimise my shortlist"}
              </Button>
            </div>
          </div>

          {shortlistedPlayers.length === 0 && <EmptyState message={`Your ${selectedLeague} shortlist is empty. Add candidates from the Player Directory first.`} />}
          {shortlistedPlayers.length > 0 && shortlistedPlayers.length < 11 && (
            <WarningBanner message={`Add at least ${11 - shortlistedPlayers.length} more player${11 - shortlistedPlayers.length === 1 ? "" : "s"}. ILP must select exactly 11.`} />
          )}
          {liveError && <WarningBanner message={liveError} />}
          {liveLoading && <LoadingState message="Solving the best valid XI from your shortlist..." />}

          {liveResult && !liveLoading && (
            <>
              <div className={styles.metrics}>
                <MetricCard label="Selected players" value={liveResult.summary.team_size} subLabel={`From ${liveResult.summary.candidate_pool_size} eligible shortlisted players`} icon={Users} />
                <MetricCard label="Optimisation score" value={score(liveResult.summary.objective_value)} subLabel="Sum of frozen forecast scores" icon={Sparkles} />
                <MetricCard label="Batting options" value={liveResult.summary.batting_options} subLabel="Batters, keepers and all-rounders" icon={Activity} />
                <MetricCard label="Bowling options" value={liveResult.summary.bowling_options} subLabel="Bowlers and all-rounders" icon={ShieldCheck} />
              </div>
              {liveResult.excluded.length > 0 && (
                <WarningBanner tone="info" message={`${liveResult.excluded.length} shortlisted player(s) had no eligible frozen 2024 forecast and were not available to ILP.`} />
              )}
              <div className={styles.contentGrid}>
                <TeamRoster team={liveResult.team} title={`${selectedLeague} · shortlist-optimised XI`} statusLabel="Solved live" />
                <aside className={styles.sideColumn}>
                  <SelectionRules constraints={liveResult.method.constraints} />
                  <Card title="Interactive method">
                    <div className={styles.methodList}>
                      <p><span>Candidate source</span><strong>Your shortlist only</strong></p>
                      <p><span>Forecast model</span><strong>{liveResult.method.forecast_model}</strong></p>
                      <p><span>Model retraining</span><strong>None</strong></p>
                      <p><span>Solver time</span><strong>{Number(liveResult.summary.runtime_seconds).toFixed(3)} s</strong></p>
                    </div>
                    <p className={styles.methodNote}>{liveResult.method.note}</p>
                  </Card>
                </aside>
              </div>
            </>
          )}
        </div>
      )}

      {activeView === "frozen" && (
        <>
          <div className={styles.scopeBar} role="group" aria-label="Frozen team selection scope">
            <button className={scope === "league" ? styles.activeScope : ""} onClick={() => setScope("league")} type="button"><Target size={17} /> {selectedLeague} XI</button>
            <button className={scope === "cross_league" ? styles.activeScope : ""} onClick={() => setScope("cross_league")} type="button"><Crosshair size={17} /> Cross-league XI</button>
            <span>These saved teams provide reproducible dissertation evidence.</span>
          </div>
          {loading && <LoadingState message="Loading the frozen optimal XI..." />}
          {!loading && error && <ErrorState message={error} onRetry={loadTeam} />}
          {!loading && !error && data && validation && (
            <div className={styles.page}>
              <WarningBanner tone="info" message={data.method.explanation} />
              <div className={styles.metrics}>
                <MetricCard label="Selected players" value={data.summary.team_size} subLabel={`From ${data.summary.candidate_pool_size} eligible candidates`} icon={Users} />
                <MetricCard label="Optimisation score" value={score(data.summary.objective_value)} subLabel="Sum of selected forecast scores" icon={Sparkles} />
                <MetricCard label="Batting options" value={data.summary.batting_options} subLabel="Batters, keepers and all-rounders" icon={Activity} />
                <MetricCard label="Bowling options" value={data.summary.bowling_options} subLabel="Bowlers and all-rounders" icon={ShieldCheck} />
              </div>
              <div className={styles.contentGrid}>
                <TeamRoster team={data.team} title={`${data.league} · frozen selected XI`} statusLabel={data.solver_status} />
                <aside className={styles.sideColumn}>
                  <SelectionRules constraints={data.method.constraints} />
                  <Card title="Frozen method">
                    <div className={styles.methodList}>
                      <p><span>Forecast model</span><strong>{data.method.forecast_model}</strong></p>
                      <p><span>Objective</span><strong>{data.method.selected_label}</strong></p>
                      <p><span>Feature cutoff</span><strong>{data.forecast_cutoff_season}</strong></p>
                      <p><span>Target season</span><strong>{data.target_season}</strong></p>
                    </div>
                    <p className={styles.methodNote}>The development evidence selected forecast-only Mode A. Form and reliability remain sensitivity tests.</p>
                  </Card>
                  {data.validation.random_team_evidence && (
                    <Card title="Post-selection evidence">
                      <div className={styles.evidenceValue}>{Number(data.validation.random_team_evidence.percentile_vs_random_valid_teams).toFixed(2)}th</div>
                      <p className={styles.evidenceLabel}>percentile against {data.validation.random_team_evidence.n_random_teams.toLocaleString()} random valid balanced teams</p>
                      <p className={styles.methodNote}>{data.validation.note}</p>
                    </Card>
                  )}
                </aside>
              </div>
              <Card title="Robustness summary">
                <div className={styles.robustnessGrid}>
                  <div><strong>{pct(data.validation.mean_weight_sensitivity_overlap)}</strong><span>Average overlap under alternative objective weights</span></div>
                  <div><strong>{pct(data.validation.logistic_comparator_overlap)}</strong><span>Average overlap when Logistic Regression replaces FT</span></div>
                  <div><strong>{Number(validation.mean_random_percentile).toFixed(2)}th</strong><span>Mean actual-outcome percentile against random valid teams</span></div>
                </div>
              </Card>
              <WarningBanner tone="warning" message={validation.limitations.join(" ")} />
            </div>
          )}
        </>
      )}
    </>
  );
}
