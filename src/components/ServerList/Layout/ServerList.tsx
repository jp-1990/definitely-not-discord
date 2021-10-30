import React, { ReactNode } from "react";

import styles from "./ServerList.module.css";

interface Props {
  children: ReactNode;
  icon: string;
}

const ServerList: React.FC<Props> = ({ children, icon }) => {
  return (
    <div
      style={{
        height: window.innerHeight,
        width: "72px",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#202225",
      }}
    >
      <div
        style={{
          width: "72px",
          marginTop: "12px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div className={styles.iconContainer}>
          <img src={icon} />
        </div>
        <div
          style={{
            height: "2px",
            width: "32px",
            backgroundColor: "hsla(0,0%,100%,0.06)",
            borderRadius: "2px",
            marginBottom: "8px",
          }}
        />
      </div>

      {children}
    </div>
  );
};

export default ServerList;
