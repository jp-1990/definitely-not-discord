import { useEffect, useState } from "react";
import firebase from "firebase/app";
import { FirebaseStorage, getDownloadURL, ref } from "@firebase/storage";
import {
  collection,
  collectionGroup,
  Firestore,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { ChannelType, ServerType, UserData, MessageType } from "../types";

interface Args {
  db: Firestore;
  storage: FirebaseStorage;
}

const useFirestoreSubscriptions = ({ db, storage }: Args) => {
  const [serverList, setServerList] = useState<ServerType[]>([]);
  const [channelList, setChannelList] = useState<ChannelType<UserData>[]>([]);
  const [messageList, setMessageList] = useState<MessageType[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserData[]>([]);

  // SERVER LIST SUBSCRIPTION
  useEffect(() => {
    const serversQuery = query(collection(db, "servers"));
    const unsubServers = onSnapshot(serversQuery, (querySnapshot) => {
      const servers: ServerType[] = [];
      (async () => {
        for (let i = 0, j = querySnapshot.docs.length; i < j; i++) {
          const data = querySnapshot.docs[i].data();

          const url = await getDownloadURL(
            ref(
              storage,
              `images/${data.name.toLowerCase().split(" ").join("-")}.jpg`
            )
          );
          servers.push({
            id: querySnapshot.docs[i].id,
            name: data.name,
            icon: url,
          });
        }
        setServerList(servers);
      })();
    });
    return () => {
      unsubServers();
    };
  }, []);

  // CHANNEL LIST SUBSCRIPTION
  useEffect(() => {
    const channelsQuery = query(collectionGroup(db, "channels"));
    const unsubChannels = onSnapshot(channelsQuery, (querySnapshot) => {
      const channels: ChannelType<UserData>[] = [];
      querySnapshot.forEach(async (doc) => {
        const data = doc.data();
        channels.push({
          name: data.name,
          id: doc.id,
          type: data.type.toUpperCase(),
          server: doc.ref.parent.parent?.id || "",
          users: data.users,
        });
      });
      setChannelList(channels);
    });
    return () => {
      unsubChannels();
    };
  }, []);

  // MESSAGE LIST SUBSCRIPTION
  useEffect(() => {
    const messagesQuery = query(
      collectionGroup(db, "messages"),
      orderBy("date", "asc")
    );
    const unsubChannels = onSnapshot(messagesQuery, (querySnapshot) => {
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
          channel: doc.ref.parent.parent?.id || "",
        });
      });
      setMessageList(messages);
    });
    return () => {
      unsubChannels();
    };
  }, []);

  // ONLINE USERS SUBSCRIPTION
  useEffect(() => {
    const onlineUserQuery = query(collection(db, "onlineUsers"));
    const unsubOnlineUsers = onSnapshot(onlineUserQuery, (querySnapshot) => {
      const onlineUsers: UserData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        onlineUsers.push({
          uid: data.userId,
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
  return {
    onlineUsers,
    servers: serverList,
    channels: channelList,
    messages: messageList,
  };
};
export default useFirestoreSubscriptions;
