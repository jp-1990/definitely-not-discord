import {
  CollectionReference,
  DocumentData,
  DocumentReference,
} from "firebase/firestore";

export interface ConnectionType {
  offerUser: string;
  answerUser: string;
  connection: RTCPeerConnection;
  connectionDocumentRef: DocumentReference<DocumentData>;
  offerCandidatesCollectionRef: CollectionReference<DocumentData>;
  answerCandidatesCollectionRef: CollectionReference<DocumentData>;
  localMediaStream: MediaStream | undefined;
  remoteMediaStream: MediaStream | undefined;
}
