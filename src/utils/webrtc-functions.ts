import { addDoc, CollectionReference, DocumentData } from "@firebase/firestore";
import { DocumentReference, getDoc, updateDoc } from "firebase/firestore";

/**
 *
 * @param connection RTC Peer Connection object
 * @param localStream Local Media Stream object
 *
 * @description loops tracks on local stream and adds them to the peer connection
 */
export const addLocalTracksToConnection = (
  connection: RTCPeerConnection,
  localStream: MediaStream
) => {
  try {
    localStream.getTracks().forEach((track) => {
      connection.addTrack(track, localStream);
    });
  } catch (err) {
    console.error(
      `failed to add local tracks to connection (addLocalTracksToConnection): ${err}`
    );
  }
};

/**
 *
 * @param connection RTC Peer Connection object
 * @param remoteStream Remote Media Stream object
 *
 * @description adds a listener callback to the peer connection ontrack event, which adds tracks to the remote stream when they are added to the connection
 */
export const getRemoteTracksFromConnection = (
  connection: RTCPeerConnection,
  remoteStream: MediaStream
) => {
  try {
    connection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };
  } catch (err) {
    console.error(
      `error in connection.ontrack callback (getRemoteTracksFromConnection): ${err}`
    );
  }
};

/**
 *
 * @param connection RTC Peer Connection object
 * @param db Firestore instance
 * @param path The path to the document to update (e.g. servers/{id}/channels/{id}/connections/{id})
 *
 * @description adds a listener callback to the peer connection, which updates the specified doc when the onicecandidate event fires
 */
export const setIceCandidatesToDatabase = async (
  connection: RTCPeerConnection,
  collectionRef: CollectionReference
) => {
  try {
    connection.onicecandidate = async (event) => {
      if (event.candidate) {
        await addDoc(collectionRef, event.candidate.toJSON());
      }
    };
  } catch (err) {
    console.error(
      `error in connection.onicecandidate callback (setIceCandidatesToDatabase): ${err}`
    );
  }
};

/**
 *
 * @param connection RTC Peer Connection object
 * @param data { candidate, sdpMLineIndex, sdpMid } retrieved from listening server
 *
 * @description adds an ice candidate to a provided peer connection
 */
export const setIceCandidateToConnection = (
  connection: RTCPeerConnection,
  data: DocumentData | undefined
) => {
  if (!data) return;
  try {
    const candidate = new RTCIceCandidate(data);
    connection.addIceCandidate(candidate);
  } catch (err) {
    console.error(
      `failed to set ice candidate to connection (setIceCandidateToConnection): ${err}`
    );
  }
};

/**
 *
 * @param connection RTC Peer Connection object
 * @returns Object {sdp,type} constructed from offer description to set as offer in the database
 *
 * @description Creates a new offer and sets it as the local description on the provided peer connection, and returns an object to set as an offer on the listening server.
 */
export const createOfferAndSetToLocalDescription = async (
  connection: RTCPeerConnection
) => {
  try {
    const offerDescription = await connection.createOffer();
    await connection.setLocalDescription(offerDescription);
    return {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };
  } catch (err) {
    console.error(
      `failed to set offer as local description (createOfferAndSetToLocalDescription): ${err}`
    );
  }
};

/**
 *
 * @param connection
 * @returns Object {sdp,type} constructed from answer description to set as answer in the database
 *
 * @description Creates a new answer and sets it as the local description on the provided peer connection, and returns an object to set as an answer on the listening server.
 */
export const createAnswerAndSetToLocalDescription = async (
  connection: RTCPeerConnection
) => {
  try {
    const answerDescription = await connection.createAnswer();
    await connection.setLocalDescription(answerDescription);
    return {
      sdp: answerDescription.sdp,
      type: answerDescription.type,
    };
  } catch (err) {
    console.error(
      `failed to set answer as local description (createAnswerAndSetToLocalDescription): ${err}`
    );
  }
};

/**
 *
 * @param connection Existing RTC peer connection to set answer details on
 * @param data Document data from listening server. Should contain { answer }
 *
 * @description Expects answer data, which is then set as the remote description on the provided peer connection. If the data input does not contain the properties; answer, the function will immediately return without modifying the provided peer connection object.
 */
