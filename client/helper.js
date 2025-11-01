import React, { useState, useEffect, useContext } from "react";
import { useRef } from "react";
import { createRoot } from "react-dom/client";
import { Link } from "react-router";
import { ChatContext } from "./global";


export default function App() {
  const{socket,userName,
    setUserName,room,
    setRoom,users,setUsers,
    list,setList
  }=useContext(ChatContext);
  
  
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  
  const [typingg,SetTypee]=useState("");
  const [backgroundColor,setBackgrouncolor]=useState("white");
   
  const [personName, setPersonName] = useState(null);

  function person(name){
    alert(`you started private chatting ${name.name}`);
    setPersonName(name)

  }

  
  useEffect(() => {
    socket.on("new-message", (data) => {
      new Audio("/notify.mp3").play();
      setMessages((prev) => [...prev, data]);
    });
    socket.on("table",(val)=>{
      setList(val);
    })
    socket.on("recieve",(data)=>{
      setMessages((prev)=>[
    ...prev,
    { user: `(Private) ${data.user}`, text: data.text, timer: data.timer }
  ]);
    })
    socket.on("typingison",(name)=>{
      SetTypee(`${name} is typing`);
    })
    socket.on("typingisof",()=>{
      SetTypee("");
    })

    


    socket.on("update users", (data) => {
      setUsers(data.userList);
      setMessages((prev) => [
        ...prev,
        { user: "System", text: `${data.nasa} joined the chat` },
      ]);
    });

    return () => {
      socket.off("new-message");
      socket.off("update users");
    };
  }, []);
  useEffect(()=>{
    console.log("uppdated",list);
  },[list]);
  useEffect(()=>{
    document.body.style.backgroundColor=backgroundColor;
  
  },[backgroundColor]);

  const joinRoom = () => {
    if (userName && room) {
      socket.emit("name", userName);
      socket.emit("join-room", room);
    }
  };
  let typingsecond=useRef(null);
  function handleTyping(e){
    setMessage(e.target.value);
    socket.emit("on-Typing",userName);
    clearTimeout(typingsecond.current);
    typingsecond.current=setTimeout(function (){
      socket.emit("stop-Typing");
    },5000);
  }

  const sendMessage = () => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if(personName){
      socket.emit("privateChat",{to:personName.id,msg:message,timer:time});
      setMessages((prev) => [...prev, { user: "You", text: message, timer: time }]);
      
    }
    else{
    socket.emit("message", { msg: message, timer: time });
    setMessages((prev) => [...prev, { user: "You", text: message, timer: time }]);
    
    }
    

    setMessage("");
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1 style={{color:backgroundColor==="white"?"black":"white"}}>React + Parcel Chat App 💬</h1>
      <button onClick={()=>setBackgrouncolor("Black")}>DarkMode</button>
      <button onClick={()=>setBackgrouncolor("white")}>NormalMode</button>


      <div>
        <input
          placeholder="Your Name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <input
          placeholder="Room ID"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <button onClick={joinRoom}>Join</button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
        <div style={{ width: "60%", background: "#ecf0f1", height: "60vh", padding: "10px", borderRadius: "8px", overflowY: "auto" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ textAlign: m.user === "You" ? "right" : "left", margin: "5px 0",color: m.user.startsWith("(Private)") ? "red":"black" }}>
              <b>{m.user}: </b>{m.text} {m.timer && `(${m.timer})`}
            </div>
          ))}
          <div style={{ marginTop: "10px", color: "gray", fontStyle: "italic" }}>
  {typingg}
</div>
        </div>

        <div style={{ marginLeft: "20px", textAlign: "left" }}>
          <h3>Users</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {users.map((u, i) => (
              <li key={i}>{u.name}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        <input
          style={{ width: "60%", padding: "8px" }}
          placeholder="Type a message..."
          value={message}
          onChange={handleTyping}
          onKeyDown={(e)=>{
            if(e.key==="Enter" && message.trim()!==""){
              sendMessage();
              socket.emit("stop-Typing");
            }
            

          }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      <div style={{position:"absolute",left:"20px",top:"50px",display:"flex",gap:"5px"}}>
        {
          list.map((val,i)=>{
            return(
              //<button key={i} onClick={()=>person(val)} style={{color:"white",backgroundColor:"black"}}>{val.name}</button>
              <Link key={i} to={`/privatchatt/${val.id}`}
              ><button>{val.name}</button>
              </Link>
            )
          })
        }
      </div>
    </div>
  );
}