import React, { useState, useEffect } from "react";

import "./App.css";

import ServerList from "./components/ServerList";
import ChannelList from "./components/ChannelList";
import ChatWindow from "./components/ChatContent";

function App() {
  const [server, setServer] = useState<{ id: string; name: string }>();
  const [channel, setChannel] = useState<{ id: string; name: string }>();

  useEffect(() => {
    setChannel(undefined);
  }, [server]);

  return (
    <div className="App" style={{ fontFamily: "Open Sans" }}>
      <div style={{ display: "flex" }}>
        <ServerList server={server} setServer={setServer} />
        <ChannelList
          server={server}
          channel={channel}
          setChannel={setChannel}
        />
        <ChatWindow />
      </div>
    </div>
  );
}

export default App;
