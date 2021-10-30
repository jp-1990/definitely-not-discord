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
  channel: { id: string; name: string } | undefined;
  setChannel: Dispatch<
    SetStateAction<{ id: string; name: string; server: string } | undefined>
  >;
}

const ChannelList: React.FC<Props> = ({
  channelList,
  server,
  channel,
  setChannel,
}) => {
  // const temp = [
  //   [
  //     { name: "general", id: "0", server: "0" },
  //     { name: "help-pls", id: "1", server: "0" },
  //     { name: "news-n-links-n-that", id: "2", server: "0" },
  //   ],
  //   [
  //     { name: "General", id: "0", server: "1" },
  //     { name: "Games", id: "1", server: "1" },
  //     { name: "AFK", id: "2", server: "1" },
  //   ],
  //   [
  //     { name: "announcements", id: "0", server: "2" },
  //     { name: "job-adverts", id: "1", server: "2" },
  //     { name: "rage-room", id: "2", server: "2" },
  //   ],
  //   [
  //     { name: "general", id: "0", server: "3" },
  //     { name: "lfg", id: "1", server: "3" },
  //     { name: "news", id: "2", server: "3" },
  //   ],
  //   [
  //     { name: "definitely", id: "0", server: "4" },
  //     { name: "not", id: "1", server: "4" },
  //     { name: "discord", id: "2", server: "4" },
  //   ],
  // ];
  // use the server id to get channels from db
  // map result to return channel components

  // const channels = temp[Number(server?.id) || 0].map((el, i) => {
  //   let selected;
  //   if (!channel) {
  //     selected = i === 0;
  //     setChannel(temp[Number(server?.id) || 0][0]);
  //   } else {
  //     selected = channel.id === el.id;
  //   }

  //   const onClick = () => setChannel(el);

  //   return (
  //     <Channel key={i} selected={selected} title={el.name} onClick={onClick} />
  //   );
  // });

  const channels = (() => {
    if (!server) return;
    if (!channelList[server.id]) return;
    if (!channel) setChannel(channelList[server.id][0]);

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
      <Footer />
    </Layout>
  );
};

export default ChannelList;
