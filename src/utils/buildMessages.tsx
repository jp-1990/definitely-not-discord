import React from "react";
import { Message } from "../components/ChatContent";

interface ServerState {
  id: string;
  name: string;
}
interface ChannelState extends ServerState {
  server: string;
}
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
  channel: ChannelState | undefined;
  messages: MessageType[];
}

const buildMessagesJSX = ({ channel, messages }: Args) => {
  if (!channel) return { MESSAGES: [] };
  const channelMessages = messages.filter((e) => e.channel === channel.id);
  return {
    MESSAGES: channelMessages.map((el, i) => {
      if (el.userId === channelMessages[i - 1]?.userId)
        return <Message id={el.id} message={el.message} />;
      return (
        <Message
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
