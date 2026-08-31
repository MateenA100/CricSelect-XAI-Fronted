import { useLocation } from "react-router-dom";
import { Database, Menu } from "lucide-react";
import { NAV_SECTIONS } from "../../config/navigation";
import { APP_CONFIG } from "../../config/appConfig";
import { useLeague } from "../../context/LeagueContextCore";
import Select from "../ui/Select";
import StatusBadge from "../ui/StatusBadge";
import styles from "./Header.module.css";

function useCurrentPageTitle() {
  const { pathname } = useLocation();
  for (const section of NAV_SECTIONS) {
    if (section.type === "link") {
      const targetPath = section.to.split(/[?#]/)[0];
      if (section.end ? pathname === targetPath : pathname.startsWith(targetPath)) return section.label;
    } else if (section.children.some((item) => pathname === item.to.split(/[?#]/)[0])) {
      return section.label;
    }
  }
  return APP_CONFIG.appName;
}

export default function Header({ onMenuClick }) {
  const { selectedLeague, setSelectedLeague, leagues } = useLeague();
  const title = useCurrentPageTitle();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button type="button" className={styles.menuButton} onClick={onMenuClick} aria-label="Open navigation">
          <Menu size={22} />
        </button>
        <div className={styles.titleGroup}>
          <span className={styles.eyebrow}>Decision workspace</span>
          <h2 className={styles.title}>{title}</h2>
        </div>
      </div>

      <div className={styles.right}>
        <Select label="League" value={selectedLeague} onChange={setSelectedLeague} options={leagues} hideLabel />
        <div className={styles.status}>
          <Database size={15} aria-hidden="true" />
          <span className={styles.statusText}>Five leagues · through {APP_CONFIG.dataThroughSeason}</span>
          <StatusBadge status="Available" label="System live" />
        </div>
      </div>
    </header>
  );
}
