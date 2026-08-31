import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import Header from "../components/navigation/Header";
import styles from "./DashboardLayout.module.css";

export default function DashboardLayout() {
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <Sidebar isOpen={isMobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className={styles.content}>
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
