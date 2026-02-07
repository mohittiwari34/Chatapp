import React, { useState, useEffect, useContext, useRef } from "react";
import { Link } from "react-router";
import { ChatContext } from "./global";
import { playNotificationSound, playIncomingCallSound } from "./soundUtils";

export default function App() {
  const { socket, userName,
    setUserName, room,
    setRoom, users, setUsers,
    list, setList, callData, setCallData
  } = useContext(ChatContext);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [joined, setJoined] = useState(false);
  const [typingg, SetTypee] = useState("");
  const [theme, setTheme] = useState("dark");
  const [personName, setPersonName] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // For responsive sidebar

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    socket.on("new-message", (data) => {
      // Fix duplication: Ignore own messages since we add them optimally in sendMessage
      if (data.user === userName) return;

      playNotificationSound();
      setMessages((prev) => [...prev, { ...data, isOwn: false }]);
    });
    socket.on("table", (val) => {
      console.log("Received table update:", val);
      setList(val);
    })
    socket.on("recieve", (data) => {
      // This is for private messages in lobby? keeping as is but ensuring formatting
      setMessages((prev) => [
        ...prev,
        { user: `(Private) ${data.user}`, text: data.text, timer: data.timer, isSystem: false }
      ]);
    });
    socket.on("typingison", (name) => {
      SetTypee(`${name} is typing...`);
    })
    socket.on("typingisof", () => {
      SetTypee("");
    })

    // Global Call Listener
    socket.on("incoming-call", ({ from, fromName }) => {
      playIncomingCallSound();
      setCallData({ callerId: from, callerName: fromName, isIncoming: true });
    });

    socket.on("offer", ({ from, offer }) => {
      setCallData(prev => ({ ...prev, offer, callerId: from }));
    });

    socket.on("update users", (data) => {
      console.log("Received update users:", data);
      setUsers(data.userList);
      setMessages((prev) => [
        ...prev,
        { user: "System", text: `${data.nasa} joined the chat`, isSystem: true },
      ]);
    });

    return () => {
      socket.off("new-message");
      socket.off("update users");
      socket.off("table");
      socket.off("recieve");
      socket.off("typingison");
      socket.off("typingisof");
      socket.off("incoming-call");
      socket.off("offer");
    };
  }, [userName, socket]); // Added userName to dependencies so the check works

  const joinRoom = () => {
    if (userName && room) {
      socket.emit("join-room", { room, userName });
      setJoined(true);
    } else {
      alert("Please enter both Name and Room ID");
    }
  };

  let typingTimeout = useRef(null);
  function handleTyping(e) {
    setMessage(e.target.value);
    socket.emit("on-Typing", userName);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(function () {
      socket.emit("stop-Typing");
    }, 2000);
  }

  const sendMessage = () => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (message.trim() === "") return;

    socket.emit("message", { msg: message, timer: time });
    playNotificationSound();
    setMessages((prev) => [...prev, { user: "You", text: message, timer: time, isOwn: true }]);
    setMessage("");
    socket.emit("stop-Typing");
  };

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  if (!joined) {
    return (
      <div className="video-room" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{
          background: 'var(--bg-panel)', padding: '40px', borderRadius: '16px',
          border: '1px solid var(--border)', textAlign: 'center', width: '100%', maxWidth: '400px'
        }}>
          <h1 style={{ marginBottom: '20px', background: 'linear-gradient(to right, #5865F2, #9b59b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Chat App</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              placeholder="Enter your name..."
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              style={{ padding: '12px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px' }}
            />
            <input
              placeholder="Room ID..."
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              style={{ padding: '12px', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px' }}
            />
            <button onClick={joinRoom} style={{ padding: '12px', background: 'var(--primary)', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Join Server</button>
          </div>
        </div>
      </div>
    );
  }

  const answerCall = () => {
    // Navigation handled by Link below or programmatically if needed.
    // Ideally we just let the Link take us there, but we could also use navigate()
  };

  const rejectCall = () => {
    socket.emit("hangup", { to: callData.callerId });
    setCallData(null);
  };

  return (
    <div className="app-container">
      {/* Global Call Notification */}
      {callData && callData.isIncoming && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          background: 'rgba(59, 165, 92, 0.95)', padding: '20px', borderRadius: '12px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.3)', color: 'white'
        }}>
          <h3 style={{ marginBottom: '10px' }}>Incoming Call from {callData.callerName || 'Unknown'}</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to={`/privatchatt/${callData.callerId}?mode=video`}>
              <button style={{ background: 'white', color: 'green', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'blob' }}>Accept</button>
            </Link>
            <button onClick={rejectCall} style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Decline</button>
          </div>
        </div>
      )}

      {/* Sidebar - Users */}
      <div className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span style={{ flex: 1 }}>Attributes</span>
          <button className="mobile-toggle" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1rem' }}>✕</button>
        </div>
        <div className="sidebar-content">
          <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '10px' }}>Online — {users.length}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {users.map((u, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px', borderRadius: '4px', cursor: 'pointer',
                background: u.id === socket.id ? 'rgba(255,255,255,0.05)' : 'transparent'
              }}>
                <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>
                    {u.name} {u.id === socket.id && <span style={{ opacity: 0.5 }}>(You)</span>}
                  </div>
                </div>
                {u.id !== socket.id && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link to={`/privatchatt/${u.id}?mode=chat`} title="Private Chat">
                      <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#f2f3f5', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}>💬</button>
                    </Link>
                    <Link to={`/privatchatt/${u.id}?mode=video`} title="Video Call">
                      <button style={{ background: 'rgba(88, 101, 242, 0.4)', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}>📹</button>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-area">
        <header className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="mobile-toggle" onClick={() => setMobileMenuOpen(true)}>☰</button>
            <h3 style={{ margin: 0 }}># {room}</h3>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Topic: General Chat</div>
        </header>

        <div className="messages-scroller">
          {messages.map((m, i) => (
            <div key={i} className={`message-group ${m.isOwn ? "own" : ""}`}>
              {!m.isOwn && <div className="avatar">{m.user === "System" ? "🤖" : m.user.charAt(0).toUpperCase()}</div>}
              <div className="message-content">
                {!m.isOwn && (
                  <div className="message-header">
                    <span className="username" style={{ color: m.isSystem ? 'var(--success)' : 'white' }}>{m.user}</span>
                    <span className="timestamp">{m.timer}</span>
                  </div>
                )}
                <div className="message-text" style={{ background: m.isSystem ? 'transparent' : undefined, padding: m.isSystem ? 0 : undefined, fontStyle: m.isSystem ? 'italic' : 'normal', color: m.isSystem ? 'var(--text-muted)' : undefined }}>
                  {m.text}
                </div>
              </div>
            </div>
          ))}
          {typingg && <div style={{ marginLeft: '50px', color: 'var(--text-muted)', fontSize: '0.8rem', animation: 'pulse 1s infinite' }}>{typingg}</div>}
        </div>

        <div className="input-wrapper">
          <div className="chat-input-bar">
            <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>+</button>
            <input
              value={message}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={`Message #${room}`}
            />
            <button onClick={sendMessage} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '1.2rem', cursor: 'pointer' }}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}