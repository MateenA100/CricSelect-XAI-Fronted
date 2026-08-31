import { AlertTriangle, Info } from "lucide-react";
import styles from "./WarningBanner.module.css";

/**
 * tone: "warning" (amber, default) | "info" (blue) - used for both
 * genuine warnings (e.g. low-confidence results) and honest
 * pending-feature notices (e.g. explainability not yet available).
 */
export default function WarningBanner({ message, tone = "warning" }) {
  const Icon = tone === "info" ? Info : AlertTriangle;

  return (
    <div className={`${styles.banner} ${styles[tone]}`} role="status">
      <Icon size={18} aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
