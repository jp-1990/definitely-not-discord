import React, { useState, useEffect } from "react";
import firebase from "firebase/app";
import { collection, addDoc } from "firebase/firestore";
import {
  useAuth,
  useFirebase,
  useFirestoreSubscriptions,
  useWindowSize,
} from "./hooks";

import ServerList from "./components/ServerList";
import ChannelList from "./components/ChannelList";
import ChatWindow, { MessageType } from "./components/ChatContent";
import SignIn from "./components/SignIn";
import "./App.css";

function App() {
  const [server, setServer] = useState<{ id: string; name: string }>();
  const [channel, setChannel] =
    useState<{ id: string; name: string; server: string }>();

  const [notDiscord, setNotDiscord] = useState<string>("");

  const { db, auth, storage } = useFirebase();
  const { signInWithGoogle, signOut, user } = useAuth({ db, auth });
  const { servers, channels, messages, onlineUsers } =
    useFirestoreSubscriptions({ db, storage });

  const { dimensions } = useWindowSize();

  useEffect(() => {
    if (!server) setServer(servers[0]);
  }, [server, servers]);

  // const notDiscordUrl = await getDownloadURL(
  //   ref(storage, `images/notdiscord.jpg`)
  // );
  // setNotDiscord(notDiscordUrl);

  const addMessage = async (path: string, data: Omit<MessageType, "id">) => {
    await addDoc(collection(db, path), data);
  };

  return (
    <div
      className="App"
      style={{ height: dimensions.height, width: dimensions.width }}
    >
      {user ? (
        <div style={{ display: "flex" }}>
          <ServerList
            icon={notDiscord}
            serverList={servers}
            server={server}
            setServer={setServer}
          />
          <ChannelList
            channelList={channels}
            server={server}
            channel={channel}
            setChannel={setChannel}
            user={user}
            signOut={signOut}
          />
          <ChatWindow
            messages={messages}
            addMessage={addMessage}
            channel={channel}
            server={server}
            user={user}
            onlineUsers={onlineUsers}
          />
        </div>
      ) : (
        <SignIn signInWithGoogle={signInWithGoogle} />
      )}
    </div>
  );
}

export default App;
