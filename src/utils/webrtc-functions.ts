import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  DocumentData,
  Firestore,
} from "@firebase/firestore";
import { updateDoc } from "firebase/firestore";

//====================================================================
const STUNServers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

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
 * @param type 'offer' || 'answer'
 *
 * @description adds a listener callback to the peer connection, which updates the specified doc when the onicecandidate event fires
 */
export const setIceCandidatesToDatabase = async (
  connection: RTCPeerConnection,
  db: Firestore,
  path: string,
  type: "offer" | "answer"
) => {
  try {
    connection.onicecandidate = async (event) => {
      if (event.candidate) {
        await updateDoc(doc(db, path), {
          [`${type}Candidates`]: arrayUnion(event.candidate.toJSON()),
        });
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
 * @param connection
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
 * @param data Document data from listening server. Should contain { answer, answerCandidates, answerUser }
 * @param connection Existing RTC peer connection to set answer details on
 *
 * @description Expects answer data, which is then set as the remote description on the provided peer connection. If the data input does not contain the properties; answer, answerCandidates and answerUser, the function will immediately return without modifying the provided peer connection object.
 */
export const setExistingAnswerToRemoteDescription = async (
  data: DocumentData,
  connection: RTCPeerConnection
) => {
  if (!data.answer || !data.answerCandidates) return;
  try {
    const answerDescription = new RTCSessionDescription(data.answer);
    const answerCandidates = data.answerCandidates;

    await connection.setRemoteDescription(answerDescription);
    answerCandidates.forEach((el: RTCIceCandidateInit | undefined) => {
      const candidate = new RTCIceCandidate(el);
      connection.addIceCandidate(candidate);
    });
  } catch (err) {
    console.error(
      `failed to set answer as remote description (setExistingAnswerToRemoteDescription): ${err}`
    );
  }
};

/**
 *
 * @param data Document data from listening server. Should contain { offer, offerCandidates }
 * @param connection Existing RTC peer connection to set offer details on
 *
 * @description Expects offer data, which is then set as the remote description on the provided peer connection. If the data input does not contain the properties; offer and offerCandidates, the function will immediately return without modifying the provided peer connection object.
 */
export const setExistingOfferToRemoteDescription = async (
  data: DocumentData,
  connection: RTCPeerConnection
) => {
  if (!data.offer || !data.offerCandidates) return;
  try {
    const offerDescription = new RTCSessionDescription(data.offer);
    const offerCandidates = data.offerCandidates;

    await connection.setRemoteDescription(offerDescription);
    offerCandidates.forEach((el: RTCIceCandidateInit | undefined) => {
      const candidate = new RTCIceCandidate(el);
      connection.addIceCandidate(candidate);
    });
  } catch (err) {
    console.error(
      `failed to set offer as remote description (setExistingOfferToRemoteDescription): ${err}`
    );
  }
};

interface OfferPeerConnectionType {
  db: Firestore;
  channelPath: string;
  offerUser: string;
  answerUser: string;
}
/**
 *
 * @param object {@link OfferPeerConnectionType}
 * @returns Object {connection: RTCPeerConnection, connectionRef: firestore doc ref, localStream: MediaStream, remoteStream: MediaStream}
 *
 * @description Creates local and remote media streams and configures a peer connection with the offer as the local description. It also configures the connection document on the listening server with offer ice candidates, an offer, the offer user's id, and the id of the user expected to answer this offer.
 */
export const offerPeerConnection = async ({
  db,
  channelPath,
  offerUser,
  answerUser,
}: OfferPeerConnectionType) => {
  let localStream: MediaStream;
  let remoteStream: MediaStream;

  try {
    // create peer connection for user where localDesc = offer
    const connection = new RTCPeerConnection(STUNServers);

    // create media streams
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    remoteStream = new MediaStream();

    addLocalTracksToConnection(connection, localStream);
    getRemoteTracksFromConnection(connection, remoteStream);

    // create connection doc
    const connectionRef = await addDoc(
      collection(db, channelPath, "connections"),
      {}
    );

    // create ice offer candidates for user and add to connection doc
    await setIceCandidatesToDatabase(
      connection,
      db,
      `${channelPath}/connections/${connectionRef.id}`,
      "offer"
    );

    const offer = await createOfferAndSetToLocalDescription(connection);

    // update connection doc for user where offerUser = userId and answer user = el.id
    await updateDoc(doc(db, channelPath, `connections/${connectionRef.id}`), {
      offerUser,
      answerUser,
      offer,
    });

    return {
      connection,
      connectionRef,
      localStream,
      remoteStream,
    };
  } catch (err) {
    console.error(
      `failed to configure new offer peer connection (offerPeerConnection): ${err}`
    );
    return {
      connection: undefined,
      connectionRef: undefined,
      localStream: undefined,
      remoteStream: undefined,
    };
  }
};

interface FullPeerConnectionType {
  db: Firestore;
  connectionPath: string;
  data: DocumentData;
}
/**
 *
 * @param object {@link FullPeerConnectionType}
 * @returns Object {connection: RTCPeerConnection, localStream: MediaStream, remoteStream: MediaStream}
 *
 * @description Creates local and remote media streams and configures a peer connection with the existing offer as the remote description, and created answer as the local description. It also configures the connection document on the listening server with answer ice candidates, and an answer.
 */
export const fullPeerConnection = async ({
  db,
  connectionPath,
  data,
}: FullPeerConnectionType) => {
  let localStream: MediaStream;
  let remoteStream: MediaStream;

  try {
    const connection = new RTCPeerConnection(STUNServers);

    // create media streams
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    remoteStream = new MediaStream();

    addLocalTracksToConnection(connection, localStream);
    getRemoteTracksFromConnection(connection, remoteStream);

    // create ice answer candidates for user and add to connection doc
    await setIceCandidatesToDatabase(connection, db, connectionPath, "answer");

    await setExistingOfferToRemoteDescription(data, connection);
    const answer = await createAnswerAndSetToLocalDescription(connection);

    await updateDoc(doc(db, connectionPath), { answer });

    return {
      connection,
      localStream,
      remoteStream,
    };
  } catch (err) {
    console.error(
      `failed to configure new full peer connection (fullPeerConnection): ${err}`
    );
    return {
      connection: undefined,
      localStream: undefined,
      remoteStream: undefined,
    };
  }
};

//====================================================================

/**
 *
 * @param connection RTC peer connection to get audio level from
 * @returns Number | 'no audio' string | undefined
 *
 * @description Uses getSynchronizationSources on the provided peer connection to determine the current audio level. It is intended that this function be called repeatedly to determine if a user is speaking.
 */
export const getAudioLevel = (connection: RTCPeerConnection) => {
  try {
    const receiver = connection
      .getReceivers()
      .find((e) => e.track.kind === "audio");
    if (receiver && receiver.getSynchronizationSources) {
      const source = receiver.getSynchronizationSources()[0];
      if (source) return source.audioLevel;
      return "no audio level received";
    }
  } catch (err) {
    console.error(`failed to get audio level (getAudioLevel): ${err}`);
  }
};
