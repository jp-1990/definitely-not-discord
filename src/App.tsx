import React, { useState, useEffect, useRef } from "react";
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
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  CollectionReference,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from "@firebase/firestore";
import { DocumentData, DocumentReference, query } from "firebase/firestore";

interface UserData {
  userId: string | undefined;
  userName: string | undefined | null;
  avatar: string | undefined | null;
}
interface ServerState {
  id: string;
  name: string;
}
interface ChannelState extends ServerState {
  server: string;
}

function App() {
  const [server, setServer] = useState<ServerState>();
  const [textChannel, setTextChannel] = useState<ChannelState>();
  const [voiceChannel, setVoiceChannel] = useState<
    Omit<ChannelState, "name"> & { user: UserData }
  >();

  const scrollSpacerRef = useRef<HTMLDivElement>(null);

  // firebase instances, subscriptions and auth
  const { db, auth, storage } = useFirebase();
  const { signInWithGoogle, signOut, user } = useAuth({ db, auth });
  const { servers, channels, messages, onlineUsers } =
    useFirestoreSubscriptions({ db, storage });

  // messaging
  const { sendMessage } = useSendMessage({ server, textChannel, user, db });

  // util hooks
  const { dimensions } = useWindowSize();
  const { logo } = useGetLogo({ storage });

  // ensure a server is always set
  useEffect(() => {
    if (!server) setServer(servers[0]);
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

  // =========================================================================================================
  // -----------
  // WEBRTC
  // -----------
  const [channelDatabaseRef, setChannelDatabaseRef] =
    useState<DocumentReference<DocumentData>>();
  const [answerCandidatesRef, setAnswerCandidatesRef] =
    useState<CollectionReference<DocumentData>>();
  const [offerCandidatesRef, setOfferCandidatesRef] =
    useState<CollectionReference<DocumentData>>();

  const [peerConnection, setPeerConnection] = useState<
    RTCPeerConnection | undefined
  >();
  const local = useRef<HTMLVideoElement>(null);
  const remote = useRef<HTMLVideoElement>(null);

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
          const answerDescription = new RTCSessionDescription(data.answer);
          peerConnection?.setRemoteDescription(answerDescription);
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
            const candidate = new RTCIceCandidate(change.doc.data());
            peerConnection?.addIceCandidate(candidate);
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
            const candidate = new RTCIceCandidate(change.doc.data());
            peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });
      });
    }
    return () => {
      unsubVoiceChannel();
    };
  }, [offerCandidatesRef, peerConnection]);

  const addMediaFeed = async (peerConnection: RTCPeerConnection) => {
    if (!peerConnection) return;
    localStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });
    remoteStream = new MediaStream();

    // Push tracks from local stream to peer connection
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream as MediaStream);
    });

    // Pull tracks from remote stream, add to video stream
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream && remoteStream.addTrack(track);
      });
    };

    if (local && local.current) local.current.srcObject = localStream;
    if (remote && remote.current) remote.current.srcObject = remoteStream;

    return peerConnection;
  };

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

  const createOffer = async ({
    channelId,
    serverId,
    peerConnection,
  }: {
    channelId: string;
    serverId: string;
    peerConnection: RTCPeerConnection | undefined;
  }) => {
    if (!peerConnection) return;

    // firestore refs
    const channelRef = doc(db, `servers/${serverId}/channels/${channelId}`);
    const offerCandidates = collection(db, channelRef.path, "offerCandidates");
    const answerCandidates = collection(
      db,
      channelRef.path,
      "answerCandidates"
    );
    setChannelDatabaseRef(channelRef);
    setAnswerCandidatesRef(answerCandidates);

    // Get candidates for call peer, save to db
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate)
        await addDoc(offerCandidates, event.candidate.toJSON());
    };

    // Create offer
    const offerDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerDescription);
    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };
    await updateDoc(channelRef, { offer });

    setPeerConnection(peerConnection);
  };

  const respondToOffer = async ({
    channelId,
    serverId,
    peerConnection,
  }: {
    channelId: string;
    serverId: string;
    peerConnection: RTCPeerConnection | undefined;
  }) => {
    if (!peerConnection) return;

    // firestore refs
    const channelRef = doc(db, `servers/${serverId}/channels/${channelId}`);
    const offerCandidates = collection(db, channelRef.path, "offerCandidates");
    const answerCandidates = collection(
      db,
      channelRef.path,
      "answerCandidates"
    );
    setOfferCandidatesRef(offerCandidates);

    // Get candidates for answer peer, save to db
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate)
        await addDoc(answerCandidates, event.candidate.toJSON());
    };

    // get connection data and set offer and answer (remote=offer, local=answer)
    const connectionData = (await getDoc(channelRef)).data();
    const offerDescription = connectionData?.offer;
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(offerDescription)
    );
    const answerDescription = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    //write answer to db
    await updateDoc(channelRef, { answer });

    setPeerConnection(peerConnection);
  };

  const joinVoice = async (channelId: string, serverId: string) => {
    // disconnect from any existing voice channel

    // add user data to voice channel in db
    const channelRef = doc(db, `servers/${serverId}/channels/${channelId}`);
    const loggedInUser = user?.providerData.find(
      (el) => el.providerId === "google.com"
    );
    const userData = {
      userId: loggedInUser?.uid,
      userName: loggedInUser?.displayName,
      avatar: loggedInUser?.photoURL,
    };
    setVoiceChannel({ id: channelId, server: serverId, user: userData });
    await updateDoc(channelRef, { users: arrayUnion(userData) });

    // create peer connection object
    const newPeerConnection = new RTCPeerConnection(STUNServers);

    // query for offer
    const channelSnapshot = (await getDoc(channelRef)).data();
    // if offer, respondToOffer()  add media tracks
    if (channelSnapshot?.offer) {
      respondToOffer({
        channelId,
        serverId,
        peerConnection: await addMediaFeed(newPeerConnection),
      });
    } else {
      createOffer({
        channelId,
        serverId,
        peerConnection: await addMediaFeed(newPeerConnection),
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
      `servers/${voiceChannel?.server}/channels/${voiceChannel?.id}`
    );
    await updateDoc(channelRef, { users: arrayRemove(voiceChannel?.user) });

    // clean up peer connection entries in database
    const remainingUsers = await getDoc(channelRef);
    if (remainingUsers.data()?.users.length === 0) {
      await updateDoc(channelRef, { offer: deleteField() });
      await updateDoc(channelRef, { answer: deleteField() });
      const offerCandidatesSnapshot = await getDocs(
        collection(
          db,
          `servers/${voiceChannel?.server}/channels/${voiceChannel?.id}/offerCandidates`
        )
      );
      const answerCandidatesSnapshot = await getDocs(
        collection(
          db,
          `servers/${voiceChannel?.server}/channels/${voiceChannel?.id}/answerCandidates`
        )
      );
      offerCandidatesSnapshot.forEach((doc) => deleteDoc(doc.ref));
      answerCandidatesSnapshot.forEach((doc) => deleteDoc(doc.ref));
    }

    // set voice channel state to undefined
    setVoiceChannel(undefined);
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

  return (
    <div
      className="App"
      style={{ height: dimensions.height, width: dimensions.width }}
    >
      {user ? (
        <div style={{ display: "flex" }}>
          {/* <button onClick={removeMediaFeed}>get tracks</button>
          <div className="videos">
            <span>
              <h3>Local Stream</h3>
              <video id="webcamVideo" ref={local} autoPlay playsInline></video>
            </span>
            <span>
              <h3>Remote Stream</h3>
              <video id="remoteVideo" ref={remote} autoPlay playsInline></video>
            </span>
          </div> */}
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
}

export default App;
