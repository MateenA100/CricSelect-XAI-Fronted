import { useNavigate } from "react-router-dom";
import { ArrowRight, BookmarkCheck, Download, ShieldCheck, Trash2, Users } from "lucide-react";
import { useLeague } from "../context/LeagueContextCore";
import { useShortlist } from "../context/ShortlistContextCore";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import MetricCard from "../components/ui/MetricCard";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import WarningBanner from "../components/ui/WarningBanner";
import styles from "./ShortlistPage.module.css";
import { downloadCsv } from "../utils/csvExport";

export default function ShortlistPage() {
  const navigate = useNavigate();
  const { selectedLeague } = useLeague();
  const { shortlist, removePlayer, clearLeague } = useShortlist();
  const leagueKey = selectedLeague === "T20 Blast" ? "T20_Blast" : selectedLeague;
  const players = shortlist.filter((player) => player.league_key === leagueKey);
  const roleCounts = players.reduce((counts, player) => ({ ...counts, [player.role]: (counts[player.role] ?? 0) + 1 }), {});
  const averageReliability = players.length
    ? players.reduce((sum, player) => sum + player.reliability_weight, 0) / players.length
    : 0;

  function exportShortlist() {
    const columns = [
      { key: "player_name", label: "Player" }, { key: "league", label: "League" },
      { key: "role", label: "Role" }, { key: "cluster_name", label: "K-Means profile" },
      { key: "total_matches", label: "Matches" }, { key: "total_runs", label: "Runs" },
      { key: "wickets", label: "Wickets" }, { key: "reliability_weight", label: "Reliability" },
      { key: "performance_credit", label: "Performance credit" },
    ];
    downloadCsv(`${selectedLeague}_player_shortlist.csv`, columns, players);
  }

  return (
    <>
      <PageHeader
        title="Player Shortlist"
        description={`Review players saved for ${selectedLeague} before the final team-selection stage.`}
        action={<StatusBadge status="Available" label="Saved locally" />}
      />

      <WarningBanner
        tone="info"
        message="This screen manages your candidate pool. When it is ready, continue to Team Optimiser, where ILP will select the strongest valid XI from only these shortlisted players."
      />

      {players.length === 0 ? (
        <EmptyState message={`No ${selectedLeague} players have been shortlisted. Add players from the Player Directory.`} />
      ) : (
        <div className={styles.page}>
          <div className={styles.metrics}>
            <MetricCard label="Shortlisted players" value={players.length} subLabel={`${selectedLeague} selection pool`} icon={BookmarkCheck} />
            <MetricCard label="Roles represented" value={Object.keys(roleCounts).length} subLabel="Distinct cricket roles" icon={Users} />
            <MetricCard label="Average reliability" value={`${(averageReliability * 100).toFixed(1)}%`} subLabel="Historical evidence weight" icon={ShieldCheck} />
          </div>

          <Card
            title={`${selectedLeague} shortlist`}
            action={(
              <div className={styles.actions}>
                <Button size="sm" icon={ArrowRight} onClick={() => navigate("/team-optimiser?view=shortlist")}>
                  Continue to Team Optimiser
                </Button>
                <Button variant="secondary" size="sm" icon={Download} onClick={exportShortlist}>Export CSV</Button>
                <Button variant="secondary" size="sm" icon={Trash2} onClick={() => clearLeague(leagueKey)}>Clear shortlist</Button>
              </div>
            )}
          >
            <div className={styles.roleSummary}>
              {Object.entries(roleCounts).map(([role, count]) => <span key={role}>{role}: <strong>{count}</strong></span>)}
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Player</th><th>Role</th><th>K-Means profile</th><th>Matches</th><th>Credit</th><th>Reliability</th><th>Action</th></tr></thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={`${player.player_name}-${player.league_key}`}>
                      <td><strong>{player.player_name}</strong></td>
                      <td><span className={styles.roleBadge}>{player.role}</span></td>
                      <td>{player.cluster_name}</td>
                      <td>{player.total_matches}</td>
                      <td>{player.performance_credit.toFixed(1)}</td>
                      <td>{(player.reliability_weight * 100).toFixed(1)}%</td>
                      <td><Button variant="ghost" size="sm" icon={Trash2} onClick={() => removePlayer(player)}>Remove</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {players.length < 11 && (
            <WarningBanner tone="info" message={`Add at least ${11 - players.length} more player${11 - players.length === 1 ? "" : "s"} before ILP can build a team.`} />
          )}
          <p className={styles.storageNote}>The shortlist is stored only in this browser. It does not alter datasets or retrain any model.</p>
        </div>
      )}
    </>
  );
}
