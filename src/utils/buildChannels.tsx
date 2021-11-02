import React from "react";
import Channel from "../components/ChannelList/Channel";

enum ChannelTypeEnum {
  VOICE = "VOICE",
  TEXT = "TEXT",
}
interface ChannelType {
  id: string;
  name: string;
  type: ChannelTypeEnum;
  server: string;
}
interface ServerState {
  id: string;
  name: string;
}
interface ChannelState extends ServerState {
  server: string;
}

interface Args {
  channels: ChannelType[];
  server: ServerState | undefined;
  channel: ChannelState | undefined;
  setChannel: React.Dispatch<React.SetStateAction<ChannelState | undefined>>;
}

const buildChannelsJSX = ({ channels, server, channel, setChannel }: Args) => {
  if (!server || !channel) return { TEXT: [], VOICE: [] };
  return channels.reduce(
    (prev, cur) => {
      if (server.id === cur.server) {
        const selected = channel.id === cur.id;
        const onClick = () => setChannel(cur);
        prev[cur.type].push(
          <Channel
            key={cur.id}
            selected={selected}
            title={cur.name}
            onClick={onClick}
          />
        );
        return prev;
      }
      return prev;
    },
    { TEXT: [], VOICE: [] } as { TEXT: JSX.Element[]; VOICE: JSX.Element[] }
  );
};
export default buildChannelsJSX;
