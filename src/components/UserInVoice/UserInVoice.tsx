import React from "react";
import styles from "./UserInVoice.module.css";

export interface OnlineUserType {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
}
interface Props {
  user: OnlineUserType;
}

const UserInVoice: React.FC<Props> = ({ user }) => {
  return (
    <div className={styles.userList}>
      <li>
        <div className={styles.userListIcon}>
          {user.avatar && (
            <div>
              <img src={user.avatar} />
              <div className={styles.onlineMarker} />
            </div>
          )}
        </div>
        <span>{user.userName}</span>
      </li>
    </div>
  );
};

export default UserInVoice;
