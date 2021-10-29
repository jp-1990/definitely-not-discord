import React, { ReactNode } from "react";
import styles from "./ChatHeader.module.css";

interface Props {
  children: ReactNode;
}

const ChatHeader: React.FC<Props> = ({ children }) => {
  return <section className={styles.container}>{children}</section>;
};

export default ChatHeader;
