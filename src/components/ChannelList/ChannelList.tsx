import React, { Dispatch, SetStateAction } from "react";
import { default as Layout } from "./Layout/ChannelList";
import Header from "./Header";
import ChannelGroup from "./ChannelGroup";
import Channel from "./Channel";
import Footer from "./Footer";

interface Props {
  server: { id: string; name: string } | undefined;
  channel: { id: string; name: string } | undefined;
  setChannel: Dispatch<
    SetStateAction<{ id: string; name: string } | undefined>
  >;
}

const ChannelList: React.FC<Props> = ({ server, channel, setChannel }) => {
  const temp = [
    [
      { name: "general", id: "0" },
      { name: "help-pls", id: "1" },
      { name: "news-n-links-n-that", id: "2" },
    ],
    [
      { name: "General", id: "0" },
      { name: "Games", id: "1" },
      { name: "AFK", id: "2" },
    ],
    [
      { name: "announcements", id: "0" },
      { name: "job-adverts", id: "1" },
      { name: "rage-room", id: "2" },
    ],
    [
      { name: "general", id: "0" },
      { name: "lfg", id: "1" },
      { name: "news", id: "2" },
    ],
    [
      { name: "definitely", id: "0" },
      { name: "not", id: "1" },
      { name: "discord", id: "2" },
    ],
  ];
  // use the server id to get channels from db
  // map result to return channel components

  const channels = temp[Number(server?.id) || 0].map((el, i) => {
    let selected;
    if (!channel) {
      selected = i === 0;
    } else {
      selected = channel.id === el.id;
    }
    const onClick = () => setChannel(el);

    return <Channel selected={selected} title={el.name} onClick={onClick} />;
  });

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
      <Footer />
    </Layout>
  );
};

export default ChannelList;
