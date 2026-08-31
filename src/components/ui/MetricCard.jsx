import styles from "./MetricCard.module.css";

/**
 * A single-metric summary tile, e.g. "Players / 2,431 / +128 this week"
 */
export default function MetricCard({ label, value, subLabel, icon: Icon }) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        {Icon && (
          <span className={styles.iconWrap} aria-hidden="true">
            <Icon size={18} />
          </span>
        )}
      </div>
      <div className={styles.value}>{value}</div>
      {subLabel && <div className={styles.subLabel}>{subLabel}</div>}
    </div>
  );
}
