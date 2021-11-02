import React from "react";
import { ServerIcon } from "../components/ServerList";

interface ServerType {
  id: string;
  name: string;
  icon: string;
}
interface ServerState {
  id: string;
  name: string;
}

interface Args {
  servers: ServerType[] | undefined;
  server: ServerState | undefined;
  setServer: React.Dispatch<React.SetStateAction<ServerState | undefined>>;
}

const buildServersJSX = ({ servers, server, setServer }: Args) => {
  if (!server || !servers) return { SERVERS: [] };
  return {
    SERVERS: servers.map((el, i) => {
      let selected;
      selected = server?.id === el.id;
      if (!server) selected = i === 0;
      const onClick = () => setServer(el);
      return (
        <ServerIcon
          key={el.id}
          selected={selected}
          onClick={onClick}
          url={el.icon}
        />
      );
    }),
  };
};

export default buildServersJSX;
