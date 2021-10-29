import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const ChatContent: React.FC<Props> = ({ children }) => {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        backgroundColor: "#36393e",
      }}
    >
      {children}
    </div>
  );
};

export default ChatContent;
