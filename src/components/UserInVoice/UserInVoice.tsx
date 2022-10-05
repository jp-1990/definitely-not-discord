import React, { useState } from "react";
import styles from "./UserInVoice.module.css";

import { UserData } from "../../types";
import unknownUser from "../../assets/img/unknown-user.jpg";

interface Props {
  user: UserData;
  speaking: boolean;
}

const UserInVoice: React.FC<Props> = ({ user, speaking }) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(user.avatar);
  const setImageUndefined = () => setImgSrc(undefined);
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
              <img
                src={imgSrc || unknownUser}
                onError={setImageUndefined}
                referrerPolicy="no-referrer"
              />
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
