import { createContext,useState } from "react";
import { io } from "socket.io-client";
export const ChatContext=createContext();
const socket=io("http://localhost:2000");
export function ChatProvide({children}){
    const [userName, setUserName] = useState("");
  const [room, setRoom] = useState("");
  const [users, setUsers] = useState([]);
  const [list, setList] = useState([]);
  return(
    <ChatContext.Provider 
    value={{userName,
        setUserName,
        room,
        setRoom,
        users,
        setUsers,
        list,
        setList,
        socket,
    }}>
        {children}

    </ChatContext.Provider>
  );
}