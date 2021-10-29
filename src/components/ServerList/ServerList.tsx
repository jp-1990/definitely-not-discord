import React, { Dispatch, SetStateAction } from "react";
import { default as Layout } from "./Layout";
import ServerIcon from "./ServerIcon";

interface Props {
  server?: { id: string; name: string };
  setServer: Dispatch<SetStateAction<{ id: string; name: string } | undefined>>;
}

const ServerList: React.FC<Props> = ({ server, setServer }) => {
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
  const servers = temp.map((el, i) => {
    let selected;
    if (!server) {
      selected = i === 0;
    } else {
      selected = server.id === el.id;
    }
    const onClick = () => setServer(el);

    return <ServerIcon selected={selected} onClick={onClick} />;
  });

  return <Layout>{servers}</Layout>;
};

export default ServerList;
