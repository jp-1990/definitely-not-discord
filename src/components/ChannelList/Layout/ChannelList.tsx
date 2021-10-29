import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const ChannelList: React.FC<Props> = ({ children }) => {
  return (
    <div
      style={{
        height: window.innerHeight,
        width: "240px",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#2f3136",
      }}
    >
      {children}
    </div>
  );
};

export default ChannelList;
