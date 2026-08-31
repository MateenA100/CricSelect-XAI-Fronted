import { CheckCircle2, Clock, Loader2, Inbox, AlertTriangle, XCircle } from "lucide-react";
import styles from "./StatusBadge.module.css";

// Status is always paired with an icon + text label, never colour alone.
const STATUS_MAP = {
  Available: { tone: "success", icon: CheckCircle2 },
  Optimal: { tone: "success", icon: CheckCircle2 },
  Pending: { tone: "warning", icon: Clock },
  "Model loading": { tone: "info", icon: Loader2, spin: true },
  "No data": { tone: "neutral", icon: Inbox },
  "Low confidence": { tone: "warning", icon: AlertTriangle },
  Infeasible: { tone: "error", icon: XCircle },
};

export default function StatusBadge({ status, label }) {
  const config = STATUS_MAP[status] ?? { tone: "neutral", icon: Inbox };
  const Icon = config.icon;

  return (
    <span className={`${styles.badge} ${styles[config.tone]}`}>
      <Icon size={14} className={config.spin ? styles.spin : undefined} aria-hidden="true" />
      <span>{label ?? status}</span>
    </span>
  );
}
