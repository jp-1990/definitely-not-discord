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

import { ChatContent, ChatHeader, UserList } from "./Layout";
import styles from "./ChatWindow.module.css";

export interface MessageType {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  date: string;
  message: string;
}

export type OnlineUserType = Omit<MessageType, "date" | "message">;

interface Props {
  channel: { id: string; name: string; server: string } | undefined;
  server: { id: string; name: string } | undefined;
  messages: Record<string, MessageType[]>;
  addMessage: (path: string, data: Omit<MessageType, "id">) => void;
  user: any;
  onlineUsers: OnlineUserType[];
}

const ChatWindow: React.FC<Props> = ({
  messages,
  channel,
  server,
  addMessage,
  user,
  onlineUsers,
}) => {
  const [textInput, setTextInput] = useState<string>("");
  // const [messages, setMessages] = useState<Message[]>([]);

  const scrollSpacerRef = useRef<HTMLDivElement>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!textInput) return;

    const userData = user.providerData.find(
      (el: Record<string, any>) => el.providerId === "google.com"
    );

    addMessage(`servers/${server?.id}/channels/${channel?.id}/messages`, {
      userId: userData.uid,
      userName: userData.displayName,
      date: `${Date.now()}`,
      message: textInput,
      avatar: userData.photoURL,
    });
    // setMessages((prev) => {
    //   return [
    //     ...prev,
    //     {
    //       id: prev[messages.length - 1]?.id + 1 || 0,
    //       userId: 0,
    //       userName: "jp",
    //       avatar: undefined,
    //       date: new Date(Date.now()),
    //       message: textInput,
    //       channel: channel?.id || "",
    //       server: server?.id || "",
    //     },
    //   ];
    // });
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

  const renderMessages = (() => {
    if (!channel) return;
    if (!messages[channel.id]) return;

    return messages[channel.id].map((el, i) => {
      if (el.userId === messages[channel.id][i - 1]?.userId)
        return (
          <span key={el.id} className={styles.messageText}>
            {el.message}
          </span>
        );
      return (
        <article key={el.id}>
          <div className={styles.messageAvatar}>
            {el.avatar && <img src={el.avatar} />}
          </div>
          <div className={styles.messageAuthor}>
            <h4>{el.userName}</h4>
            <span>
              {new Date(+el.date).toDateString()} at{" "}
              {new Date(+el.date).getHours()}:{new Date(+el.date).getMinutes()}
            </span>
          </div>
          <span className={styles.messageText}>{el.message}</span>
        </article>
      );
    });
  })();

  useEffect(() => {
    scrollSpacerRef && scrollSpacerRef.current?.scrollIntoView();
  }, [messages]);

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
              color: "#fff",
            }}
          >
            {channel?.name}
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
          <main
            className={styles.chatContentOuter}
            style={{ height: window.innerHeight - 49 - 44 - 24 }}
          >
            <div className={styles.chatContentInner}>
              {renderMessages}
              <div className={styles.scrollSpacer} ref={scrollSpacerRef} />
            </div>
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
        </ChatContent>
        <UserList>
          <div className={styles.userList} role="list">
            <h2>ONLINE - {onlineUsers.length}</h2>
            {renderOnlineUsers}
          </div>
        </UserList>
      </div>
    </div>
  );
};

export default ChatWindow;
