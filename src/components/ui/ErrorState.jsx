import { AlertCircle } from "lucide-react";
import Button from "./Button";
import styles from "./StateMessage.module.css";

export default function ErrorState({
  message = "We could not load this information. Please try again.",
  onRetry,
}) {
  return (
    <div className={styles.wrapper} role="alert">
      <span className={`${styles.iconWrap} ${styles.error}`} aria-hidden="true">
        <AlertCircle size={22} />
      </span>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
