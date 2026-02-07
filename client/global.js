import { createContext, useState } from "react";
import { io } from "socket.io-client";
export const ChatContext = createContext();
const SOCKET_URL = window.location.hostname === "localhost"
  ? "http://localhost:2000"
  : "https://chatapp-server-33ru.onrender.com"; // UPDATE THIS AFTER DEPLOYING SERVER

const socket = io(SOCKET_URL);
export function ChatProvide({ children }) {
  const [userName, setUserName] = useState("");
  const [room, setRoom] = useState("");
  const [users, setUsers] = useState([]);
  const [list, setList] = useState([]);
  const [callData, setCallData] = useState(null);
  return (
    <ChatContext.Provider
      value={{
        userName,
        setUserName,
        room,
        setRoom,
        users,
        setUsers,
        list,
        setList,
        socket,
        callData,
        setCallData
      }}>
      {children}

    </ChatContext.Provider>
  );
}