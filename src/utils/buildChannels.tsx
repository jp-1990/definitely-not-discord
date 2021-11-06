import React from "react";
import Channel from "../components/ChannelList/Channel";
import { UserInVoice, OnlineUserType } from "../components/UserInVoice";

enum ChannelTypeEnum {
  VOICE = "VOICE",
  TEXT = "TEXT",
}
interface ChannelType {
  id: string;
  name: string;
  type: ChannelTypeEnum;
  server: string;
  users?: OnlineUserType[];
}
interface ServerState {
  id: string;
  name: string;
}
interface TextChannelState extends ServerState {
  server: string;
}

interface Args {
  channels: ChannelType[];
  server: ServerState | undefined;
  textChannel: TextChannelState | undefined;
  setTextChannel: React.Dispatch<
    React.SetStateAction<TextChannelState | undefined>
  >;
  joinVoice: (channelId: string, serverId: string) => void;
}

const buildChannelsJSX = ({
  channels,
  server,
  textChannel,
  setTextChannel,
  joinVoice,
}: Args) => {
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
                <UserInVoice key={Math.random()} user={el} />
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
export default buildChannelsJSX;
