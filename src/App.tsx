import React, { useState, useReducer, useEffect, useRef, Reducer } from "react";
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
import {
  CollectionReference,
  doc,
  DocumentData,
  DocumentReference,
  onSnapshot,
  query,
  setDoc,
  where,
} from "@firebase/firestore";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import {
  addLocalTracksToConnection,
  getRemoteTracksFromConnection,
  setIceCandidateToConnection,
  setExistingAnswerToRemoteDescription,
  createOffer,
  answerOffer,
  getAudioLevel,
} from "./utils/webrtc-functions";

/**
 *
 *@property {string} - uid
 *@property {string} - userName
 *@property {string | undefined} - avatar (url string)
 */
interface UserData {
  uid: string;
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
  const [currentUser, setCurrentUser] = useState<UserData>({
    uid: "",
    userName: "",
    avatar: "",
  });

  const scrollSpacerRef = useRef<HTMLDivElement>(null);
  // const audioElementRefs = useRef<HTMLAudioElement[]>([]);
  // audioElementRefs.current = [];

  // const pushToRef = (el: HTMLAudioElement) => {
  //   if (el && !audioElementRefs.current.includes(el)) {
  //     audioElementRefs.current.push(el);
  //   }
  // };

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
  useEffect(() => {
    setCurrentUser({
      uid: loggedInUser?.uid || "",
      userName: loggedInUser?.displayName || "",
      avatar: loggedInUser?.photoURL || "",
    });
  }, [loggedInUser]);
  // const { connect, disconnect, connections, connectionRefs, connectedUsers } =
  //   usePeerConnection({
  //     db,
  //     user: loggedInUser,
  //     audioRefs: audioElementRefs,
  //   });

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

  // // apply streams to audio elements
  // useEffect(() => {
  //   audioElementRefs.current.forEach((el) => {
  //     const databaseConnectionRef = el.id.split("-")[0];
  //     const mediaStreamType = el.id.split("-")[1];

  //     const targetConnection = connections.current.find(
  //       (connection) => connection.connectionRef === databaseConnectionRef
  //     );
  //     if (!targetConnection) return;
  //     if (mediaStreamType === "local" && targetConnection.localStream)
  //       el.srcObject = targetConnection.localStream;
  //     if (mediaStreamType === "remote" && targetConnection.remoteStream)
  //       el.srcObject = targetConnection.remoteStream;
  //   });
  // }, [connectionRefs]);

  // // =========================================================================================================
  // // connect / disconnect voice chat functions

  // const joinVoice = async (channelId: string, serverId: string) => {
  //   // // disconnect from any existing voice channel

  //   // set voice channel state
  //   const loggedInUser = user?.providerData.find(
  //     (el) => el.providerId === "google.com"
  //   );
  //   if (!loggedInUser) return;
  //   const userData = {
  //     userId: loggedInUser.uid,
  //     userName: loggedInUser.displayName || "",
  //     avatar: loggedInUser.photoURL || "",
  //   };
  //   setVoiceChannel({ id: channelId, server: serverId, user: userData });

  //   // generate peer connections and media tracks
  //   await connect(channelId, serverId);
  // };

  // const leaveVoice = async () => {
  //   const mediaTracks: MediaStreamTrack[] = [];
  //   audioElementRefs.current.forEach((ref) => {
  //     const srcObject = ref.srcObject as MediaStream | null;
  //     if (!srcObject) return;
  //     const tracks = srcObject.getTracks();
  //     tracks.forEach((track) => mediaTracks.push(track));
  //   });
  //   await disconnect({
  //     connections,
  //     mediaTracks,
  //     voiceChannel,
  //     setVoiceChannel,
  //   });

  //   audioElementRefs.current.forEach((ref) => (ref.srcObject = null));
  //   audioElementRefs.current = [];
  // };

  // // =========================================================================================================
  // // build audio elements

  // const audioElements = connections.current.map((connection) => {
  //   return (
  //     <div key={connection.connectionRef} id={`${connection.connectionRef}`}>
  //       <audio
  //         id={`${connection.connectionRef}-local`}
  //         ref={pushToRef}
  //         muted
  //         autoPlay
  //         playsInline
  //       />
  //       <audio
  //         id={`${connection.connectionRef}-remote`}
  //         ref={pushToRef}
  //         autoPlay
  //         playsInline
  //       />
  //     </div>
  //   );
  // });

  // =========================================================================================================
  // -----------
  // WEBRTC
  // -----------

