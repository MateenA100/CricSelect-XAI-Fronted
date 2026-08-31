import { Inbox } from "lucide-react";
import styles from "./StateMessage.module.css";

export default function EmptyState({ message = "Select a player to continue.", icon: Icon = Inbox }) {
  return (
    <div className={styles.wrapper} role="status">
      <span className={`${styles.iconWrap} ${styles.neutral}`} aria-hidden="true">
        <Icon size={22} />
      </span>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
