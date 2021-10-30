import React, { Dispatch, SetStateAction } from "react";
import { default as Layout } from "./Layout/ChannelList";
import Header from "./Header";
import ChannelGroup from "./ChannelGroup";
import Channel from "./Channel";
import Footer from "./Footer";

enum ChannelTypeEnum {
  VOICE = "VOICE",
  TEXT = "TEXT",
}

export interface ChannelType {
  id: string;
  name: string;
  type: ChannelTypeEnum;
  server: string;
}

interface Props {
  channelList: Record<string, ChannelType[]>;
  server: { id: string; name: string } | undefined;
  channel: { id: string; name: string; server: string } | undefined;
  setChannel: Dispatch<
    SetStateAction<{ id: string; name: string; server: string } | undefined>
  >;
  user: any;
  signOut: () => void;
}

const ChannelList: React.FC<Props> = ({
  channelList,
  server,
  channel,
  setChannel,
  user,
  signOut,
}) => {
  const channels = (() => {
    if (!server) return;
    if (!channelList[server.id]) return;
    if (!channel || channel.server !== server.id)
      setChannel(channelList[server.id][0]);

    return channelList[server.id].map((el) => {
      const selected = channel?.id === el.id;

      const onClick = () => setChannel(el);

      return (
        <Channel
          key={el.id}
          selected={selected}
          title={el.name}
          onClick={onClick}
        />
      );
    });
  })();

  return (
    <Layout>
      <Header>
        <span>{server?.name}</span>
      </Header>
      <ChannelGroup title="TEXT CHANNELS" expanded>
        {channels}
      </ChannelGroup>
      {/* <ChannelGroup title="VOICE CHANNELS" expanded>
        <Channel title="General" />
      </ChannelGroup> */}
      <div style={{ flexGrow: 1 }} />
      <Footer signOut={signOut} user={user} />
    </Layout>
  );
};

export default ChannelList;
