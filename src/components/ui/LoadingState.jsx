import { Loader2 } from "lucide-react";
import styles from "./StateMessage.module.css";

export default function LoadingState({ message = "Loading..." }) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <span className={`${styles.iconWrap} ${styles.neutral}`} aria-hidden="true">
        <Loader2 size={22} className={styles.spin} />
      </span>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
