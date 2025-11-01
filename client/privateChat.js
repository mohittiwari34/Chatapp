import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { useState } from "react";
import { Link,useParams } from "react-router";
import socket from "./socket";

export default function Pribate(){
    const {id}=useParams();
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    useEffect(()=>{
        socket.on("recieve",(data)=>{
      setMessages((prev)=>[
    ...prev,
    { user: `(Private) ${data.user}`, text: data.text, timer: data.timer }
  ]);
    })

    },[]);
    const sendMessage = () => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    
      socket.emit("privateChat",{to:id,msg:message,timer:time});
      setMessages((prev) => [...prev, { user: "You", text: message, timer: time }]);
    setMessage("");
  };
  return(
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Private Chat with {id}</h2>
      <div style={{ border: "1px solid gray", height: "60vh", overflowY: "auto", padding: "10px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.user === "You" ? "right" : "left" }}>
            <b>{m.user}: </b>{m.text} ({m.timer})
          </div>
        ))}
      </div>
      <input value={message} onChange={(e)=>setMessage(e.target.value)} style={{ width: "70%", padding: "8px", marginTop: "10px" }}/>
      <button onClick={sendMessage}>send</button>
      <div style={{ marginTop: "20px" }}>
        <Link to="/" >Back to Main chat</Link>
      </div>
    </div>
  )

    
}