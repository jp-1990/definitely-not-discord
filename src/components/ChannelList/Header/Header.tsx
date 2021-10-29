import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
}
const Header: React.FC<Props> = ({ children }) => {
  return (
    <div
      style={{
        backgroundColor: "#2f3136",
        height: "48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #18191c6b",
        padding: "0px 16px 0px 16px",
        fontWeight: 700,
        fontSize: "14px",
        color: "#fff",
      }}
    >
      {children}
    </div>
  );
};

export default Header;
