import React, { FormEvent, useState, useRef, useEffect } from "react";
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

import styles from "./ChatWindow.module.css";

export interface OnlineUserType {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
}

interface Props {
  sendMessage: (message: string) => void;
  channel: { id: string; name: string; server: string } | undefined;
  onlineUsers: OnlineUserType[];
}

const ChatWindow: React.FC<Props> = ({
  sendMessage,
  channel,
  onlineUsers,
  children,
}) => {
  const [textInput, setTextInput] = useState<string>("");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!textInput) return;
    sendMessage(textInput);
    setTextInput("");
  };

  const renderOnlineUsers =
    onlineUsers &&
    onlineUsers.map((el) => {
      return (
        <li key={el.id}>
          <div className={styles.userListIcon}>
            {el.avatar && (
              <div>
                <img src={el.avatar} />
                <div className={styles.onlineMarker} />
              </div>
            )}
          </div>
          <span>{el.userName}</span>
        </li>
      );
    });

  return (
    <section className={styles.container}>
      <header>
        <div className={styles.titleContainer}>
          <span>#</span>
          <h3>{channel?.name}</h3>
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
      </header>
      <div style={{ display: "flex" }}>
        <div className={styles.chatContentContainer}>
          <main
            className={styles.chatContentOuter}
            style={{ height: window.innerHeight - 49 - 44 - 24 }}
          >
            <div className={styles.chatContentInner}>{children}</div>
          </main>
          <form className={styles.messageInputForm} onSubmit={onSubmit}>
            <button className={styles.messageAddFileButton}>
              <BsPlusCircleFill size="22px" color="#b9bbbe" />
            </button>
            <input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
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
        </div>
        <aside
          style={{
            height: window.innerHeight - 49,
          }}
          className={styles.userListContainer}
        >
          <div className={styles.userList} role="list">
            <h2>ONLINE - {onlineUsers.length}</h2>
            {renderOnlineUsers}
          </div>
        </aside>
      </div>
    </section>
  );
};

export default ChatWindow;
