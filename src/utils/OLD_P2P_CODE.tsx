export {};
//  // =========================================================================================================
//   // -----------
//   // WEBRTC
//   // -----------
//   const [channelDatabaseRef, setChannelDatabaseRef] =
//     useState<DocumentReference<DocumentData>>();
//   const [answerCandidatesRef, setAnswerCandidatesRef] =
//     useState<CollectionReference<DocumentData>>();
//   const [offerCandidatesRef, setOfferCandidatesRef] =
//     useState<CollectionReference<DocumentData>>();

//   const [peerConnection, setPeerConnection] = useState<
//     RTCPeerConnection | undefined
//   >();
//   const local = useRef<HTMLAudioElement>(null);
//   const remote = useRef<HTMLAudioElement>(null);

//   useEffect(() => {
//     if (connections && connections.length > 0) {
//       if (local && local.current)
//         // @ts-expect-error ???
//         local.current.srcObject = connections[0].localStream;

//       if (remote && remote.current)
//         // @ts-expect-error ???
//         remote.current.srcObject = connections[0].remoteStream;

//       console.log({ connections });
//     }
//   }, [connections]);

//   const STUNServers = {
//     iceServers: [
//       {
//         urls: [
//           "stun:stun1.l.google.com:19302",
//           "stun:stun2.l.google.com:19302",
//         ],
//       },
//     ],
//     iceCandidatePoolSize: 10,
//   };

//   // let peerConnection: RTCPeerConnection | undefined = undefined;
//   let localStream: MediaStream | undefined = undefined;
//   let remoteStream: MediaStream | undefined = undefined;

//   useEffect(() => {
//     // Listen for remote answer
//     let unsubVoiceChannel = () => {};
//     if (channelDatabaseRef && peerConnection) {
//       unsubVoiceChannel = onSnapshot(channelDatabaseRef, (doc) => {
//         const data = doc.data();
//         if (!peerConnection?.currentRemoteDescription && data?.answer) {
//           const answerDescription = new RTCSessionDescription(data.answer);
//           peerConnection?.setRemoteDescription(answerDescription);
//         }
//       });
//     }
//     return () => {
//       unsubVoiceChannel();
//     };
//   }, [channelDatabaseRef, peerConnection]);

//   useEffect(() => {
//     // Listen for ICE answers
//     let unsubVoiceChannel = () => {};
//     if (answerCandidatesRef && peerConnection) {
//       unsubVoiceChannel = onSnapshot(answerCandidatesRef, (doc) => {
//         doc.docChanges().forEach((change) => {
//           if (change.type === "added") {
//             const candidate = new RTCIceCandidate(change.doc.data());
//             peerConnection?.addIceCandidate(candidate);
//           }
//         });
//       });
//     }
//     return () => {
//       unsubVoiceChannel();
//     };
//   }, [answerCandidatesRef, peerConnection]);

//   useEffect(() => {
//     // Listen for ICE offers
//     let unsubVoiceChannel = () => {};
//     if (offerCandidatesRef && peerConnection) {
//       unsubVoiceChannel = onSnapshot(offerCandidatesRef, (doc) => {
//         doc.docChanges().forEach((change) => {
//           if (change.type === "added") {
//             const candidate = new RTCIceCandidate(change.doc.data());
//             peerConnection?.addIceCandidate(candidate);
//           }
//         });
//       });
//     }
//     return () => {
//       unsubVoiceChannel();
//     };
//   }, [offerCandidatesRef, peerConnection]);

//   const addMediaFeed = async (peerConnection: RTCPeerConnection) => {
//     if (!peerConnection) return;
//     localStream = await navigator.mediaDevices.getUserMedia({
//       audio: true,
//     });
//     remoteStream = new MediaStream();

//     // Push tracks from local stream to peer connection
//     localStream.getTracks().forEach((track) => {
//       peerConnection.addTrack(track, localStream as MediaStream);
//     });

//     // Pull tracks from remote stream, add to video stream
//     peerConnection.ontrack = (event) => {
//       event.streams[0].getTracks().forEach((track) => {
//         remoteStream && remoteStream.addTrack(track);
//       });
//     };

//     if (local && local.current) local.current.srcObject = localStream;
//     if (remote && remote.current) remote.current.srcObject = remoteStream;

//     return peerConnection;
//   };

//   const removeMediaFeed = async () => {
//     // remove local tracks
//     if (local && local.current && local.current.srcObject) {
//       const srcObject = local.current.srcObject as MediaStream;
//       const tracks = srcObject.getTracks();
//       tracks.forEach((track) => track.stop());
//       local.current.srcObject = null;
//     }

//     // remove remote tracks
//     if (remote && remote.current && remote.current.srcObject) {
//       const srcObject = remote.current.srcObject as MediaStream;
//       const tracks = srcObject.getTracks();
//       tracks.forEach((track) => track.stop());
//       remote.current.srcObject = null;
//     }
//   };

//   const createOffer = async ({
//     channelId,
//     serverId,
//     peerConnection,
//   }: {
//     channelId: string;
//     serverId: string;
//     peerConnection: RTCPeerConnection | undefined;
//   }) => {
//     if (!peerConnection) return;

