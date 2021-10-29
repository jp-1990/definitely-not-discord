import React from "react";

interface Props {
  children: JSX.Element;
}
const UserList: React.FC<Props> = ({ children }) => {
  return (
    <aside
      style={{
        height: window.innerHeight - 49,
        width: "240px",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#2f3136",
        overflow: "hidden",
      }}
    >
      {children}
    </aside>
  );
};

export default UserList;
