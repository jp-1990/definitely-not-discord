import React, { useState } from "react";
import { IoMdMic, IoMdSettings } from "react-icons/io";
import { BsHeadphones, BsFillTelephoneXFill } from "react-icons/bs";
import { FaVideo } from "react-icons/fa";
import { MdScreenShare } from "react-icons/md";
import { AiFillSignal } from "react-icons/ai";

import { ServerState, VoiceChannelState, UserData } from "../../types";

import unknownUser from "../../assets/img/unknown-user.jpg";
import styles from "./ChannelList.module.css";

interface WidthHeight {
  width: number;
  height: number;
}

interface Props {
  server: ServerState | undefined;
  voiceChannel: VoiceChannelState<UserData> | undefined;
  user: any;
  dimensions: WidthHeight;
  actions: {
    signOut: () => void;
    leaveVoice: () => void;
    muteSelf: () => void;
    unmuteSelf: () => void;
    muteOthers: () => void;
    unmuteOthers: () => void;
  };
}

const ChannelList: React.FC<Props> = ({
  server,
  voiceChannel,
  user,
  dimensions,
  actions,
  children,
}) => {
  const userData = user.providerData.find(
    (el: Record<string, any>) => el.providerId === "google.com"
  );
  const [muted, setMuted] = useState<boolean>(false);
  const [deafened, setDeafened] = useState<boolean>(false);

  const [imgSrc, setImgSrc] = useState<string | undefined>(userData.photoURL);
  const [signOutOpen, setSignOutOpen] = useState<boolean>(false);

  const setImageUndefined = () => setImgSrc(undefined);
  const toggleOpenSignOut = () => {
    setSignOutOpen((prev) => !prev);
  };

  const handleToggleMute = () => {
    if (deafened) {
      actions.unmuteSelf();
      actions.unmuteOthers();
      setMuted(false);
      setDeafened(false);
    } else if (muted) {
      actions.unmuteSelf();
      setMuted(false);
    } else {
      actions.muteSelf();
      setMuted(true);
    }
  };

  const handleToggleDeafen = () => {
    if (deafened) {
      actions.unmuteSelf();
      actions.unmuteOthers();
      setMuted(false);
      setDeafened(false);
    } else {
      actions.muteSelf();
      actions.muteOthers();
      setMuted(true);
      setDeafened(true);
    }
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
            <button
              className={styles.disconnectButton}
              onClick={actions.leaveVoice}
            >
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
            <button type="button" onClick={actions.signOut}>
              Log Out
            </button>
          </div>
        )}
        <div className={styles.userDetailsContainer}>
          <div className={styles.userImageContainer}>
            <img src={imgSrc || unknownUser} onError={setImageUndefined} />
            <div className={styles.userOnlineIcon} />
          </div>
          <div className={styles.userTextContainer}>
            <span className={styles.userDisplayName}>
              {userData.displayName}
            </span>
            <span className={styles.userNumber}>{`#${userData.uid.slice(
              0,
              4
            )}`}</span>
          </div>
        </div>
        <div className={styles.iconContainer}>
          <button onClick={handleToggleMute} className={styles.icon}>
            <IoMdMic fill="#b9bbbe" size="20px" />
            {muted && <div className={styles.muted} />}
          </button>
          <button onClick={handleToggleDeafen} className={styles.icon}>
            <BsHeadphones fill="#b9bbbe" size="22px" />
            {deafened && <div className={styles.muted} />}
          </button>
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
