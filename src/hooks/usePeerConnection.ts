import React, { useState, useRef, useEffect, SetStateAction } from "react";
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  onSnapshot,
  where,
} from "@firebase/firestore";
import { UserInfo } from "@firebase/auth";
import { query, updateDoc } from "firebase/firestore";

import { setExistingAnswerToRemoteDescription } from "../utils";

export interface OnlineUserType {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
}

interface ConnectionType {
  offerUser: string;
  answerUser: string;
  connection: RTCPeerConnection;
  connectionRef: string;
  localStream: MediaStream;
  remoteStream: MediaStream;
}

interface Args {
  user: UserInfo | undefined;
  db: Firestore;
  audioRefs: React.MutableRefObject<HTMLAudioElement[]>;
}

const usePeerConnection = ({ user, db, audioRefs }: Args) => {
  const connections = useRef<ConnectionType[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const [serverId, setServerId] = useState<string | undefined>();
  const [channelId, setChannelId] = useState<string | undefined>();

  const [connectionRefs, setConnectionRefs] = useState<string[]>([]);

  // LISTEN FOR NEW ANSWERS ON CONNECTION DOCS
  useEffect(() => {
    if (!serverId || !channelId) return;
    const path = `servers/${serverId}/channels/${channelId}/connections`;
    const q = query(collection(db, path));
    // listen for updates to each connection doc
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const changes = snapshot.docChanges();

      // when doc updates get answer and ice answer candidates and set to relevant peer connection
      changes.forEach(async (change) => {
        if (change.type === "added" || change.type === "modified") {
          const connectionDoc = change.doc.data();

          const connection = connections.current.find(
            (el) => el.connectionRef === change.doc.id
          )?.connection;
          if (!connection || connection.remoteDescription) return;

          // set answer and answerCandidates to peer connection as remote description
          await setExistingAnswerToRemoteDescription(connectionDoc, connection);
        }
      });
    });
    return () => unsubscribe();
  }, [serverId, channelId]);

  // LISTEN FOR CHANGES IN USERS IN CHANNEL
  useEffect(() => {
    if (!serverId || !channelId) return;
    const path = `servers/${serverId}/channels/${channelId}`;
    // listen for changes to users in channel
    const unsubscribe = onSnapshot(doc(db, path), async (snapshot) => {
      if (!user) return;
      const users = snapshot.data()?.users;
      // remove users who left
      if (users.length < connectedUsers.length) {
        const currentUsers = [...users.map((el: OnlineUserType) => el.userId)];
        const currentConnections = [...connections.current];
        const redundantConnections = currentConnections.filter(
          (el) =>
            !(
              currentUsers.includes(el.answerUser) &&
              currentUsers.includes(el.offerUser)
            )
        );
        redundantConnections.forEach((el) => {
          el.connection.close();
          const mediaTracks: MediaStreamTrack[] = [];
          audioRefs.current.forEach((ref) => {
            const databaseConnectionRef = ref.id.split("-")[0];
            if (databaseConnectionRef === el.connectionRef) {
              const srcObject = ref.srcObject as MediaStream | null;
              if (!srcObject) return;
              const tracks = srcObject.getTracks();
              tracks.forEach((track) => mediaTracks.push(track));
            }
          });
          mediaTracks.forEach((track) => track.stop());
        });
        const redundantConnectionRefs = redundantConnections.map(
          (el) => el.connectionRef
        );
        const newState = currentConnections.filter(
          (el) => !redundantConnectionRefs.includes(el.connectionRef)
        );
        connections.current = newState;
        setConnectionRefs(newState.map((el) => el.connectionRef));
        setConnectedUsers([...new Set(currentUsers)]);
      }

      if (!users) return;
      // find new users
      const newUsers: OnlineUserType[] = users.filter(
        (el: OnlineUserType) => !connectedUsers.includes(el.userId)
      );
      if (newUsers.length === 0) return;

      // on user join, check for connection docs where answer user = userId
      for (let i = 0, j = newUsers.length; i < j; i++) {
        const q = query(
          collection(db, path, `/connections`),
          where("answerUser", "==", user.uid)
        );
        // create answer for relevant connection doc, and answer ice candidates, and add to doc
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(async (connectionDoc) => {
          // if a connection for this doc already exists, return
          if (connectionRefs.includes(connectionDoc.id)) return;

          const data = connectionDoc.data();
          // if the doc already has an answer or the current user is not the answer user, return
          if (data.answer || data.answerUser !== user?.uid) return;

          // create new peer connection where remoteDesc = offer and localDesc = answer
          const { connection, localStream, remoteStream } =
            await fullPeerConnection({
              db,
              data,
              connectionPath: `${path}/connections/${connectionDoc.id}`,
            });
          if (!connection || !localStream || !remoteStream) return;

          // add connection object to connection ref
          const newConnection = {
            localStream,
            remoteStream,
            connection,
            connectionRef: connectionDoc.id,
            offerUser: newUsers[i].userId,
            answerUser: user.uid,
          };
          connections.current.push(newConnection);
          setConnectionRefs((prev) => [
            ...new Set([...prev, connectionDoc.id]),
          ]);
        });

        // add new user in channel to connected users state
        setConnectedUsers((prev) => {
          return [...new Set([...prev, newUsers[i].userId])];
        });
      }
    });
    return () => unsubscribe();
  }, [connectedUsers, audioRefs, connectionRefs, serverId, channelId]);

  // CONNECT TO CHANNEL
  const connect = async (channelId: string, serverId: string) => {
    if (!channelId || !serverId || !user) return;
    setChannelId(channelId);
    setServerId(serverId);

    const channelPath = `servers/${serverId}/channels/${channelId}`;

    // 1. check for users in channel
    const usersInChannel = (await (await getDoc(doc(db, channelPath))).data()
      ?.users) as OnlineUserType[];

    // if no users, skip to step 3. if users.length >=6, show alert
    if (usersInChannel.length >= 6) return;
    if (usersInChannel.length > 0) {
      // 2. loop users and create an offer for each user
      for (let i = 0, j = usersInChannel.length; i < j; i++) {
        const userInChannel = usersInChannel[i];

        // create offer, media streams and set to listening server
        const { connection, connectionRef, localStream, remoteStream } =
          await offerPeerConnection({
            db,
            channelPath,
            offerUser: user.uid,
            answerUser: userInChannel.userId,
          });
        if (!connection || !connectionRef || !localStream || !remoteStream)
          return;

        // add connection object to connection ref
        const newConnection = {
          localStream,
          remoteStream,
          connection,
          connectionRef: connectionRef.id,
          offerUser: user.uid,
          answerUser: userInChannel.userId,
        };
        connections.current.push(newConnection);
        setConnectionRefs((prev) => [...new Set([...prev, connectionRef.id])]);

        // add user in channel to connected users state
        setConnectedUsers((prev) => [
          ...new Set([...prev, userInChannel.userId]),
        ]);
      }
    }

    // add this user to connected users state
    setConnectedUsers((prev) => [...new Set([...prev, user.uid])]);
    // connect user to channel doc by adding user details
    const userData = {
      userId: user.uid,
      userName: user.displayName,
      avatar: user.photoURL,
    };
    await updateDoc(doc(db, channelPath), { users: arrayUnion(userData) });
  };

  interface VoiceChannelState {
    id: string;
    server: string;
    user: Omit<OnlineUserType, "id">;
  }

  interface DisconnectArgs {
    connections: React.MutableRefObject<ConnectionType[]>;
    mediaTracks: MediaStreamTrack[];
    voiceChannel: VoiceChannelState | undefined;
    setVoiceChannel: React.Dispatch<
      SetStateAction<VoiceChannelState | undefined>
    >;
  }

  // DISCONNECT FROM CHANNEL
  const disconnect = async ({
    connections,
    mediaTracks,
    voiceChannel,
    setVoiceChannel,
  }: DisconnectArgs) => {
    if (!voiceChannel) return;

    // close all media streams
    mediaTracks.forEach((track) => track.stop());

    // close all peer connections
    connections.current.forEach((connection) => connection.connection.close());
    connections.current = [];
    setConnectionRefs([]);

    // reset state
    setConnectedUsers([]);
    setChannelId(undefined);
    setServerId(undefined);

    // remove user details from channel
    const channelRef = doc(
      db,
      `servers/${voiceChannel.server}/channels/${voiceChannel.id}`
    );
    await updateDoc(channelRef, { users: arrayRemove(voiceChannel.user) });

    // remove all connection docs where offerUser = user.uid
    const offerQuery = query(
      collection(
        db,
        `servers/${voiceChannel.server}/channels/${voiceChannel.id}/connections`
      ),
      where("offerUser", "==", user?.uid)
    );
    const offerSnapshot = await getDocs(offerQuery);
    offerSnapshot.forEach((connectionDoc) => deleteDoc(connectionDoc.ref));

    // remove all connection docs where answerUser = user.uid
    const answerQuery = query(
      collection(
        db,
        `servers/${voiceChannel.server}/channels/${voiceChannel.id}/connections`
      ),
      where("answerUser", "==", user?.uid)
    );
    const answerSnapshot = await getDocs(answerQuery);
    answerSnapshot.forEach((connectionDoc) => deleteDoc(connectionDoc.ref));

    // set voice channel state to undefined
    setVoiceChannel(undefined);
  };

  return {
    connect,
    disconnect,
    connections,
    connectionRefs,
    connectedUsers,
  };
};
export default usePeerConnection;
