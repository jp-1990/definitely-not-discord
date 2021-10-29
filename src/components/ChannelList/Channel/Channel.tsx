import React from "react";

interface Props {
  selected?: boolean;
  title: string;
  onClick: () => void;
}

const Channel: React.FC<Props> = ({ selected, title, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        height: "32px",
        width: "208px",
        marginLeft: "8px",
        padding: "1px 8px 1px 8px",
        backgroundColor: selected ? "rgb(79 84 92 / 32%)" : "transparent",
        borderRadius: "5px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <span style={{ marginRight: "8px", fontSize: "22px", color: "#72767d" }}>
        #
      </span>
      <span
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: selected ? "#fff" : "#72767d",
        }}
      >
        {title}
      </span>
    </button>
  );
};

export default Channel;
