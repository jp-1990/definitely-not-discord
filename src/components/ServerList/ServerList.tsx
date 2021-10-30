import React, { Dispatch, SetStateAction } from "react";
import { default as Layout } from "./Layout";
import ServerIcon from "./ServerIcon";

export interface ServerType {
  id: string;
  name: string;
  icon: string;
}

interface Props {
  serverList: ServerType[];
  server?: Omit<ServerType, "icon">;
  setServer: Dispatch<SetStateAction<Omit<ServerType, "icon"> | undefined>>;
  icon: string;
}

const ServerList: React.FC<Props> = ({
  serverList,
  server,
  setServer,
  icon,
}) => {
  const temp = [
    { name: "happy codey friends", id: "0" },
    { name: "Mumble 2.0", id: "1" },
    { name: "nor(DEV)", id: "2" },
    { name: "Valorant", id: "3" },
    { name: "!Discord", id: "4" },
  ];
  // get list of servers
  // map, return components
  // selected = id === server || [0]
  const servers = serverList.map((el, i) => {
    let selected;
    if (!server) {
      selected = i === 0;
    } else {
      selected = server.id === el.id;
    }
    const onClick = () => setServer(el);

    return (
      <ServerIcon
        key={el.id}
        selected={selected}
        onClick={onClick}
        url={el.icon}
      />
    );
  });

  return <Layout icon={icon}>{servers}</Layout>;
};

export default ServerList;
