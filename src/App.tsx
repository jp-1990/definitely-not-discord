import React, { useState, useEffect } from "react";

import firebase from "firebase/app";
import { initializeApp } from "firebase/app";
import {
  DocumentData,
  getFirestore,
  orderBy,
  Unsubscribe,
} from "firebase/firestore";

import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  onSnapshot,
} from "firebase/firestore";

import { useAuthState } from "react-firebase-hooks/auth";

import "./App.css";

import ServerList, { ServerType } from "./components/ServerList";
import ChannelList, { ChannelType } from "./components/ChannelList";
import ChatWindow, { MessageType } from "./components/ChatContent";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAd408UrbbLQ4o2SnLRiplOz6Qdqmp-UiY",
  authDomain: "definitely-not-discord-8bf44.firebaseapp.com",
  projectId: "definitely-not-discord-8bf44",
  storageBucket: "definitely-not-discord-8bf44.appspot.com",
  messagingSenderId: "839946763116",
  appId: "1:839946763116:web:429835f1b1697ecc21d149",
};

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getFirestore();

const SignIn = () => {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };
  return <button onClick={signInWithGoogle} />;
};
// const SignOut = () => {
//   return auth.currentUser && <button onClick={auth.signOut} />;
// };

// const serversQuery = () => {
//   const serverRef = collection(db, "servers");
//   const q = query(serverRef, where("name", "==", "Test Server"));
//   return q;
// };

// const testSnapshot = await getDocs(serversQuery());
// testSnapshot.forEach((el) => console.log(el.data(), el.id));

function App() {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: window.innerWidth, height: window.innerHeight });
  const [serverList, setServerList] = useState<ServerType[]>([]);
  const [channelList, setChannelList] = useState<Record<string, ChannelType[]>>(
    {}
  );
  const [messageList, setMessageList] = useState<Record<string, MessageType[]>>(
    {}
  );
  const [server, setServer] = useState<{ id: string; name: string }>();
  const [channel, setChannel] =
    useState<{ id: string; name: string; server: string }>();

  const [user] = useAuthState(auth);

  useEffect(() => {
    const handleResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const serverRef = collection(db, "servers");
    const serverQuery = query(serverRef);

    const unsubServers = onSnapshot(serverQuery, (querySnapshot) => {
      const servers: ServerType[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        servers.push({ id: doc.id, name: data.name, icon: data.icon });
      });
      setServerList(servers);
      if (!server) setServer(servers[0]);
    });
    return () => {
      unsubServers();
    };
  }, []);

  useEffect(() => {
    if (serverList.length === 0) return;
    const unsubArray: Unsubscribe[] = [];
    serverList.forEach((server) => {
      const channelRef = collection(db, `servers/${server.id}/channels`);
      const channelQuery = query(channelRef);

      const unsubChannels = onSnapshot(channelQuery, (querySnapshot) => {
        const channels: ChannelType[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          channels.push({
            name: data.name,
            id: doc.id,
            type: data.type,
            server: server.id,
          });
        });
        setChannelList((prev) => ({
          ...prev,
          [server.id]: channels,
        }));
        unsubArray.push(unsubChannels);
      });
    });
    return () => {
      unsubArray.forEach((el) => el());
    };
  }, [serverList]);

  useEffect(() => {
    if (Object.keys(channelList).length === 0) return;
    const unsubArray: Unsubscribe[] = [];
    Object.keys(channelList).forEach((server) => {
      channelList[server].forEach((channel) => {
        const messagesRef = collection(
          db,
          `servers/${server}/channels/${channel.id}/messages`
        );
        const messagesQuery = query(messagesRef, orderBy("date", "asc"));

        const unsubMessages = onSnapshot(messagesQuery, (querySnapshot) => {
          const messages: MessageType[] = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            messages.push({
              id: doc.id,
              userName: data.userName,
              userId: data.userId,
              avatar: data.avatar,
              date: data.date,
              message: data.message,
            });
          });
          setMessageList((prev) => ({
            ...prev,
            [channel.id]: messages,
          }));
          unsubArray.push(unsubMessages);
        });
      });
    });
    return () => {
      unsubArray.forEach((el) => el());
    };
  }, [channelList]);

  const addMessage = async (path: string, data: Omit<MessageType, "id">) => {
    await addDoc(collection(db, path), data);
  };

  return (
    <div
      className="App"
      style={{ height: dimensions?.height, width: dimensions?.width }}
    >
      {!user ? (
        <div style={{ display: "flex" }}>
          <ServerList
            serverList={serverList}
            server={server}
            setServer={setServer}
          />
          <ChannelList
            channelList={channelList}
            server={server}
            channel={channel}
            setChannel={setChannel}
          />
          <ChatWindow
            messages={messageList}
            addMessage={addMessage}
            channel={channel}
            server={server}
          />
        </div>
      ) : (
        <SignIn />
      )}
    </div>
  );
}

export default App;
