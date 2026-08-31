import styles from "./Card.module.css";

export default function Card({ title, action, children, className = "" }) {
  return (
    <section className={`${styles.card} ${className}`}>
      {(title || action) && (
        <header className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {action}
        </header>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
