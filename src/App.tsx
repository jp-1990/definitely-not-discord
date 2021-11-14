import React, { useState, useEffect, useRef } from "react";
import firebase from "firebase/app";
import {
  useAuth,
  useFirebase,
  useFirestoreSubscriptions,
  useGetLogo,
  usePeerConnection,
  useSendMessage,
  useWindowSize,
} from "./hooks";

import { buildServersJSX, buildMessagesJSX, buildChannelsJSX } from "./utils";

import ServerList from "./components/ServerList";
import ChannelList from "./components/ChannelList";
import ChatWindow from "./components/ChatContent";
import SignIn from "./components/SignIn";
import "./App.css";
import ChannelGroup from "./components/ChannelList/ChannelGroup";

interface UserData {
  userId: string;
  userName: string;
  avatar?: string;
}
interface ServerState {
  id: string;
  name: string;
}
interface ChannelState extends ServerState {
  server: string;
}

const App = () => {
  const [server, setServer] = useState<ServerState>();
  const [textChannel, setTextChannel] = useState<ChannelState>();
  const [voiceChannel, setVoiceChannel] = useState<
    Omit<ChannelState, "name"> & { user: UserData }
  >();

  const scrollSpacerRef = useRef<HTMLDivElement>(null);
  const audioElementRefs = useRef<HTMLAudioElement[]>([]);
  audioElementRefs.current = [];

  const pushToRef = (el: HTMLAudioElement) => {
    if (el && !audioElementRefs.current.includes(el)) {
      audioElementRefs.current.push(el);
    }
  };

  // =========================================================================================================
  // hooks

  // firebase instances, subscriptions and auth
  const { db, auth, storage } = useFirebase();
  const { signInWithGoogle, signOut, user } = useAuth({ db, auth });
  const { servers, channels, messages, onlineUsers } =
    useFirestoreSubscriptions({ db, storage });

  // webRTC
  const loggedInUser = user?.providerData.find(
    (el) => el.providerId === "google.com"
  );
  const { connect, disconnect, connections, connectionRefs, connectedUsers } =
    usePeerConnection({
      db,
      user: loggedInUser,
      audioRefs: audioElementRefs,
    });

  // messaging
  const { sendMessage } = useSendMessage({ server, textChannel, user, db });

  // util hooks
  const { dimensions } = useWindowSize();
  const { logo } = useGetLogo({ storage });

  // =========================================================================================================
  // effects

  // ensure a server is always set
  useEffect(() => {
    if (!server) setServer(servers[0]);
    setTextChannel(channels.find((el) => el.server === server?.id));
  }, [server, servers]);

  // ensure a channel is always set
  useEffect(() => {
    if (server && !textChannel)
      setTextChannel(channels.find((el) => el.server === server?.id));
  }, [server, textChannel]);

  // scroll chat on new message
  useEffect(() => {
    scrollSpacerRef && scrollSpacerRef.current?.scrollIntoView();
  }, [messages]);

  // apply streams to audio elements
  useEffect(() => {
    audioElementRefs.current.forEach((el) => {
      const databaseConnectionRef = el.id.split("-")[0];
      const mediaStreamType = el.id.split("-")[1];

      const targetConnection = connections.current.find(
        (connection) => connection.connectionRef === databaseConnectionRef
      );
      if (!targetConnection) return;
      if (mediaStreamType === "local" && targetConnection.localStream)
        el.srcObject = targetConnection.localStream;
      if (mediaStreamType === "remote" && targetConnection.remoteStream)
        el.srcObject = targetConnection.remoteStream;
    });
  }, [connectionRefs]);

  // =========================================================================================================
  // connect / disconnect voice chat functions

  const joinVoice = async (channelId: string, serverId: string) => {
    // // disconnect from any existing voice channel

    // set voice channel state
    const loggedInUser = user?.providerData.find(
      (el) => el.providerId === "google.com"
    );
    if (!loggedInUser) return;
    const userData = {
      userId: loggedInUser.uid,
      userName: loggedInUser.displayName || "",
      avatar: loggedInUser.photoURL || "",
    };
    setVoiceChannel({ id: channelId, server: serverId, user: userData });

    // generate peer connections and media tracks
    await connect(channelId, serverId);
  };

  const leaveVoice = async () => {
    const mediaTracks: MediaStreamTrack[] = [];
    audioElementRefs.current.forEach((ref) => {
      const srcObject = ref.srcObject as MediaStream | null;
      if (!srcObject) return;
      const tracks = srcObject.getTracks();
      tracks.forEach((track) => mediaTracks.push(track));
    });
    await disconnect({
      connections,
      mediaTracks,
      voiceChannel,
      setVoiceChannel,
    });

    audioElementRefs.current.forEach((ref) => (ref.srcObject = null));
    audioElementRefs.current = [];
  };

  // =========================================================================================================
  // build audio elements

  const audioElements = connections.current.map((connection) => {
    return (
      <div key={connection.connectionRef} id={`${connection.connectionRef}`}>
        <audio
          id={`${connection.connectionRef}-local`}
          ref={pushToRef}
          muted
          autoPlay
          playsInline
        />
        <audio
          id={`${connection.connectionRef}-remote`}
          ref={pushToRef}
          autoPlay
          playsInline
        />
      </div>
    );
  });

  // =========================================================================================================
  // build servers, messages and channels jsx

  const { SERVERS } = buildServersJSX({ servers, server, setServer });
  const { TEXT, VOICE } = buildChannelsJSX({
    channels,
    server,
    textChannel,
    setTextChannel,
    joinVoice,
  });
  const { MESSAGES } = buildMessagesJSX({ textChannel, messages });

  // =========================================================================================================

  return (
    <div
      className="App"
      style={{ height: dimensions.height, width: dimensions.width }}
    >
      {user ? (
        <div style={{ display: "flex" }}>
          {audioElements}
          <ServerList dimensions={dimensions} icon={logo}>
            {SERVERS}
          </ServerList>
          <ChannelList
            dimensions={dimensions}
            user={user}
            leaveVoice={leaveVoice}
            signOut={signOut}
            server={server}
            voiceChannel={voiceChannel}
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
            sendMessage={sendMessage}
            channel={textChannel}
            onlineUsers={onlineUsers}
          >
            {MESSAGES}
            <div className="scrollSpacer" ref={scrollSpacerRef} />
          </ChatWindow>
        </div>
      ) : (
        <SignIn signInWithGoogle={signInWithGoogle} />
      )}
    </div>
  );
};

export default App;
