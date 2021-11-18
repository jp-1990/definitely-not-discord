import React, { useState, useReducer, useEffect, useRef, Reducer } from "react";
import firebase from "firebase/app";
import {
  useAuth,
  useFirebase,
  useFirestoreSubscriptions,
  useGetLogo,
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
  getDocs,
  updateDoc,
} from "firebase/firestore";

import {
  setIceCandidateToConnection,
  setExistingAnswerToRemoteDescription,
  createOffer,
  answerOffer,
  getAudioLevel,
} from "./utils/webrtc-functions";
import { Unsubscribe } from "@firebase/util";

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
interface VoiceChannelState extends Omit<ChannelState, "name"> {
  user: UserData;
  channelDocumentRef: DocumentReference<DocumentData>;
}

const App = () => {
  const [server, setServer] = useState<ServerState>();
  const [textChannel, setTextChannel] = useState<ChannelState>();
  const [voiceChannel, setVoiceChannel] = useState<VoiceChannelState>();
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

  interface ConnectionType {
    offerUser: string;
    answerUser: string;
    connection: RTCPeerConnection;
    connectionDocumentRef: DocumentReference<DocumentData>;
    offerCandidatesCollectionRef: CollectionReference<DocumentData>;
    answerCandidatesCollectionRef: CollectionReference<DocumentData>;
    localMediaStream: MediaStream | undefined;
    remoteMediaStream: MediaStream | undefined;
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
  interface PayloadType {
    channelDocumentRef: DocumentReference<DocumentData>;
    connections: ConnectionType[];
    users: UserData[];
  }
  type ConnectionsActionType =
    | {
        type: "CONNECT_INITIAL";
        payload: Omit<PayloadType, "connections">;
      }
    | {
        type: "CONNECT_SELF";
        payload: PayloadType;
      }
    | {
        type: "DISCONNECT_SELF";
      }
    | {
        type: "CONNECT_OTHER";
        payload: Omit<PayloadType, "channelDocumentRef" | "users">;
      }
    | {
        type: "DISCONNECT_OTHER";
        payload: Omit<PayloadType, "channelDocumentRef" | "connections">;
      };

  const connectionsReducer: Reducer<
    ConnectionsStateType,
    ConnectionsActionType
  > = (state, action) => {
    switch (action.type) {
      case actionTypes.connectInitial: {
        // set channel document ref, self to state
        return {
          ...state,
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
            ?.getTracks()
            .forEach((track) => track.stop());
          connection.remoteMediaStream
            ?.getTracks()
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
        if (!action.payload.connections) return state;
        // add new connections for new users and new users to users
        return {
          ...state,
          connections: state.connections
            ? [...state.connections, ...action.payload.connections]
            : action.payload.connections,
        };
      }
      case actionTypes.disconnectOther: {
        if (!action.payload.users) return state;
        if (!state.connections) return state;
        const connectionsToRemove: string[] = [];
        action.payload.users?.forEach((user) => {
          const connection = state.connections?.find(
            (el) => (el.answerUser || el.offerUser) === user.uid
          );
          // close connection and media streams for user
          if (connection) {
            connection.localMediaStream
              ?.getTracks()
              .forEach((track) => track.stop());
            connection.remoteMediaStream
              ?.getTracks()
              .forEach((track) => track.stop());
            connection.connection.close();
            connectionsToRemove.push(connection.connectionDocumentRef.id);
          }
        });
        // remove user connections
        return {
          ...state,
          connections: state.connections.filter(
            (el) => !connectionsToRemove.includes(el.connectionDocumentRef.id)
          ),
        };
      }
      default: {
        throw new Error(`Unhandled action type: ${JSON.stringify(action)}`);
      }
    }
  };

  const [state, dispatch] = useReducer(connectionsReducer, {
    connections: undefined,
    connectedUsers: undefined,
    channelDocumentRef: undefined,
  });

  const local = useRef<HTMLAudioElement>(null);
  const remote = useRef<HTMLAudioElement>(null);

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

  const answerConnectionOffer = async ({
    channelDocumentRef,
    peerConnection,
    connectionId,
  }: {
    channelDocumentRef: DocumentReference<DocumentData>;
    peerConnection: RTCPeerConnection;
    connectionId: string;
  }) => {
    // firestore refs
    const connectionDocumentRef = doc(
      db,
      channelDocumentRef.path,
      `connections/${connectionId}`
    );
    const offerCandidatesCollectionRef = collection(
      db,
      connectionDocumentRef.path,
      "offerCandidates"
    );
    const answerCandidatesCollectionRef = collection(
      db,
      connectionDocumentRef.path,
      "answerCandidates"
    );

    const { connection, localStream, remoteStream } = await answerOffer(
      peerConnection,
      connectionDocumentRef,
      answerCandidatesCollectionRef
    );

    if (local && local.current && localStream)
      local.current.srcObject = localStream;
    if (remote && remote.current && remoteStream)
      remote.current.srcObject = remoteStream;

    return {
      connection,
      connectionDocumentRef,
      offerCandidatesCollectionRef,
      answerCandidatesCollectionRef,
      localMediaStream: localStream,
      remoteMediaStream: remoteStream,
    };
  };

  // answer connections
  useEffect(() => {
    // listen for new documents in the 'connections' collection
    if (!voiceChannel?.channelDocumentRef) return;
    const { channelDocumentRef } = voiceChannel;
    const unsubscribeToConnections = onSnapshot(
      collection(db, channelDocumentRef.path, "connections"),
      (col) => {
        try {
          col.docChanges().forEach(async (change) => {
            // if connection added or modified, and answerUser === currentUser.uid, offer exists, and is not yet answered, then answer the connection, else return immediately
            if (change.type !== "added" && change.type !== "modified") return;
            const connectionData = change.doc.data();
            if (
              connectionData.answerUser !== currentUser.uid ||
              !connectionData.offer ||
              connectionData.answer
            )
              return;

            const peerConnection = new RTCPeerConnection(STUNServers);
            const {
              connection,
              connectionDocumentRef,
              localMediaStream,
              remoteMediaStream,
              offerCandidatesCollectionRef,
              answerCandidatesCollectionRef,
            } = await answerConnectionOffer({
              channelDocumentRef,
              peerConnection,
              connectionId: change.doc.id,
            });

            dispatch({
              type: "CONNECT_OTHER",
              payload: {
                connections: [
                  {
                    offerUser: connectionData.offerUser,
                    answerUser: voiceChannel.user.uid,
                    connection,
                    connectionDocumentRef,
                    offerCandidatesCollectionRef,
                    answerCandidatesCollectionRef,
                    localMediaStream,
                    remoteMediaStream,
                  },
                ],
              },
            });
          });
        } catch (err) {
          throw new Error(
            `failed to answer connection (answer connections useEffect): ${err}`
          );
        }
      }
    );
    return () => {
      unsubscribeToConnections();
    };
  }, [voiceChannel]);

  // listen for answers on connection documents
  useEffect(() => {
    // listen for answers on connection documents
    if (!voiceChannel?.channelDocumentRef) return;
    const { channelDocumentRef } = voiceChannel;
    const unsubscribeToAnswers = onSnapshot(
      collection(db, channelDocumentRef.path, "connections"),
      (col) => {
        try {
          col.docChanges().forEach(async (change) => {
            // if connection added or modified, and offerUser === currentUser.uid, and answer exists then get answer and set to relevant local connection, else return immediately
            if (change.type !== "added" && change.type !== "modified") return;
            const connectionData = change.doc.data();
            if (
              connectionData.offerUser !== currentUser.uid ||
              !connectionData.answer
            )
              return;

            const peerConnection = state.connections?.find(
              (con) => con.connectionDocumentRef.id === change.doc.id
            );
            peerConnection &&
              setExistingAnswerToRemoteDescription(
                peerConnection.connection,
                connectionData
              );
          });
        } catch (err) {
          throw new Error(
            `failed to get answer from connection document (listen for answers useEffect): ${err}`
          );
        }
      }
    );

    return () => {
      unsubscribeToAnswers();
    };
  }, [voiceChannel]);

  // listen for ice candidates
  useEffect(() => {
    const unsubscribers: Unsubscribe[] = [];
    try {
      state.connections?.forEach((connection) => {
        // listen for new documents in the 'offerCandidates' collection if user is answerUser
        if (connection.answerUser === voiceChannel?.user.uid) {
          const unsubscribeToICEOfferCandidates = onSnapshot(
            connection.offerCandidatesCollectionRef,
            (col) => {
              col.docChanges().forEach((change) => {
                if (change.type === "added") {
                  setIceCandidateToConnection(
                    connection.connection,
                    change.doc.data()
                  );
                }
              });
            }
          );
          unsubscribers.push(unsubscribeToICEOfferCandidates);
        }
        // listen for new documents in the 'answerCandidates' collection if user is offerUser
        if (connection.offerUser === voiceChannel?.user.uid) {
          const unsubscribeToICEOfferCandidates = onSnapshot(
            connection.answerCandidatesCollectionRef,
            (col) => {
              col.docChanges().forEach((change) => {
                if (change.type === "added") {
                  setIceCandidateToConnection(
                    connection.connection,
                    change.doc.data()
                  );
                }
              });
            }
          );
          unsubscribers.push(unsubscribeToICEOfferCandidates);
        }
      });
    } catch (err) {
      throw new Error(
        `failed to retrieve ICE candidates (ice candidate listener useEffect): ${err}`
      );
    }
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [state.connections, voiceChannel]);

  // listen for users leaving the current channel
  useEffect(() => {
    // user leaving will clean up the listening server so only clean up local connection state
    if (!voiceChannel?.channelDocumentRef) return;
    const { channelDocumentRef } = voiceChannel;
    const unsubscribeToUserDisconnects = onSnapshot(
      collection(db, channelDocumentRef.path, "users"),
      (col) => {
        col.docChanges().forEach((change) => {
          if (change.type === "removed") {
            const { uid, userName, avatar } = change.doc.data();
            dispatch({
              type: "DISCONNECT_OTHER",
              payload: { users: [{ uid, userName, avatar }] },
            });
          }
        });
      }
    );

    return () => {
      unsubscribeToUserDisconnects();
    };
  }, [voiceChannel]);

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

  const createConnectionOffer = async ({
    channelId,
    serverId,
    peerConnection,
    answerUserId,
  }: {
    channelId: string;
    serverId: string;
    peerConnection: RTCPeerConnection;
    answerUserId: string;
  }) => {
    // firestore refs
    const connectionDocumentRef = await addDoc(
      collection(db, `servers/${serverId}/channels/${channelId}/connections`),
      { offerUser: loggedInUser?.uid, answerUser: answerUserId }
    );
    const offerCandidatesCollectionRef = collection(
      db,
      connectionDocumentRef.path,
      "offerCandidates"
    );
    const answerCandidatesCollectionRef = collection(
      db,
      connectionDocumentRef.path,
      "answerCandidates"
    );

    const { connection, localStream, remoteStream } = await createOffer(
      peerConnection,
      connectionDocumentRef,
      offerCandidatesCollectionRef
    );

    if (local && local.current && localStream)
      local.current.srcObject = localStream;
    if (remote && remote.current && remoteStream)
      remote.current.srcObject = remoteStream;

    return {
      connection,
      connectionDocumentRef,
      offerCandidatesCollectionRef,
      answerCandidatesCollectionRef,
      localMediaStream: localStream,
      remoteMediaStream: remoteStream,
    };
  };

  /**
   *
   * @param channelId string - document.id for firestore channel document
   * @param serverId string - document.id for firestore server document
   *
   * @description Initiates the process of connecting a user to a voice channel. The function queries firestore for users currently connected to the channel and builds an array with their details. If there are already users in the channel, a peer connection and media tracks for each user will be created locally, while ice offer candidates, and an offer, will be set on the listening server. The document reference for the channel, the user array, and the created connections will be set to local state. If there are no users in the channel, no connections will be created, but the channel document reference and users array (current user) will still be set to local state. Regardless of the number of users, local state will be set with the details of the voice channel (id, serverId, current user), and the current user's details will be set as a document (id will match uid) in the channel/users collection, and in the channel doc in a 'users' array.
   */
  const connectToVoiceChannel = async (channelId: string, serverId: string) => {
    try {
      const channelDocumentRef = doc(
        db,
        `servers/${serverId}/channels/${channelId}`
      );
      // query for users in channel
      const userQuery = await getDocs(
        collection(db, `${channelDocumentRef.path}/users`)
      );
      const usersInChannel: UserData[] = [];
      userQuery.forEach(
        (el) =>
          el.data().uid !== currentUser.uid &&
          usersInChannel.push(el.data() as UserData)
      );

      console.log(usersInChannel);
      // if users other than current user
      if (usersInChannel.length > 0) {
        // send offers to each user already in the channel
        const connections = await Promise.all(
          usersInChannel.map(async (user) => {
            const peerConnection = new RTCPeerConnection(STUNServers);
            const {
              connection,
              connectionDocumentRef,
              localMediaStream,
              remoteMediaStream,
              offerCandidatesCollectionRef,
              answerCandidatesCollectionRef,
            } = await createConnectionOffer({
              channelId,
              serverId,
              peerConnection,
              answerUserId: user.uid,
            });
            return {
              connection,
              connectionDocumentRef,
              offerCandidatesCollectionRef,
              answerCandidatesCollectionRef,
              localMediaStream,
              remoteMediaStream,
              offerUser: currentUser.uid,
              answerUser: user.uid,
            };
          })
        );
        // set connection, users and channel ref to state
        dispatch({
          type: "CONNECT_SELF",
          payload: {
            connections,
            channelDocumentRef,
            users: [...usersInChannel, currentUser],
          },
        });
      } else {
        // set current user and channel ref to state
        dispatch({
          type: "CONNECT_INITIAL",
          payload: { channelDocumentRef, users: [currentUser] },
        });
      }

      // connect user to channel local state and database
      setVoiceChannel({
        id: channelId,
        server: serverId,
        user: currentUser,
        channelDocumentRef,
      });
      await setDoc(doc(channelDocumentRef, `users/${currentUser.uid}`), {
        ...currentUser,
      });
      await updateDoc(channelDocumentRef, { users: arrayUnion(currentUser) });
    } catch (err) {
      throw new Error(
        `unable to connect to voice channel (connectToVoiceChannel): ${err}`
      );
    }
  };
  //
  // ----------------------------------------------
  //

  const joinVoice = async (channelId: string, serverId: string) => {
    // disconnect from any existing voice channel

    await connectToVoiceChannel(channelId, serverId);
  };

  /**
   * @description Disconnects the current user from the channel set in the voiceChannel state. Removes any connection documents from the listening server where the current user is the offer or answer user. Removes the current user from the users array field on the channel document, and the document in the channel/users collection which matches the current user uid. Will throw if there is no channelDocummentRef in the voiceChannel state.
   */
  const disconnectFromVoiceChannel = async () => {
    try {
      if (!voiceChannel?.channelDocumentRef)
        throw new Error(
          "cannot remove database documents: channelDocumentRef is undefined"
        );
      const { channelDocumentRef, user } = voiceChannel;

      // remove any connection document where currentUser.uid === answerUser or offerUser
      const offerConnections = query(
        collection(db, channelDocumentRef.path, "connections"),
        where("offerUser", "==", user.uid)
      );
      const answerConnections = query(
        collection(db, channelDocumentRef.path, "connections"),
        where("answerUser", "==", user.uid)
      );
      const offerSnapshot = await getDocs(offerConnections);
      const answerSnapshot = await getDocs(answerConnections);
      offerSnapshot.forEach(async (doc) => {
        const offerCandidates = await getDocs(
          query(
            collection(
              db,
              channelDocumentRef.path,
              `connections/${doc.id}/offerCandidates`
            )
          )
        );
        const answerCandidates = await getDocs(
          query(
            collection(
              db,
              channelDocumentRef.path,
              `connections/${doc.id}/answerCandidates`
            )
          )
        );
        offerCandidates.forEach((doc) => deleteDoc(doc.ref));
        answerCandidates.forEach((doc) => deleteDoc(doc.ref));
        deleteDoc(doc.ref);
      });
      answerSnapshot.forEach(async (doc) => {
        const offerCandidates = await getDocs(
          query(
            collection(
              db,
              channelDocumentRef.path,
              `connections/${doc.id}/offerCandidates`
            )
          )
        );
        const answerCandidates = await getDocs(
          query(
            collection(
              db,
              channelDocumentRef.path,
              `connections/${doc.id}/answerCandidates`
            )
          )
        );
        offerCandidates.forEach((doc) => deleteDoc(doc.ref));
        answerCandidates.forEach((doc) => deleteDoc(doc.ref));
        deleteDoc(doc.ref);
      });

      // remove user details from voice channel in db
      await updateDoc(channelDocumentRef, {
        users: arrayRemove(user),
      });
      await deleteDoc(doc(db, channelDocumentRef.path, `users/${user.uid}`));

      // reset local state
      setVoiceChannel(undefined);
      dispatch({ type: "DISCONNECT_SELF" });
    } catch (err) {
      throw new Error(
        `failed to disconnect from voice channel (disconnectFromVoiceChannel): ${err}`
      );
    }
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

  console.log({ state });

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
            leaveVoice={disconnectFromVoiceChannel}
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
