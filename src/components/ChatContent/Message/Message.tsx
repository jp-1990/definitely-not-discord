import React from "react";
import styles from "./Message.module.css";

interface Props {
  message: string;
  id: string;
  avatar?: string;
  userName?: string;
  date?: string;
}

const Message: React.FC<Props> = ({ message, id, avatar, userName, date }) => {
  if (!avatar || !date || !userName)
    return (
      <span key={id} className={styles.messageText}>
        {message}
      </span>
    );
  return (
    <article key={id}>
      <div className={styles.messageAvatar}>
        {avatar && <img src={avatar} />}
      </div>
      <div className={styles.messageAuthor}>
        <h4>{userName}</h4>
        <span>
          {new Date(+date).toDateString()} at {new Date(+date).getHours()}:
          {new Date(+date).getMinutes()}
        </span>
      </div>
      <span className={styles.messageText}>{message}</span>
    </article>
  );
};

export default Message;
