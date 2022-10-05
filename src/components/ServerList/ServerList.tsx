import React from "react";
import styles from "./ServerList.module.css";

interface WidthHeight {
  width: number;
  height: number;
}

interface Props {
  icon: string;
  dimensions: WidthHeight;
}

const ServerList: React.FC<Props> = ({ icon, dimensions, children }) => {
  return (
    <nav
      className={styles.container}
      style={{
        height: dimensions.height,
      }}
    >
      <header>
        <div className={styles.iconContainer}>
          <img src={icon} alt="Not discord icon" referrerPolicy="no-referrer" />
        </div>
        <div className={styles.divider} />
      </header>
      {children}
    </nav>
  );
};

export default ServerList;