  interface ConnectionType {
    offerUser: string;
    answerUser: string;
    connection: RTCPeerConnection;
    connectionDocumentRef: DocumentReference<DocumentData>;
    offerCandidatesCollectionRef: CollectionReference<DocumentData>;
    answerCandidatesCollectionRef: CollectionReference<DocumentData>;
    localMediaStream: MediaStream;
    remoteMediaStream: MediaStream;
  }
  interface ConnectionsStateType {
    connections: ConnectionType[] | undefined;
    connectedUsers: UserData[] | undefined;
    channelDocumentRef: DocumentReference<DocumentData> | undefined;
  }
  const actionTypes = {
    connectInitial: "CONNECT_INITIAL",
    connectSelf: "CONNECT_SELF",
    disconnectSelf: "DISCONNECT_SELF",
    connectOther: "CONNECT_OTHER",
    disconnectOther: "DISCONNECT_OTHER",
  } as const;
  type Actions<T> = T[keyof T];
  interface PayloadType {
    channelDocumentRef?: DocumentReference<DocumentData>;
    connections?: ConnectionType[];
    users?: UserData[];
  }
  interface ConnectionsActionType {
    type: Actions<typeof actionTypes>;
    payload: PayloadType;
  }

  const connectionsReducer: Reducer<
    ConnectionsStateType,
    ConnectionsActionType
  > = (state, action) => {
    switch (action.type) {
      case actionTypes.connectInitial: {
        // set channel document ref, self to state
        return {
          connections: action.payload.connections,
          connectedUsers: action.payload.users,
          channelDocumentRef: action.payload.channelDocumentRef,
        };
      }
      case actionTypes.connectSelf: {
        // set channel document ref, users, connections to state
        return {
          connections: action.payload.connections,
          connectedUsers: action.payload.users,
          channelDocumentRef: action.payload.channelDocumentRef,
        };
      }
      case actionTypes.disconnectSelf: {
        // close all media streams and connections
        state.connections?.forEach((connection) => {
          connection.localMediaStream
            .getTracks()
            .forEach((track) => track.stop());
          connection.remoteMediaStream
            .getTracks()
            .forEach((track) => track.stop());
          connection.connection.close();
        });
        // clear all state
        return {
          connections: undefined,
          connectedUsers: undefined,
          channelDocumentRef: undefined,
        };
      }
      case actionTypes.connectOther: {
        if (!action.payload.connections || !action.payload.users) return state;
        if (!state.connections || !state.connectedUsers) return state;
        // add new connections for new users and new users to users
        return {
          ...state,
          connections: [...state.connections, ...action.payload.connections],
          connectedUsers: [...state.connectedUsers, ...action.payload.users],
        };
      }
      case actionTypes.disconnectOther: {
        if (!action.payload.users) return state;
        if (!state.connections || !state.connectedUsers) return state;
        const connectionsToRemove: string[] = [];
        const usersToRemove: string[] = [];
        action.payload.users?.forEach((user) => {
          const connection = state.connections?.find(
            (el) => (el.answerUser || el.offerUser) === user.uid
          );
          // close connection and media streams for user
          if (connection) {
            connection.localMediaStream
              .getTracks()
              .forEach((track) => track.stop());
            connection.remoteMediaStream
              .getTracks()
              .forEach((track) => track.stop());
            connection.connection.close();
            connectionsToRemove.push(connection.connectionDocumentRef.id);
            usersToRemove.push(user.uid);
          }
        });
        // remove user connection and user from users
        return {
          ...state,
          connections: state.connections.filter(
            (el) => !connectionsToRemove.includes(el.connectionDocumentRef.id)
          ),
          connectedUsers: state.connectedUsers.filter(
            (el) => !usersToRemove.includes(el.uid)
          ),
        };
      }
      default: {
        throw new Error(`Unhandled action type: ${action.type}`);
      }
    }
  };

  const [state, dispatch] = useReducer(connectionsReducer, {
    connections: undefined,
    connectedUsers: undefined,
    channelDocumentRef: undefined,
  });

  const [channelDatabaseRef, setChannelDatabaseRef] =
    useState<DocumentReference<DocumentData>>();
  const [answerCandidatesRef, setAnswerCandidatesRef] =
    useState<CollectionReference<DocumentData>>();
  const [offerCandidatesRef, setOfferCandidatesRef] =
    useState<CollectionReference<DocumentData>>();

  const [peerConnection, setPeerConnection] = useState<
    RTCPeerConnection | undefined
  >();
  const local = useRef<HTMLAudioElement>(null);
  const remote = useRef<HTMLAudioElement>(null);

