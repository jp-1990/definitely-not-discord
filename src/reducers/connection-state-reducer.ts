import { Reducer } from "react";
import { DocumentData, DocumentReference } from "@firebase/firestore";

import { UserData, ConnectionType } from "../types";

interface ConnectionsStateType {
  connections: ConnectionType[] | undefined;
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

const connectionStateReducer: Reducer<
  ConnectionsStateType,
  ConnectionsActionType
> = (state, action) => {
  switch (action.type) {
    case actionTypes.connectInitial: {
      // set channel document ref, self to state
      return {
        ...state,
        channelDocumentRef: action.payload.channelDocumentRef,
      };
    }
    case actionTypes.connectSelf: {
      // set channel document ref, users, connections to state
      return {
        connections: action.payload.connections,
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
export default connectionStateReducer;
