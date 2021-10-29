import React from "react";
import styles from "./ServerIcon.module.css";

interface Props {
  selected?: boolean;
  onClick: () => void;
}

const ServerIcon: React.FC<Props> = ({ selected, onClick }) => {
  return (
    <div className={styles.container}>
      <button
        type="button"
        style={{
          borderRadius: selected ? "16px" : "100%",
        }}
        className={styles.icon}
        onClick={onClick}
      />
      {selected && <div className={styles.selectedTag} />}
    </div>
  );
};

export default ServerIcon;
