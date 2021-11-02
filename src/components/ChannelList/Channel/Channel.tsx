import React from "react";
import styles from "./Channel.module.css";

interface Props {
  selected?: boolean;
  title: string;
  onClick: () => void;
}

const Channel: React.FC<Props> = ({ selected, title, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={styles.button}
      style={{
        backgroundColor: selected ? "rgb(79 84 92 / 32%)" : "transparent",
      }}
    >
      <span className={styles.icon}>#</span>
      <span
        className={styles.text}
        style={{
          color: selected ? "#fff" : "#72767d",
        }}
      >
        {title}
      </span>
    </button>
  );
};

export default Channel;
