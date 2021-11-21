import React, { useState, useEffect, useRef } from "react";
import firebase from "firebase/app";

import {
  useAuth,
  useFirebase,
  useFirestoreSubscriptions,
  useGetLogo,
  useSendMessage,
  useWebRTCConnections,
  useWindowSize,
} from "./hooks";

import "./App.css";
import SignIn from "./components/SignIn";
import ServerList from "./components/ServerList";
import ChannelList, { Channels } from "./components/ChannelList";
import ChatWindow from "./components/ChatContent";

import {
  muteMediaStream,
  unmuteMediaStream,
  buildServersJSX,
  buildMessagesJSX,
} from "./utils";

import {
  UserData,
  VoiceChannelState,
  TextChannelState,
  ServerState,
} from "./types";
import { Firestore } from "@firebase/firestore";
import { FirebaseStorage } from "@firebase/storage";
import { User } from "@firebase/auth";

interface Props {
  db: Firestore;
  storage: FirebaseStorage;
  signOut: () => Promise<void>;
  user: User;
  dimensions: {
    width: number;
    height: number;
  };
}

const App: React.FC<Props> = ({ db, storage, user, signOut, dimensions }) => {
  const [server, setServer] = useState<ServerState>();
  const [textChannel, setTextChannel] = useState<TextChannelState>();
  const [voiceChannel, setVoiceChannel] =
    useState<VoiceChannelState<UserData>>();
  const [currentUser, setCurrentUser] = useState<UserData>({
    uid: "",
    userName: "",
    avatar: "",
  });

  const scrollSpacerRef = useRef<HTMLDivElement>(null);

  // =========================================================================================================
  // hooks

  // firebase subscriptions
  const { servers, channels, messages, onlineUsers } =
    useFirestoreSubscriptions({ db, storage });

  const loggedInUser = user?.providerData.find(
    (el) => el.providerId === "google.com"
  );
  useEffect(() => {
    setCurrentUser({
      uid: loggedInUser?.uid || "",
      userName: loggedInUser?.displayName || "",
      avatar: loggedInUser?.photoURL || "",
    });
  }, [loggedInUser]);

  // webRTC
  const { state, connectToVoiceChannel, disconnectFromVoiceChannel } =
    useWebRTCConnections({ db, voiceChannel, setVoiceChannel, currentUser });

  // messaging
  const { sendMessage } = useSendMessage({ server, textChannel, user, db });

  // util hooks
  const { logo } = useGetLogo({ storage });

  // =========================================================================================================
  // effects

  // ensure a server is always set
  useEffect(() => {
    if (!server) setServer(servers[0]);
    setTextChannel(
      channels.find((el) => el.server === server?.id && el.type === "TEXT")
    );
  }, [server, servers]);

  // ensure a channel is always set
  useEffect(() => {
    if (server && !textChannel)
      setTextChannel(
        channels.find((el) => el.server === server?.id && el.type === "TEXT")
      );
  }, [server, textChannel]);

  // scroll chat on new message
  useEffect(() => {
    scrollSpacerRef && scrollSpacerRef.current?.scrollIntoView();
  }, [messages, textChannel]);

  // =========================================================================================================
  // webRTC / audio functions

  const joinVoice = async (channelId: string, serverId: string) => {
    if (voiceChannel) await disconnectFromVoiceChannel();
    await connectToVoiceChannel(channelId, serverId);
  };
  const leaveVoice = async () => {
    await disconnectFromVoiceChannel();
  };

  const muteSelf = () => {
    state.connections?.forEach((connection) => {
      if (connection.localMediaStream)
        muteMediaStream(connection.localMediaStream);
    });
  };
  const unmuteSelf = () => {
    state.connections?.forEach((connection) => {
      if (connection.localMediaStream)
        unmuteMediaStream(connection.localMediaStream);
    });
  };

  const muteOthers = () => {
    state.connections?.forEach((connection) => {
      if (connection.remoteMediaStream)
        muteMediaStream(connection.remoteMediaStream);
    });
  };
  const unmuteOthers = () => {
    state.connections?.forEach((connection) => {
      if (connection.remoteMediaStream)
        unmuteMediaStream(connection.remoteMediaStream);
    });
  };

  // =========================================================================================================
  // build servers and messages jsx

  const { SERVERS } = buildServersJSX({ servers, server, setServer });
  const { MESSAGES } = buildMessagesJSX({ textChannel, messages });

  // =========================================================================================================

  const audioElements = state.connections?.map((connection) => {
    return (
      <div
        key={connection.connectionDocumentRef.id}
        id={connection.connectionDocumentRef.id}
      >
        <audio
          muted
          id="localAudio"
          ref={(element) => {
            if (element)
              element.srcObject = connection.localMediaStream as MediaProvider;
          }}
          autoPlay
          playsInline
        ></audio>
        <audio
          id="remoteAudio"
          ref={(element) => {
            if (element)
              element.srcObject = connection.remoteMediaStream as MediaProvider;
          }}
          autoPlay
          playsInline
        ></audio>
      </div>
    );
  });

  return (
    <div
      className="App"
      style={{ height: dimensions.height, width: dimensions.width }}
    >
      <div style={{ display: "flex" }}>
        {audioElements}

        <ServerList dimensions={dimensions} icon={logo}>
          {SERVERS}
        </ServerList>
        <ChannelList
          dimensions={dimensions}
          user={user}
          server={server}
          voiceChannel={voiceChannel}
          actions={{
            muteSelf,
            unmuteSelf,
            muteOthers,
            unmuteOthers,
            signOut,
            leaveVoice,
          }}
        >
          <Channels
            channels={channels}
            server={server}
            textChannel={textChannel}
            setTextChannel={setTextChannel}
            joinVoice={joinVoice}
            currentUser={currentUser}
            connections={state.connections}
          />
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
    </div>
  );
};

export default App;
