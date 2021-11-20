import React, { useEffect, useState } from "react";
import Channel from "../components/ChannelList/Channel";
import { UserInVoice } from "../components/UserInVoice";
import { getIncomingAudioLevel } from "../utils";
import {
  ServerState,
  TextChannelState,
  ChannelType,
  ConnectionType,
  UserData,
} from "../types";

interface Args {
  channels: ChannelType<UserData>[];
  server: ServerState | undefined;
  textChannel: TextChannelState | undefined;
  setTextChannel: React.Dispatch<
    React.SetStateAction<TextChannelState | undefined>
  >;
  joinVoice: (channelId: string, serverId: string) => void;
  connections: ConnectionType[] | undefined;
  currentUser: UserData;
}

const useBuildChannelsJSX = ({
  channels,
  server,
  textChannel,
  setTextChannel,
  joinVoice,
  connections,
  currentUser,
}: Args) => {
  const [usersSpeaking, setUsersSpeaking] = useState<string[]>([]);

  const handleUserStartSpeaking = (uid: string) => {
    setUsersSpeaking((prev) => [...new Set([...prev, uid])]);
  };
  const handleUserStopSpeaking = (uid: string) => {
    setUsersSpeaking((prev) => prev.filter((id) => id !== uid));
  };

  useEffect(() => {
    let intervalId: NodeJS.Timer;

    intervalId = setInterval(() => {
      if (!connections) return;
      if (connections.length < usersSpeaking.length) setUsersSpeaking([]);
      connections.forEach(({ connection, answerUser, offerUser }) => {
        const audioLevel = getIncomingAudioLevel(connection);
        const uid = answerUser === currentUser.uid ? offerUser : answerUser;
        if (typeof audioLevel === "number" && audioLevel > 0.0007) {
          handleUserStartSpeaking(uid);
          console.log("afterStart", usersSpeaking);
        } else if (usersSpeaking.includes(uid)) {
          handleUserStopSpeaking(uid);
          console.log("afterStop", usersSpeaking);
        }
      });
    }, 200);

    return () => {
      clearInterval(intervalId);
    };
  }, [connections, usersSpeaking]);

  if (!server || !textChannel) return { TEXT: [], VOICE: [] };

  return channels.reduce(
    (prev, cur) => {
      if (server.id === cur.server) {
        const selected = textChannel.id === cur.id;
        const onTextClick = () => setTextChannel(cur);
        const onVoiceClick = () => joinVoice(cur.id, server.id);
        prev[cur.type].push(
          <Channel
            key={cur.id}
            selected={selected}
            title={cur.name}
            type={cur.type}
            onClick={cur.type === "TEXT" ? onTextClick : onVoiceClick}
          >
            {cur.users &&
              cur.type === "VOICE" &&
              cur.users.map((el) => (
                <UserInVoice
                  key={Math.random()}
                  user={el}
                  speaking={usersSpeaking.includes(el.uid)}
                />
              ))}
          </Channel>
        );
        return prev;
      }
      return prev;
    },
    { TEXT: [], VOICE: [] } as { TEXT: JSX.Element[]; VOICE: JSX.Element[] }
  );
};
export default useBuildChannelsJSX;
