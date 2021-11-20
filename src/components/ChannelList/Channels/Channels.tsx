import React from "react";
import { useBuildChannels } from "../../../hooks";
import ChannelGroup from "../ChannelGroup";

import {
  ServerState,
  TextChannelState,
  ChannelType,
  UserData,
  ConnectionType,
} from "../../../types";

interface Props {
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

const Channels: React.FC<Props> = ({
  channels,
  server,
  textChannel,
  setTextChannel,
  joinVoice,
  currentUser,
  connections,
}) => {
  const { TEXT, VOICE } = useBuildChannels({
    channels,
    server,
    textChannel,
    setTextChannel,
    joinVoice,
    currentUser,
    connections,
  });

  return (
    <>
      {!!TEXT.length && (
        <ChannelGroup title="TEXT CHANNELS" expanded>
          {TEXT}
        </ChannelGroup>
      )}
      {!!VOICE.length && (
        <ChannelGroup title="VOICE CHANNELS" expanded>
          {VOICE}
        </ChannelGroup>
      )}
    </>
  );
};

export default Channels;