  // useEffect(() => {
  //   if (connections && connections.length > 0) {
  //     if (local && local.current)
  //       // @ts-expect-error ???
  //       local.current.srcObject = connections[0].localStream;

  //     if (remote && remote.current)
  //       // @ts-expect-error ???
  //       remote.current.srcObject = connections[0].remoteStream;

  //     console.log({ connections });
  //   }
  // }, [connections]);

  const STUNServers = {
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  // let peerConnection: RTCPeerConnection | undefined = undefined;
  let localStream: MediaStream | undefined = undefined;
  let remoteStream: MediaStream | undefined = undefined;

  useEffect(() => {
    // Listen for remote answer
    let unsubVoiceChannel = () => {};
    if (channelDatabaseRef && peerConnection) {
      unsubVoiceChannel = onSnapshot(channelDatabaseRef, (doc) => {
        const data = doc.data();
        if (!peerConnection?.currentRemoteDescription && data?.answer) {
          setExistingAnswerToRemoteDescription(peerConnection, data);
        }
      });
    }
    return () => {
      unsubVoiceChannel();
    };
  }, [channelDatabaseRef, peerConnection]);

  useEffect(() => {
    // Listen for ICE answers
    let unsubVoiceChannel = () => {};
    if (answerCandidatesRef && peerConnection) {
      unsubVoiceChannel = onSnapshot(answerCandidatesRef, (doc) => {
        doc.docChanges().forEach((change) => {
          if (change.type === "added") {
            setIceCandidateToConnection(peerConnection, change.doc.data());
          }
        });
      });
    }
    return () => {
      unsubVoiceChannel();
    };
  }, [answerCandidatesRef, peerConnection]);

  useEffect(() => {
    // Listen for ICE offers
    let unsubVoiceChannel = () => {};
    if (offerCandidatesRef && peerConnection) {
      unsubVoiceChannel = onSnapshot(offerCandidatesRef, (doc) => {
        doc.docChanges().forEach((change) => {
          if (change.type === "added") {
            setIceCandidateToConnection(peerConnection, change.doc.data());
          }
        });
      });
    }
    return () => {
      unsubVoiceChannel();
    };
  }, [offerCandidatesRef, peerConnection]);

  // useEffect(() => {
  //   let intervalId: NodeJS.Timer;
  //   if (peerConnection) {
  //     intervalId = setInterval(() => {
  //       console.log(getAudioLevel(peerConnection));
  //     }, 200);
  //   }
  //   return () => {
  //     clearInterval(intervalId);
  //   };
  // }, [peerConnection]);

  const removeMediaFeed = async () => {
    // remove local tracks
    if (local && local.current && local.current.srcObject) {
      const srcObject = local.current.srcObject as MediaStream;
      const tracks = srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      local.current.srcObject = null;
    }

    // remove remote tracks
    if (remote && remote.current && remote.current.srcObject) {
      const srcObject = remote.current.srcObject as MediaStream;
      const tracks = srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      remote.current.srcObject = null;
    }
  };

  const createConnectionOffer = async ({
    channelId,
    serverId,
    peerConnection,
    answerUserId,
  }: {
    channelId: string;
    serverId: string;
    peerConnection: RTCPeerConnection | undefined;
    answerUserId: string;
  }) => {
    if (!peerConnection) return;

    // firestore refs
    const connectionRef = await addDoc(
      collection(db, `servers/${serverId}/channels/${channelId}/connections`),
      { offerUser: loggedInUser?.uid, answerUser: answerUserId }
    );
    const offerCandidatesRef = collection(
      db,
      connectionRef.path,
      "offerCandidates"
    );
    const answerCandidatesRef = collection(
      db,
      connectionRef.path,
      "answerCandidates"
    );
    setChannelDatabaseRef(connectionRef);
    setAnswerCandidatesRef(answerCandidatesRef);

    const { connection, localStream, remoteStream } = await createOffer(
      peerConnection,
      connectionRef,
      offerCandidatesRef
    );

    if (local && local.current && localStream)
      local.current.srcObject = localStream;
    if (remote && remote.current && remoteStream)
      remote.current.srcObject = remoteStream;

    setPeerConnection(connection);
  };

  const answerConnectionOffer = async ({
    channelId,
    serverId,
    peerConnection,
    connectionId,
  }: {
    channelId: string;
    serverId: string;
    peerConnection: RTCPeerConnection | undefined;
    connectionId: string;
  }) => {
    if (!peerConnection) return;

    // firestore refs
    const connectionRef = doc(
      db,
      `servers/${serverId}/channels/${channelId}/connections/${connectionId}`
    );
    const offerCandidates = collection(
      db,
      connectionRef.path,
      "offerCandidates"
    );
    const answerCandidates = collection(
      db,
      connectionRef.path,
      "answerCandidates"
    );
    setOfferCandidatesRef(offerCandidates);

    const { connection, localStream, remoteStream } = await answerOffer(
      peerConnection,
      connectionRef,
      answerCandidates
    );

    if (local && local.current && localStream)
      local.current.srcObject = localStream;
    if (remote && remote.current && remoteStream)
      remote.current.srcObject = remoteStream;

    setPeerConnection(connection);
  };

  const connectToVoiceChannel = async (channelId: string, serverId: string) => {
    const channelRef = doc(db, `servers/${serverId}/channels/${channelId}`);
    // query for users in channel
    const userQuery = await getDocs(collection(db, `${channelRef.path}/users`));
    const usersInChannel: UserData[] = [];
    userQuery.forEach(
      (el) =>
        el.data().uid !== currentUser.uid &&
        usersInChannel.push(el.data() as UserData)
    );

    console.log(usersInChannel);
    // if users other than current user
    if (usersInChannel.length > 0) {
      // send offers to users already in the channel
    } else {
    }

    // connect user to channel
    setVoiceChannel({ id: channelId, server: serverId, user: currentUser });
    await setDoc(doc(channelRef, `users/${currentUser.uid}`), {
      ...currentUser,
    });
    await updateDoc(channelRef, { users: arrayUnion(currentUser) });
  };

  const joinVoice = async (channelId: string, serverId: string) => {
    connectToVoiceChannel(channelId, serverId);
    // disconnect from any existing voice channel

    // create peer connection object
    const newPeerConnection = new RTCPeerConnection(STUNServers);

    // query for offer
    const q = query(
      collection(db, `servers/${serverId}/channels/${channelId}/connections`),
      where("offerUser", "==", "115569811279942913451")
    );
    const channelSnapshot = await getDocs(q);
    let offer: any;
    channelSnapshot.forEach((el) => {
      if (el.data().offer) offer = el.data().offer;
    });
    // if offer, respondToOffer()  add media tracks
    if (offer) {
      answerConnectionOffer({
        channelId,
        serverId,
        peerConnection: newPeerConnection,
        connectionId: "R18xcPNQUkOZJV4JDGBg",
      });
    } else {
      createConnectionOffer({
        channelId,
        serverId,
        peerConnection: newPeerConnection,
        answerUserId: "",
      });
    }
  };

  const leaveVoice = async () => {
    // close media streams
    removeMediaFeed();

    // close peer connection
    if (peerConnection) peerConnection.close();

    // remove user details from voice channel in db
    const channelRef = doc(
      db,
      `servers/${voiceChannel?.server}/channels/${voiceChannel?.id}/users/${loggedInUser?.uid}`
    );
    await updateDoc(
      doc(db, `servers/${voiceChannel?.server}/channels/${voiceChannel?.id}`),
      { users: arrayRemove(voiceChannel?.user) }
    );
    await deleteDoc(channelRef);

    // clean up peer connection entries in database
    // const remainingUsers = await getDoc(channelRef);
    // if (remainingUsers.data()?.users.length === 0) {
    //   await updateDoc(channelRef, { offer: deleteField() });
    //   await updateDoc(channelRef, { answer: deleteField() });
    //   const offerCandidatesSnapshot = await getDocs(
    //     collection(
    //       db,
    //       `servers/${voiceChannel?.server}/channels/${voiceChannel?.id}/offerCandidates`
    //     )
    //   );
    //   const answerCandidatesSnapshot = await getDocs(
    //     collection(
    //       db,
    //       `servers/${voiceChannel?.server}/channels/${voiceChannel?.id}/answerCandidates`
    //     )
    //   );
    //   offerCandidatesSnapshot.forEach((doc) => deleteDoc(doc.ref));
    //   answerCandidatesSnapshot.forEach((doc) => deleteDoc(doc.ref));
    // }

    // set voice channel state to undefined
    setVoiceChannel(undefined);
    setPeerConnection(undefined);
  };

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

  console.log({ peerConnection });

  return (
    <div
      className="App"
      style={{ height: dimensions.height, width: dimensions.width }}
    >
      {user ? (
        <div style={{ display: "flex" }}>
          {/* {audioElements} */}

          <div className="videos">
            <span>
              <audio muted id="audio" ref={local} autoPlay playsInline></audio>
            </span>
            <span>
              <audio id="remoteAudio" ref={remote} autoPlay playsInline></audio>
            </span>
          </div>

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
