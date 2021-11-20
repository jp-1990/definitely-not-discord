import React from "react";
import { Message } from "../components/ChatContent";

import { ServerState, TextChannelState } from "../types";

interface MessageType {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  date: string;
  message: string;
  channel: string;
}

interface Args {
  textChannel: TextChannelState | undefined;
  messages: MessageType[];
}
const sameDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const buildMessagesJSX = ({ textChannel, messages }: Args) => {
  if (!textChannel) return { MESSAGES: [] };
  const channelMessages = messages.filter((e) => e.channel === textChannel.id);
  return {
    MESSAGES: channelMessages.map((el, i) => {
      if (
        el.userId === channelMessages[i - 1]?.userId &&
        sameDay(new Date(+el.date), new Date(+channelMessages[i - 1]?.date))
      )
        return <Message key={el.id} id={el.id} message={el.message} />;

      return (
        <Message
          key={el.id}
          id={el.id}
          message={el.message}
          avatar={el.avatar}
          userName={el.userName}
          date={el.date}
        />
      );
    }),
  };
};
export default buildMessagesJSX;
