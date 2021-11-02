import React, { useState } from "react";
import { IoMdMic, IoMdSettings } from "react-icons/io";
import { BsHeadphones } from "react-icons/bs";

import styles from "./ChannelList.module.css";

interface WidthHeight {
  width: number;
  height: number;
}

interface Props {
  serverName: string;
  user: any;
  signOut: () => void;
  dimensions: WidthHeight;
}

const ChannelList: React.FC<Props> = ({
  serverName,
  user,
  signOut,
  dimensions,
  children,
}) => {
  const [signOutOpen, setSignOutOpen] = useState<boolean>(false);
  const userData = user.providerData.find(
    (el: Record<string, any>) => el.providerId === "google.com"
  );

  const toggleOpenSignOut = () => {
    setSignOutOpen((prev) => !prev);
  };

  return (
    <section
      style={{
        height: dimensions.height,
      }}
      className={styles.container}
    >
      <header>
        <span>{serverName}</span>
      </header>
      {children}

      <div style={{ flexGrow: 1 }} />
      <footer>
        {signOutOpen && (
          <div className={styles.logoutContainer}>
            <button type="button" onClick={signOut}>
              Log Out
            </button>
          </div>
        )}
        <div className={styles.userDetailsContainer}>
          <div className={styles.userImageContainer}>
            <img src={userData.photoURL} alt="user profile image" />
            <div className={styles.userOnlineIcon} />
          </div>
          <div className={styles.userTextContainer}>
            <span className={styles.userDisplayName}>
              {userData.displayName}
            </span>
            <span className={styles.userNumber}>#0110</span>
          </div>
        </div>
        <div className={styles.iconContainer}>
          <div className={styles.icon}>
            <IoMdMic fill="#b9bbbe" size="20px" />
          </div>
          <div className={styles.icon}>
            <BsHeadphones fill="#b9bbbe" size="22px" />
          </div>
          <div
            className={styles.icon}
            role="button"
            onClick={toggleOpenSignOut}
          >
            <IoMdSettings fill="#b9bbbe" size="22px" />
          </div>
        </div>
      </footer>
    </section>
  );
};

export default ChannelList;
