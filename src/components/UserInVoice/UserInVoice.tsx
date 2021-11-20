import React from "react";
import styles from "./UserInVoice.module.css";

import { UserData } from "../../types";

interface Props {
  user: UserData;
  speaking: boolean;
}

const UserInVoice: React.FC<Props> = ({ user, speaking }) => {
  return (
    <div className={styles.userList}>
      <li>
        <div
          className={`${styles.userListIcon} ${
            speaking ? styles.speakingIcon : ""
          }`}
        >
          {user.avatar && (
            <div>
              <img src={user.avatar} />
            </div>
          )}
        </div>
        <span className={`${speaking ? styles.speakingText : ""}`}>
          {user.userName}
        </span>
      </li>
    </div>
  );
};

export default UserInVoice;
