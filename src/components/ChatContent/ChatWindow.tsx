import React from "react";
import {
  BsPlusCircleFill,
  BsFillEmojiSmileFill,
  BsBellFill,
} from "react-icons/bs";
import { HiOutlineHashtag } from "react-icons/hi";
import { IoIosGift } from "react-icons/io";
import { IoSearchOutline } from "react-icons/io5";
import { AiOutlineGif, AiFillFile } from "react-icons/ai";
import { RiPushpinFill } from "react-icons/ri";
import { MdPeopleAlt, MdInbox, MdOutlineHelp } from "react-icons/md";

import { ChatContent, ChatHeader, UserList } from "./Layout";
import styles from "./ChatWindow.module.css";

const ChatWindow = () => {
  const selected = true;
  const title = "general";
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
      }}
    >
      <ChatHeader>
        <div
          style={{
            height: "32px",
            width: "208px",
            borderRadius: "5px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              marginRight: "8px",
              marginLeft: "8px",
              fontSize: "22px",
              color: "#72767d",
            }}
          >
            #
          </span>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: selected ? "#fff" : "#72767d",
            }}
          >
            {title}
          </h3>
        </div>
        <ul className={styles.iconList}>
          <li className={styles.icon}>
            <HiOutlineHashtag size="24px" color="#b9bbbe" />
          </li>
          <li className={styles.icon}>
            <BsBellFill size="18px" color="#b9bbbe" />
          </li>
          <li className={styles.icon}>
            <RiPushpinFill size="22px" color="#b9bbbe" />
          </li>
          <li className={styles.icon}>
            <MdPeopleAlt size="24px" color="#b9bbbe" />
          </li>
          <div className={styles.searchContainer}>
            <input placeholder="Search" className={styles.search}></input>
            <div className={styles.searchIcon}>
              <IoSearchOutline size="16px" color="#72767d" />
            </div>
          </div>
          <li className={styles.icon}>
            <MdInbox size="24px" color="#b9bbbe" />
          </li>
          <li className={styles.icon}>
            <MdOutlineHelp size="24px" color="#b9bbbe" />
          </li>
        </ul>
      </ChatHeader>
      <div style={{ display: "flex" }}>
        <ChatContent>
          <main className={styles.chatContentOuter}>
            <div className={styles.chatContentInner}>
              <article>
                <div className={styles.messageAvatar} />
                <div className={styles.messageAuthor}>
                  <h4>jp</h4>
                  <span>Today at 4:11PM</span>
                </div>
                <span>
                  That is exactly what I didn't want my skills to be looking
                  like after 4 years haha
                </span>
                <span>started cloning discord last night</span>
              </article>

              <div className={styles.scrollSpacer} />
            </div>
          </main>
          <form className={styles.messageInputForm}>
            <button className={styles.messageAddFileButton}>
              <BsPlusCircleFill size="22px" color="#b9bbbe" />
            </button>
            <input
              placeholder={`Message #general`}
              className={styles.messageBarInput}
            />
            <ul className={styles.messageBarIconList}>
              <li className={styles.messageBarIcon}>
                <IoIosGift size="24px" fill="#b9bbbe" />
              </li>
              <li className={styles.messageBarIcon}>
                <div className={styles.gifIcon}>
                  <AiOutlineGif size="22px" fill="#40444b" />
                </div>
              </li>
              <li className={styles.messageBarIconFile}>
                <AiFillFile size="24px" fill="#b9bbbe" />
              </li>
              <li className={styles.messageBarIcon}>
                <BsFillEmojiSmileFill size="24px" fill="#b9bbbe" />
              </li>
            </ul>
          </form>
        </ChatContent>
        <UserList>
          <div className={styles.userList} role="list">
            <h2>ONLINE - 2</h2>
            <li>
              <div className={styles.userListIcon} />
              <span>jp</span>
            </li>
            <li>
              <div className={styles.userListIcon} />
              <span>Versace</span>
            </li>
          </div>
        </UserList>
      </div>
    </div>
  );
};

export default ChatWindow;
