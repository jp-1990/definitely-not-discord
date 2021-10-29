import React from "react";
import { IoMdMic, IoMdSettings } from "react-icons/io";
import { BsHeadphones } from "react-icons/bs";

const Footer = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: "52px",
        backgroundColor: "#292b2f",
        padding: "0px 8px 0px 8px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            marginRight: "8px",
            borderRadius: "100%",
            backgroundColor: "#eee",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "start",
            alignItems: "start",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              height: "18px",
              color: "#fff",
              fontWeight: 500,
              marginBottom: "-1px",
            }}
          >
            jp
          </span>
          <span style={{ fontSize: "11px", height: "13px", color: "#b9bbbe" }}>
            #9359
          </span>
        </div>
      </div>
      <div style={{ display: "flex", width: "96px", height: "32px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "5px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <IoMdMic fill="#b9bbbe" size="20px" />
        </div>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "5px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <BsHeadphones fill="#b9bbbe" size="22px" />
        </div>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "5px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <IoMdSettings fill="#b9bbbe" size="22px" />
        </div>
      </div>
    </div>
  );
};

export default Footer;
