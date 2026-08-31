import { ChevronDown } from "lucide-react";
import styles from "./Select.module.css";

let idCounter = 0;

export default function Select({ label, value, onChange, options, hideLabel = false }) {
  const id = `select-${(idCounter += 1)}`;

  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        <select id={id} className={styles.select} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className={styles.icon} aria-hidden="true" />
      </div>
    </div>
  );
}