//     // firestore refs
//     const channelRef = doc(db, `servers/${serverId}/channels/${channelId}`);
//     const offerCandidates = collection(db, channelRef.path, "offerCandidates");
//     const answerCandidates = collection(
//       db,
//       channelRef.path,
//       "answerCandidates"
//     );
//     setChannelDatabaseRef(channelRef);
//     setAnswerCandidatesRef(answerCandidates);

//     // Get candidates for call peer, save to db
//     peerConnection.onicecandidate = async (event) => {
//       if (event.candidate)
//         await addDoc(offerCandidates, event.candidate.toJSON());
//     };

//     // Create offer
//     const offerDescription = await peerConnection.createOffer();
//     await peerConnection.setLocalDescription(offerDescription);
//     const offer = {
//       sdp: offerDescription.sdp,
//       type: offerDescription.type,
//     };
//     await updateDoc(channelRef, { offer });

//     setPeerConnection(peerConnection);
//   };

//   const respondToOffer = async ({
//     channelId,
//     serverId,
//     peerConnection,
//   }: {
//     channelId: string;
//     serverId: string;
//     peerConnection: RTCPeerConnection | undefined;
//   }) => {
//     if (!peerConnection) return;

//     // firestore refs
//     const channelRef = doc(db, `servers/${serverId}/channels/${channelId}`);
//     const offerCandidates = collection(db, channelRef.path, "offerCandidates");
//     const answerCandidates = collection(
//       db,
//       channelRef.path,
//       "answerCandidates"
//     );
//     setOfferCandidatesRef(offerCandidates);

//     // Get candidates for answer peer, save to db
//     peerConnection.onicecandidate = async (event) => {
//       if (event.candidate)
//         await addDoc(answerCandidates, event.candidate.toJSON());
//     };

//     // get connection data and set offer and answer (remote=offer, local=answer)
//     const connectionData = (await getDoc(channelRef)).data();
//     const offerDescription = connectionData?.offer;
//     await peerConnection.setRemoteDescription(
//       new RTCSessionDescription(offerDescription)
//     );
//     const answerDescription = await peerConnection.createAnswer();
//     await peerConnection.setLocalDescription(answerDescription);

//     const answer = {
//       type: answerDescription.type,
//       sdp: answerDescription.sdp,
//     };

//     //write answer to db
//     await updateDoc(channelRef, { answer });

//     setPeerConnection(peerConnection);
//   };

// const joinVoice = async (channelId: string, serverId: string) => {
//   // disconnect from any existing voice channel

//   // add user data to voice channel in db
//   const channelRef = doc(db, `servers/${serverId}/channels/${channelId}`);
//   const loggedInUser = user?.providerData.find(
//     (el) => el.providerId === "google.com"
//   );
//   const userData = {
//     userId: loggedInUser?.uid,
//     userName: loggedInUser?.displayName,
//     avatar: loggedInUser?.photoURL,
//   };
//   setVoiceChannel({ id: channelId, server: serverId, user: userData });
//   await updateDoc(channelRef, { users: arrayUnion(userData) });

//   // create peer connection object
//   const newPeerConnection = new RTCPeerConnection(STUNServers);

//   // query for offer
//   const channelSnapshot = (await getDoc(channelRef)).data();
//   // if offer, respondToOffer()  add media tracks
//   if (channelSnapshot?.offer) {
//     respondToOffer({
//       channelId,
//       serverId,
//       peerConnection: await addMediaFeed(newPeerConnection),
//     });
//   } else {
//     createOffer({
//       channelId,
//       serverId,
//       peerConnection: await addMediaFeed(newPeerConnection),
//     });
//   }
// };

// const leaveVoice = async () => {
//   // close media streams
//   removeMediaFeed();

//   // close peer connection
//   if (peerConnection) peerConnection.close();

//   // remove user details from voice channel in db
//   const channelRef = doc(
//     db,
//     `servers/${voiceChannel?.server}/channels/${voiceChannel?.id}`
//   );
//   await updateDoc(channelRef, { users: arrayRemove(voiceChannel?.user) });

//   // clean up peer connection entries in database
//   const remainingUsers = await getDoc(channelRef);
//   if (remainingUsers.data()?.users.length === 0) {
//     await updateDoc(channelRef, { offer: deleteField() });
//     await updateDoc(channelRef, { answer: deleteField() });
//     const offerCandidatesSnapshot = await getDocs(
//       collection(
//         db,
//         `servers/${voiceChannel?.server}/channels/${voiceChannel?.id}/offerCandidates`
//       )
//     );
//     const answerCandidatesSnapshot = await getDocs(
//       collection(
//         db,
//         `servers/${voiceChannel?.server}/channels/${voiceChannel?.id}/answerCandidates`
//       )
//     );
//     offerCandidatesSnapshot.forEach((doc) => deleteDoc(doc.ref));
//     answerCandidatesSnapshot.forEach((doc) => deleteDoc(doc.ref));
//   }

//   // set voice channel state to undefined
//   setVoiceChannel(undefined);
// };

{
  /* <div className="videos">
<span>
  <audio muted id="audio" ref={local} autoPlay playsInline></audio>
</span>
<span>
  <audio id="remoteAudio" ref={remote} autoPlay playsInline></audio>
</span>
</div> */
}
