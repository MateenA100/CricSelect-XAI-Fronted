import { useEffect, useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { APP_CONFIG } from "../../config/appConfig";
import { NAV_SECTIONS } from "../../config/navigation";
import BrandMark from "./BrandMark";
import styles from "./Sidebar.module.css";

function destinationParts(to) {
  const url = new URL(to, "http://dashboard.local");
  return { pathname: url.pathname, search: url.search, hash: url.hash };
}

function isDestinationActive(location, to, end = false) {
  const target = destinationParts(to);
  const pathMatches = end ? location.pathname === target.pathname : location.pathname.startsWith(target.pathname);
  if (!pathMatches) return false;
  if (target.search && location.search !== target.search) return false;
  if (target.hash && location.hash !== target.hash) return false;
  if (!target.hash && target.pathname === "/forecast" && location.hash) return false;
  return true;
}

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const activeGroups = useMemo(
    () => NAV_SECTIONS.filter((section) => section.type === "group" && section.children.some((item) => isDestinationActive(location, item.to))).map((section) => section.key),
    [location]
  );
  const [openGroups, setOpenGroups] = useState(() => new Set(activeGroups));

  useEffect(() => {
    if (!activeGroups.length) return;
    setOpenGroups(new Set(activeGroups));
  }, [activeGroups]);

  function toggleGroup(key) {
    setOpenGroups((current) => {
      if (current.has(key)) return new Set();
      return new Set([key]);
    });
  }

  function navLink(item, child = false) {
    const Icon = item.icon;
    const active = isDestinationActive(location, item.to, item.end);
    return (
      <Link
        to={item.to}
        onClick={onClose}
        className={`${styles.navLink} ${child ? styles.childLink : ""} ${active ? styles.active : ""}`}
        aria-current={active ? "page" : undefined}
      >
        <Icon size={child ? 17 : 20} aria-hidden="true" />
        <span className={styles.navLabel}>{item.label}</span>
      </Link>
    );
  }

  return (
    <>
      {isOpen && <div className={styles.scrim} onClick={onClose} aria-hidden="true" />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`} aria-label="Main navigation">
        <div className={styles.brandRow}>
          <div className={styles.brand}>
            <BrandMark />
            <span className={styles.brandCopy}>
              <span className={styles.brandName}>{APP_CONFIG.appName}</span>
              <span className={styles.brandTagline}>Cricket decision intelligence</span>
            </span>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close navigation"><X size={20} /></button>
        </div>

        <nav className={styles.nav}>
          <ul>
            {NAV_SECTIONS.map((section) => {
              if (section.type === "link") return <li key={section.to}>{navLink(section)}</li>;
              const GroupIcon = section.icon;
              const expanded = openGroups.has(section.key);
              const groupActive = activeGroups.includes(section.key);
              return (
                <li key={section.key} className={styles.navGroup}>
                  <button
                    type="button"
                    className={`${styles.groupButton} ${groupActive ? styles.groupActive : ""}`}
                    onClick={() => toggleGroup(section.key)}
                    aria-expanded={expanded}
                  >
                    <GroupIcon size={20} aria-hidden="true" />
                    <span className={styles.navLabel}>{section.label}</span>
                    <ChevronDown className={`${styles.chevron} ${expanded ? styles.chevronOpen : ""}`} size={16} aria-hidden="true" />
                  </button>
                  {expanded && <ul className={styles.subnav}>{section.children.map((item) => <li key={item.to}>{navLink(item, true)}</li>)}</ul>}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.footer}>
          <span className={styles.footerEyebrow}>Decision support suite</span>
          <span className={styles.footerValue}>K-Means · Forecast · KNN · ILP · SHAP</span>
          <span className={styles.footerMeta}>5 leagues · Data through 2024</span>
        </div>
      </aside>
    </>
  );
}
