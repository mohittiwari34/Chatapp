import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useState } from "react";
import { Link,useParams } from "react-router";
import { ChatContext } from "./global";
import { useContext } from "react";

import socket from "./socket";

export default function Pribate(){
    const{userName}=useContext(ChatContext);
    const {id}=useParams();
    const localVideo=useRef(null);
    const remoteVideo=useRef(null);
    const pc=useRef(null);
    const localStream=useRef(null);
    const currentOffer=useRef(null);
    const [icoming,setIncoming]=useState(null);
    const [inCall,setInCall]=useState(false);

    const iceServers=[
      {},
      {
        urls:"",
        username:"",
        credential:" ",
      },
    ]
    const createPc=(targetId)=>{
      const pc=new RTCPeerConnection({iceServers});
      pc.onicecandidate=({candidate})=>{
        if(candidate) socket.emit("candidate",{to:targetId,candidate});
      };
      pc.ontrack=(e)=>(remoteVideo.current.srcObject=e.streams[0]);
      if(localStream.current){
        localStream.current.getTracks().forEach((t)=>
        pc.addtTrack(t,localStream.current));
      }
      pcRef.current=pc;
      return pc;
    };

    const startCamera=async()=>{
      localStream.current=await navigator.mediaDevices.getUserMedia({
        video:true,
        audio:true,
      })
      localVideo.current.srcObject=localStream.current;
    }
    const startCall=async ()=>{
      await startCamera();
      const pc=createPc(id);
      const offer=await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("call-user",{to: id,fromName:userName});
      socket.emit("offer",{to:id,offer: pc.localDescription});
      setInCall(true);
      
    }
    const acceptCall=async ()=>{
      await startCamera();
      const pc=createPc(icoming.id);
      await pc.setRemoteDescription(currentOffer.current);
      const answer=await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer",{to:incoming.id,answer: pc.localDescription});
      setInCall(true);
      setIncoming(null);
    }
    const rejectCall=()=>{
      socket.emit("hangup",{to:incoming.id});
      setIncoming("null");

    }
    const hangup=()=>{
      if(pc.current){
        pc.current.close();

      }
      if(localStream.current){
        localStream.current.getTracks().forEach((t)=>t.stop());

      }
      remoteVideo.current.srcObject=null;
      localVideo.current.srcObject=null;
      socket.emit("hangup",{to:id});
      setInCall(false);
    }

  

    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    useEffect(()=>{
      socket.on("Incoming-call",({from,fromName})=>{
        setIncoming({id:from,name:fromName});
      })
      socket.on("offer",({from,offer})=>{
        currentOffer.current=offer;
        setIncoming({id:from});
      })
      socket.on("answer",async({from,answer})=>{
        if(pc.current){
          await pc.current.setRemoteDescription(answer);

        }
      });
      socket.on("candidate",async({from,candidate})=>{
        if(pc.current&&candidate){
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));

        }
      })
      socket.on("hangup",()=>hangup());

      return ()=>{
        socket.off("incoming-call");
        socket.off("offer");
        socket.off("answer");
        socket.off("candidate");
        socket.off("hangup");
      }



    },[])
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
    
      socket.emit("privateChat",{to:id,msg:message,timer:time,userName});
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