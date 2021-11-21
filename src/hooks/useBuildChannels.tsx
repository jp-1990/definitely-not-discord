import React, { useEffect, useState } from "react";
import Channel from "../components/ChannelList/Channel";
import { UserInVoice } from "../components/UserInVoice";
import { getIncomingAudioLevel, getOutgoingAudioLevel } from "../utils";
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
    if (!connections || !connections[0]?.localMediaStream) return;

    // @ts-expect-error webkitAudioContex doesnt exist on window type, but does exist on older browsers
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 32;
    const audioData = new Uint8Array(analyser.frequencyBinCount);
    const source = audioContext.createMediaStreamSource(
      connections[0].localMediaStream
    );
    source.connect(analyser);

    const intervalId = setInterval(() => {
      if (!connections || !connections[0].localMediaStream) return;
      if (connections.length + 1 < usersSpeaking.length) setUsersSpeaking([]);

      const audioLevel = getOutgoingAudioLevel(analyser, audioData);
      const { uid } = currentUser;

      if (audioLevel && audioLevel > 35) {
        handleUserStartSpeaking(uid);
      } else if (usersSpeaking.includes(uid)) {
        handleUserStopSpeaking(uid);
      }
    }, 200);

    return () => {
      audioContext.close();
      clearInterval(intervalId);
    };
  }, [connections, usersSpeaking]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!connections) return;
      if (connections.length + 1 < usersSpeaking.length) setUsersSpeaking([]);
      connections.forEach(({ connection, answerUser, offerUser }) => {
        const audioLevel = getIncomingAudioLevel(connection);
        const uid = answerUser === currentUser.uid ? offerUser : answerUser;
        if (audioLevel && audioLevel > 0.00075) {
          handleUserStartSpeaking(uid);
        } else if (usersSpeaking.includes(uid)) {
          handleUserStopSpeaking(uid);
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
