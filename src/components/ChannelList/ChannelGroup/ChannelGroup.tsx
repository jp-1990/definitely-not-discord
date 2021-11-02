import React, { ReactNode } from "react";
import styles from "./ChannelGroup.module.css";

interface Props {
  expanded: boolean;
  title: string;
  children: ReactNode;
}

const ChannelGroup: React.FC<Props> = ({ expanded, title, children }) => {
  return (
    <section className={styles.container}>
      <div className={styles.groupHeader}>
        <div />
        <span className={styles.title}>{title}</span>
      </div>
      {expanded && children}
    </section>
  );
};

export default ChannelGroup;
