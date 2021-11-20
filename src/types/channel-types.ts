import { DocumentData, DocumentReference } from "firebase/firestore";

export enum ChannelTypeEnum {
  VOICE = "VOICE",
  TEXT = "TEXT",
}

export interface ChannelType<User> {
  id: string;
  name: string;
  type: ChannelTypeEnum;
  server: string;
  users?: User[];
}

export interface VoiceChannelState<User> {
  id: string;
  server: string;
  user: User;
  channelDocumentRef: DocumentReference<DocumentData>;
}

export interface TextChannelState {
  id: string;
  name: string;
  server: string;
}
