import React from "react";
import styles from "./Channel.module.css";
import { GiSpeaker } from "react-icons/gi";
import { BiHash } from "react-icons/bi";

interface Props {
  selected?: boolean;
  title: string;
  onClick: () => void;
  type: "VOICE" | "TEXT";
}

const Channel: React.FC<Props> = ({
  selected,
  title,
  onClick,
  type,
  children,
}) => {
  return (
    <>
      <button
        onClick={onClick}
        className={styles.button}
        style={{
          backgroundColor: selected ? "rgb(79 84 92 / 32%)" : "transparent",
        }}
      >
        <span className={styles.icon}>
          {type === "VOICE" ? (
            <GiSpeaker size="26px" />
          ) : (
            <BiHash size="26px" />
          )}
        </span>
        <span
          className={styles.text}
          style={{
            color: selected ? "#fff" : "#72767d",
          }}
        >
          {title}
        </span>
      </button>
      {children}
    </>
  );
};

export default Channel;
