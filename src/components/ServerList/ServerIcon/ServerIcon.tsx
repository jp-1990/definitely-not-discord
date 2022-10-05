import React from "react";
import styles from "./ServerIcon.module.css";

interface Props {
  selected?: boolean;
  onClick: () => void;
  url?: string;
}

const ServerIcon: React.FC<Props> = ({ selected, onClick, url }) => {
  return (
    <div className={styles.container}>
      <button
        type="button"
        style={{
          borderRadius: selected ? "16px" : "100%",
        }}
        className={styles.icon}
        onClick={onClick}
      >
        <img src={url} alt="" referrerPolicy="no-referrer" />
      </button>
      {selected && <div className={styles.selectedTag} />}
    </div>
  );
};

export default ServerIcon;
