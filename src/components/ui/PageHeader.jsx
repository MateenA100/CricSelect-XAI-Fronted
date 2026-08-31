import styles from "./PageHeader.module.css";

export default function PageHeader({ title, description, action }) {
  return (
    <div className={styles.wrapper}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
