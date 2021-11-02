import React, { useState, useEffect } from "react";
import firebase from "firebase/app";
import { collection, addDoc } from "firebase/firestore";
import {
  useAuth,
  useFirebase,
  useFirestoreSubscriptions,
  useGetLogo,
  useWindowSize,
} from "./hooks";

import { buildServersJSX, buildChannelsJSX } from "./utils";

import ServerList from "./components/ServerList";
import ChannelList from "./components/ChannelList";
import ChatWindow, { MessageType } from "./components/ChatContent";
import SignIn from "./components/SignIn";
import "./App.css";
import ChannelGroup from "./components/ChannelList/ChannelGroup";

interface ServerState {
  id: string;
  name: string;
}
interface ChannelState extends ServerState {
  server: string;
}

function App() {
  const [server, setServer] = useState<ServerState>();
  const [channel, setChannel] = useState<ChannelState>();

  // firebase instances, subscriptions and auth
  const { db, auth, storage } = useFirebase();
  const { signInWithGoogle, signOut, user } = useAuth({ db, auth });
  const { servers, channels, messages, onlineUsers } =
    useFirestoreSubscriptions({ db, storage });

  // util hooks
  const { dimensions } = useWindowSize();
  const { logo } = useGetLogo({ storage });

  // ensure a server is always set
  useEffect(() => {
    if (!server) setServer(servers[0]);
  }, [server, servers]);

  // ensure a channel is always set
  useEffect(() => {
    if (server && !channel)
      setChannel(channels.find((el) => el.server === server?.id));
  }, [server, channel]);

  const addMessage = async (path: string, data: Omit<MessageType, "id">) => {
    await addDoc(collection(db, path), data);
  };

  // build servers and channels jsx
  const { SERVERS } = buildServersJSX({ servers, server, setServer });
  const { TEXT, VOICE } = buildChannelsJSX({
    channels,
    server,
    channel,
    setChannel,
  });

  return (
    <div
      className="App"
      style={{ height: dimensions.height, width: dimensions.width }}
    >
      {user ? (
        <div style={{ display: "flex" }}>
          <ServerList dimensions={dimensions} icon={logo}>
            {SERVERS}
          </ServerList>
          <ChannelList
            dimensions={dimensions}
            serverName={server?.name || ""}
            user={user}
            signOut={signOut}
          >
            {!!TEXT.length && (
              <ChannelGroup title="TEXT CHANNELS" expanded>
                {TEXT}
              </ChannelGroup>
            )}
            {!!VOICE.length && (
              <ChannelGroup title="VOICE CHANNELS" expanded>
                {VOICE}
              </ChannelGroup>
            )}
          </ChannelList>
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
