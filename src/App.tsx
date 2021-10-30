import React, { useState, useEffect } from "react";

import firebase from "firebase/app";
import { initializeApp } from "firebase/app";
import {
  deleteDoc,
  getFirestore,
  orderBy,
  Unsubscribe,
} from "firebase/firestore";

import {
  getAuth,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  doc,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

import "./App.css";

import ServerList, { ServerType } from "./components/ServerList";
import ChannelList, { ChannelType } from "./components/ChannelList";
import ChatWindow, {
  MessageType,
  OnlineUserType,
} from "./components/ChatContent";
import SignIn from "./components/SignIn";

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
const storage = getStorage();

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
  const [onlineUsers, setOnlineUsers] = useState<OnlineUserType[]>([]);
  const [notDiscord, setNotDiscord] = useState<string>("");

  const user = auth.currentUser;

  useEffect(() => {
    const handleResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const onlineUserRef = collection(db, "onlineUsers");
    const onlineUserQuery = query(onlineUserRef);

    const unsubOnlineUsers = onSnapshot(onlineUserQuery, (querySnapshot) => {
      const onlineUsers: OnlineUserType[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        onlineUsers.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          avatar: data.avatar,
        });
      });
      setOnlineUsers(onlineUsers);
    });
    return () => {
      unsubOnlineUsers();
    };
  }, []);

  useEffect(() => {
    const serverRef = collection(db, "servers");
    const serverQuery = query(serverRef);

    const unsubServers = onSnapshot(serverQuery, (querySnapshot) => {
      const servers: ServerType[] = [];

      const asyncLoop = async () => {
        for (let i = 0; i < querySnapshot.docs.length; i++) {
          const data = querySnapshot.docs[i].data();

          const url = await getDownloadURL(
            ref(storage, `images/${data.name.toLowerCase()}.jpg`)
          );
          servers.push({
            id: querySnapshot.docs[i].id,
            name: data.name,
            icon: url,
          });
        }
        const notDiscordUrl = await getDownloadURL(
          ref(storage, `images/notdiscord.jpg`)
        );
        setNotDiscord(notDiscordUrl);
        setServerList(servers);
        if (!server) setServer(servers[0]);
      };
      asyncLoop();
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

  const handleSignOut = async () => {
    const userData = auth?.currentUser?.providerData.find(
      (el: Record<string, any>) => el.providerId === "google.com"
    );

    const q = query(
      collection(db, "onlineUsers"),
      where("userId", "==", userData?.uid)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((el) => {
      deleteDoc(doc(db, `onlineUsers/${el.id}`));
    });
    signOut(auth);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        const userData = result.user.providerData.find(
          (el: Record<string, any>) => el.providerId === "google.com"
        );
        addDoc(collection(db, "onlineUsers"), {
          userId: userData?.uid,
          userName: userData?.displayName,
          avatar: userData?.photoURL,
        });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <div
      className="App"
      style={{ height: dimensions?.height, width: dimensions?.width }}
    >
      {user ? (
        <div style={{ display: "flex" }}>
          <ServerList
            icon={notDiscord}
            serverList={serverList}
            server={server}
            setServer={setServer}
          />
          <ChannelList
            channelList={channelList}
            server={server}
            channel={channel}
            setChannel={setChannel}
            user={user}
            signOut={handleSignOut}
          />
          <ChatWindow
            messages={messageList}
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
