import styles from "./BrandMark.module.css";

export default function BrandMark({ compact = false }) {
  return (
    <span className={`${styles.mark} ${compact ? styles.compact : ""}`} aria-hidden="true">
      <svg viewBox="0 0 64 64" role="img">
        <defs>
          <linearGradient id="brandShield" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#20c983" />
            <stop offset="1" stopColor="#07815a" />
          </linearGradient>
        </defs>
        <path className={styles.outer} d="M32 2 57 12v17c0 16-10 27-25 33C17 56 7 45 7 29V12L32 2Z" />
        <path fill="url(#brandShield)" d="M32 8 51 16v13c0 12-7 21-19 27-12-6-19-15-19-27V16l19-8Z" />
        <rect width="8" height="31" x="28" y="15" rx="4" className={styles.bat} transform="rotate(35 32 30.5)" />
        <circle cx="21" cy="42" r="7" className={styles.ball} />
        <path d="M18 37.5c3 2 5.3 5.2 6 9M16.5 39.2c3 2 5.2 4.8 6.1 8" className={styles.seam} />
      </svg>
    </span>
  );
}