export const setExistingAnswerToRemoteDescription = async (
  connection: RTCPeerConnection,
  data: DocumentData | undefined
) => {
  if (!data?.answer) return;
  try {
    const answerDescription = new RTCSessionDescription(data.answer);
    await connection.setRemoteDescription(answerDescription);
  } catch (err) {
    console.error(
      `failed to set answer as remote description (setExistingAnswerToRemoteDescription): ${err}`
    );
  }
};

/**
 *
 * @param connection Existing RTC peer connection to set offer details on
 * @param data Document data from listening server. Should contain { offer }
 *
 * @description Expects offer data, which is then set as the remote description on the provided peer connection. If the data input does not contain the properties; offer, the function will immediately return without modifying the provided peer connection object.
 */
export const setExistingOfferToRemoteDescription = async (
  connection: RTCPeerConnection,
  data: DocumentData | undefined
) => {
  if (!data?.offer) return;
  try {
    const offerDescription = new RTCSessionDescription(data.offer);
    await connection.setRemoteDescription(offerDescription);
  } catch (err) {
    console.error(
      `failed to set offer as remote description (setExistingOfferToRemoteDescription): ${err}`
    );
  }
};

/**
 *
 * @param connection RTC peer connection
 * @param connectionRef document reference for the target connection doc on the listening server
 * @param offerCandidatesRef collection reference for the target offer candidates collection on the listening server
 * @returns {object} { connection: RTCPeerConnection, localStream: MediaStream, remoteStream: MediaStream }
 *
 * @description Creates a local and remote media stream, adds the local tracks to the connection and sets a callback to set the remote tracks to the remoteStream when they become available. A callback is applied to the connection to set ice candidates for the offer to the listening server when they become available. An offer is then created for the connection, and set the the provided connectionRef on the listening server. The function returns the original peer connection with the modifications applied, plus the local and remote media streams.
 */
export const createOffer = async (
  connection: RTCPeerConnection,
  connectionRef: DocumentReference<DocumentData>,
  offerCandidatesRef: CollectionReference<DocumentData>
) => {
  let localStream: MediaStream | undefined = undefined;
  let remoteStream: MediaStream | undefined = undefined;
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    remoteStream = new MediaStream();

    addLocalTracksToConnection(connection, localStream);
    getRemoteTracksFromConnection(connection, remoteStream);

    setIceCandidatesToDatabase(connection, offerCandidatesRef);
    const offer = await createOfferAndSetToLocalDescription(connection);
    await updateDoc(connectionRef, { offer });
  } catch (err) {
    console.error(`failed to create offer (createOffer): ${err}`);
  }
  return {
    connection,
    localStream,
    remoteStream,
  };
};

/**
 *
 * @param connection RTC peer connection
 * @param connectionRef document reference for the target connection doc on the listening server
 * @param offerCandidatesRef collection reference for the target answer candidates collection on the listening server
 * @returns {object} { connection: RTCPeerConnection, localStream: MediaStream, remoteStream: MediaStream }
 *
 * @description Creates a local and remote media stream, adds the local tracks to the connection and sets a callback to set the remote tracks to the remoteStream when they become available. A callback is applied to the connection to set ice candidates for the answer to the listening server when they become available. The existing offer is then fetched from the listening server and set as the remote description. An answer is then created for the connection, and set the the provided connectionRef on the listening server. The function returns the original peer connection with the modifications applied, plus the local and remote media streams.
 */
export const answerOffer = async (
  connection: RTCPeerConnection,
  connectionRef: DocumentReference<DocumentData>,
  answerCandidatesRef: CollectionReference<DocumentData>
) => {
  let localStream: MediaStream | undefined = undefined;
  let remoteStream: MediaStream | undefined = undefined;
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    remoteStream = new MediaStream();

    addLocalTracksToConnection(connection, localStream);
    getRemoteTracksFromConnection(connection, remoteStream);

    setIceCandidatesToDatabase(connection, answerCandidatesRef);
    const connectionData = (await getDoc(connectionRef)).data();
    await setExistingOfferToRemoteDescription(connection, connectionData);
    const answer = await createAnswerAndSetToLocalDescription(connection);
    await updateDoc(connectionRef, { answer });
  } catch (err) {
    console.error(`failed to create answer to offer (answerOffer): ${err}`);
  }
  return {
    connection,
    localStream,
    remoteStream,
  };
};
