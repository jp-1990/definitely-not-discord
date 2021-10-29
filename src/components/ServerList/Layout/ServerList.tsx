import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const ServerList: React.FC<Props> = ({ children }) => {
  return (
    <div
      style={{
        height: window.innerHeight,
        width: "72px",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#202225",
      }}
    >
      <div
        style={{
          width: "72px",
          marginTop: "12px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            backgroundColor: "#36393f",
            borderRadius: "100%",
            height: "48px",
            width: "48px",
            marginBottom: "8px",
          }}
        />
        <div
          style={{
            height: "2px",
            width: "32px",
            backgroundColor: "hsla(0,0%,100%,0.06)",
            borderRadius: "2px",
            marginBottom: "8px",
          }}
        />
      </div>

      {children}
    </div>
  );
};

export default ServerList;
