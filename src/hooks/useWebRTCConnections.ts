import React, { useReducer, useEffect } from "react";
import firebase from "firebase/app";

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
  Firestore,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { Unsubscribe } from "@firebase/util";

import { connectionStateReducer } from "../reducers";
import {
  setIceCandidateToConnection,
  setExistingAnswerToRemoteDescription,
  createOffer,
  answerOffer,
} from "../utils";
import { UserData, VoiceChannelState } from "../types";

interface Args {
  db: Firestore;
  voiceChannel: VoiceChannelState<UserData> | undefined;
  setVoiceChannel: React.Dispatch<
    React.SetStateAction<VoiceChannelState<UserData> | undefined>
  >;
  currentUser: UserData;
}

const useWebRTCConnections = ({
  db,
  voiceChannel,
  setVoiceChannel,
  currentUser,
}: Args) => {
  const [state, dispatch] = useReducer(connectionStateReducer, {
    connections: undefined,
    channelDocumentRef: undefined,
  });

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
              (await setExistingAnswerToRemoteDescription(
                peerConnection.connection,
                connectionData
              ));
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

  interface CreateConnectionOfferArgs {
    channelId: string;
    serverId: string;
    peerConnection: RTCPeerConnection;
    answerUserId: string;
  }
  type CreateConnectionOfferReturn = Promise<{
    connection: RTCPeerConnection;
    connectionDocumentRef: DocumentReference<DocumentData>;
    offerCandidatesCollectionRef: CollectionReference<DocumentData>;
    answerCandidatesCollectionRef: CollectionReference<DocumentData>;
    localMediaStream: MediaStream | undefined;
    remoteMediaStream: MediaStream | undefined;
  }>;
  /**
   *
   * @param args - {@link CreateConnectionOfferArgs}
   * @param args.channelId - string id of channel doc on listening server
   * @param args.serverId - string id of server doc on listening server
   * @param args.peerConnection - RTCPeerConnection object to use to create offer
   * @param args.answerUserId - the uid of the user expected to respond to the connection
   * @returns Promise  [ {@link CreateConnectionOfferReturn} ]
   *
   * @description Creates a connection document on the listening server and passes the ref of that document to 'createOffer', which;
   *
   * Creates a local and remote media stream, adds the local tracks to the connection and sets a callback to set the remote tracks to the remoteStream when they become available. A callback is applied to the connection to set ice candidates for the offer to the listening server when they become available. An offer is then created for the connection, and set the the provided connectionRef on the listening server. The function returns the original peer connection with the modifications applied, plus the local and remote media streams.
   *
   * Returns the modified connection object, the references to the connection doc, offerCandidatesCollection and answerCandidatesCollection on that doc on the listening server, and the local and remote media stream objects.
   */
  const createConnectionOffer = async ({
    channelId,
    serverId,
    peerConnection,
    answerUserId,
  }: CreateConnectionOfferArgs): CreateConnectionOfferReturn => {
    // firestore refs
    const connectionDocumentRef = await addDoc(
      collection(db, `servers/${serverId}/channels/${channelId}/connections`),
      { offerUser: currentUser.uid, answerUser: answerUserId }
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

    return {
      connection,
      connectionDocumentRef,
      offerCandidatesCollectionRef,
      answerCandidatesCollectionRef,
      localMediaStream: localStream,
      remoteMediaStream: remoteStream,
    };
  };

  interface AnswerConnectionOfferArgs {
    channelDocumentRef: DocumentReference<DocumentData>;
    peerConnection: RTCPeerConnection;
    connectionId: string;
  }
  type AnswerConnectionOfferReturn = Promise<{
    connection: RTCPeerConnection;
    connectionDocumentRef: DocumentReference<DocumentData>;
    offerCandidatesCollectionRef: CollectionReference<DocumentData>;
    answerCandidatesCollectionRef: CollectionReference<DocumentData>;
    localMediaStream: MediaStream | undefined;
    remoteMediaStream: MediaStream | undefined;
  }>;
  /**
   *
   * @param args - {@link AnswerConnectionOfferArgs}
   * @param args.channelDocumentRef - ref to the channel document on listening server
   * @param args.peerConnection - RTCPeerConnection object to use to create offer
   * @param args.connectionId - the id of the connection document to answer on the listening server
   * @returns Promise  [ {@link AnswerConnectionOfferReturn} ]
   *
   * @description Gets the ref for the connection document on the listening server with the provided connectionId and passes the ref of that document to 'createOffer', which;
   *
   * Creates a local and remote media stream, adds the local tracks to the connection and sets a callback to set the remote tracks to the remoteStream when they become available. A callback is applied to the connection to set ice candidates for the answer to the listening server when they become available. The existing offer is then fetched from the listening server and set as the remote description. An answer is then created for the connection, and set the the provided connectionRef on the listening server. The function returns the original peer connection with the modifications applied, plus the local and remote media streams.
   *
   * Returns the modified connection object, the references to the connection doc, offerCandidatesCollection and answerCandidatesCollection on that doc on the listening server, and the local and remote media stream objects.
   */
  const answerConnectionOffer = async ({
    channelDocumentRef,
    peerConnection,
    connectionId,
  }: AnswerConnectionOfferArgs): AnswerConnectionOfferReturn => {
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

  return {
    state,
    connectToVoiceChannel,
    disconnectFromVoiceChannel,
  };
};

export default useWebRTCConnections;
