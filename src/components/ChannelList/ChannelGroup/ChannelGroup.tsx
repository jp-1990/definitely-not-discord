import React, { ReactNode } from "react";

interface Props {
  expanded: boolean;
  title: string;
  children: ReactNode;
}

const ChannelGroup: React.FC<Props> = ({ expanded, title, children }) => {
  return (
    <div
      style={{
        width: "100%",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", height: "40px" }}>
        <div style={{ width: "16px", height: "24px" }} />
        <span
          style={{
            color: "#8e9297",
            fontSize: "12px",
            lineHeight: "18px",
            letterSpacing: ".25px",
            fontWeight: 600,
            marginTop: "18px",
          }}
        >
          {title}
        </span>
      </div>
      {expanded && children}
    </div>
  );
};

export default ChannelGroup;
