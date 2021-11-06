import React, { useState } from "react";
import { IoMdMic, IoMdSettings } from "react-icons/io";
import { BsHeadphones, BsFillTelephoneXFill } from "react-icons/bs";
import { FaVideo } from "react-icons/fa";
import { MdScreenShare } from "react-icons/md";
import { AiFillSignal } from "react-icons/ai";

import styles from "./ChannelList.module.css";

interface ServerState {
  id: string;
  name: string;
}
interface ChannelState extends ServerState {
  server: string;
}

interface WidthHeight {
  width: number;
  height: number;
}

interface Props {
  server: ServerState | undefined;
  voiceChannel: Omit<ChannelState, "name"> | undefined;
  user: any;
  leaveVoice: () => void;
  signOut: () => void;
  dimensions: WidthHeight;
}

const ChannelList: React.FC<Props> = ({
  server,
  voiceChannel,
  user,
  leaveVoice,
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
        <span>{server?.name}</span>
      </header>
      {children}
      <div style={{ flexGrow: 1 }} />

      {voiceChannel && (
        <section className={styles.connectedContainer}>
          <div className={styles.connectedTop}>
            <div className={styles.connectedTextContainer}>
              <div className={styles.connected}>
                <AiFillSignal size="16px" />
                <span>Voice Connected</span>
              </div>
              <span>General/Air</span>
            </div>
            <button className={styles.disconnectButton} onClick={leaveVoice}>
              <BsFillTelephoneXFill size="32px" />
            </button>
          </div>
          <div className={styles.connectedBottom}>
            <button>
              <FaVideo size="18px" />
              <span>Video</span>
            </button>
            <button>
              <MdScreenShare size="20px" />
              <span>Screen</span>
            </button>
          </div>
        </section>
      )}
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
