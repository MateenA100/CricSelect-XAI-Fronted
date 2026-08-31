import { Search } from "lucide-react";
import styles from "./SearchInput.module.css";

let idCounter = 0;

export default function SearchInput({ label, value, onChange, placeholder = "Search...", hideLabel = true, ...rest }) {
  const id = `search-${(idCounter += 1)}`;

  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        <Search size={16} className={styles.icon} aria-hidden="true" />
        <input
          id={id}
          type="search"
          className={styles.input}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        />
      </div>
    </div>
  );
}
