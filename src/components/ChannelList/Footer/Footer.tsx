import React, { useState } from "react";
import { IoMdMic, IoMdSettings } from "react-icons/io";
import { BsHeadphones } from "react-icons/bs";
import styles from "./Footer.module.css";

interface Props {
  user: any;
  signOut: () => void;
}

const Footer: React.FC<Props> = ({ user, signOut }) => {
  const [signOutOpen, setSignOutOpen] = useState<boolean>(false);
  const userData = user.providerData.find(
    (el: Record<string, any>) => el.providerId === "google.com"
  );

  const toggleOpenSignOut = () => {
    setSignOutOpen((prev) => !prev);
  };

  return (
    <div className={styles.container}>
      {signOutOpen && (
        <div className={styles.logoutContainer}>
          <button onClick={signOut}>Log Out</button>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            marginRight: "8px",
            borderRadius: "100%",
            backgroundColor: "#eee",
            position: "relative",
          }}
        >
          <img
            style={{
              width: "32px",
              height: "32px",
              marginRight: "8px",
              borderRadius: "100%",
            }}
            src={userData.photoURL}
          />
          <div
            style={{
              height: "10px",
              width: "10px",
              backgroundColor: "#3ba55d",
              position: "absolute",
              borderRadius: "100%",
              bottom: "0",
              right: "-2px",
              border: "1px solid #202225",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "start",
            alignItems: "start",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              height: "18px",
              color: "#fff",
              fontWeight: 500,
              marginBottom: "-1px",
              overflow: "hidden",
              textAlign: "left",
            }}
          >
            {userData.displayName}
          </span>
          <span style={{ fontSize: "11px", height: "13px", color: "#b9bbbe" }}>
            #0110
          </span>
        </div>
      </div>
      <div style={{ display: "flex", width: "96px", height: "32px" }}>
        <div className={styles.icon}>
          <IoMdMic fill="#b9bbbe" size="20px" />
        </div>
        <div className={styles.icon}>
          <BsHeadphones fill="#b9bbbe" size="22px" />
        </div>
        <div className={styles.icon} role="button" onClick={toggleOpenSignOut}>
          <IoMdSettings fill="#b9bbbe" size="22px" />
        </div>
      </div>
    </div>
  );
};

export default Footer;
