import React, { useEffect, useRef, useState, useContext } from "react";
import { Link, useParams, useLocation } from "react-router";
import { ChatContext } from "./global";
import { playNotificationSound, playIncomingCallSound } from "./soundUtils";

export default function Pribate() {
  const { userName, socket, callData, setCallData } = useContext(ChatContext);
  const { id } = useParams();
  const location = useLocation();
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const pcRef = useRef(null);
  const localStream = useRef(null);
  const currentOffer = useRef(null);
  const candidateQueue = useRef([]); // Fix: Queue for candidates arriving before remoteDescription
  const [icoming, setIncoming] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false); // Toggle for side panel
  const [viewMode, setViewMode] = useState("video"); // 'video' or 'chat'

  // Initialize mode from URL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    if (mode === "chat") {
      setViewMode("chat");
      setShowChat(true);
    } else {
      setViewMode("video");
      setShowChat(false);
    }
  }, [location.search]);

  // Check for global call data on mount (e.g. if accepted from main chat)
  useEffect(() => {
    if (callData && callData.isIncoming && callData.callerId === id) {
      if (callData.offer) {
        // Auto-accept the call since user clicked 'Accept' in Lobby
        acceptCall(callData.callerId, callData.offer);
      } else {
        // Fallback just in case offer is missing
        setIncoming({ id: callData.callerId, name: callData.callerName });
      }
      // If coming from accept call, ensure video mode
      setViewMode("video");
    }
  }, [callData, id]);

  // Fetch ICE servers (TURN) from backend
  const [iceServers, setIceServers] = useState([
    { urls: "stun:stun.l.google.com:19302" } // Default Fallback
  ]);

  useEffect(() => {
    const fetchIceServers = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || "https://chatapp-server-33ru.onrender.com"}/api/turn-credentials`);
        if (response.ok) {
          const servers = await response.json();
          setIceServers(servers);
          console.log("Loaded TURN servers");
        }
      } catch (error) {
        console.error("Failed to fetch TURN servers, using default STUN", error);
      }
    };
    fetchIceServers();
  }, []);

  const createPc = (targetId) => {
    const pc = new RTCPeerConnection({ iceServers });
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit("candidate", { to: targetId, candidate });
    };
    pc.ontrack = (e) => {
      if (remoteVideo.current) remoteVideo.current.srcObject = e.streams[0];
    };
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) =>
        pc.addTrack(t, localStream.current));
    }
    pcRef.current = pc;
    return pc;
  };

  const processCandidateQueue = async () => {
    if (pcRef.current && candidateQueue.current.length > 0) {
      for (const candidate of candidateQueue.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
      candidateQueue.current = [];
    }
  };

  const startCamera = async () => {
    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })
    if (localVideo.current) localVideo.current.srcObject = localStream.current;
  }
  const startCall = async () => {
    await startCamera();
    const pc = createPc(id);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("call-user", { to: id, fromName: userName });
    socket.emit("offer", { to: id, offer: pc.localDescription });
    setInCall(true);
  }

  const acceptCall = async (incomingId, incomingOffer) => {
    const targetId = incomingId || icoming?.id;
    const offerToUse = incomingOffer || currentOffer.current;

    if (!targetId || !offerToUse) return;

    try {
      await startCamera();
      const pc = createPc(targetId);
      await pc.setRemoteDescription(offerToUse);
      await processCandidateQueue(); // Process any queued candidates
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: targetId, answer: pc.localDescription });
      setInCall(true);
      setIncoming(null);
      setCallData(null); // Clear global notification
    } catch (err) {
      console.error("Error accepting call:", err);
      // Fallback if autoplay is blocked: show manual accept UI
      if (!inCall) {
        setIncoming({ id: targetId, name: targetId });
        currentOffer.current = offerToUse;
      }
    }
  }

  const rejectCall = () => {
    socket.emit("hangup", { to: icoming.id });
    setIncoming(null);
    setCallData(null); // Clear global notification
  }

  const hangup = () => {
    if (pcRef.current) {
      pcRef.current.close();
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
    }
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    if (localVideo.current) localVideo.current.srcObject = null;
    socket.emit("hangup", { to: id });
    setInCall(false);
  }

  useEffect(() => {
    socket.on("incoming-call", ({ from, fromName }) => {
      playIncomingCallSound();
      setIncoming({ id: from, name: fromName });
    })
    socket.on("offer", ({ from, offer }) => {
      currentOffer.current = offer;
      setIncoming({ id: from });
    })
    socket.on("answer", async ({ from, answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(answer);
        await processCandidateQueue(); // Process any queued candidates
      }
    });
    socket.on("candidate", async ({ from, candidate }) => {
      const pc = pcRef.current;
      if (pc) {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          // Queue candidate if remote description isn't set yet
          candidateQueue.current.push(candidate);
        }
      }
    })
    socket.on("hangup", () => hangup());

    return () => {
      socket.off("incoming-call");
      socket.off("offer");
      socket.off("answer");
      socket.off("candidate");
      socket.off("hangup");
      // Clean up media tracks on unmount
      if (localStream.current) {
        localStream.current.getTracks().forEach((t) => t.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    }
  }, [])

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleReceive = (data) => {
      playNotificationSound();
      setMessages((prev) => [
        ...prev,
        { user: `${data.user}`, text: data.text, timer: data.timer, isSystem: false }
      ]);
      if (!showChat) setShowChat(true);
    };

    socket.on("recieve", handleReceive);

    return () => {
      socket.off("recieve", handleReceive);
    };
  }, [showChat]);

  const sendMessage = () => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (message.trim() === "") return;

    socket.emit("privateChat", { to: id, msg: message, timer: time, userName });
    playNotificationSound();
    setMessages((prev) => [...prev, { user: "You", text: message, timer: time, isOwn: true }]);
    setMessage("");
  };

  const [isMuted, setIsMuted] = useState(false);

  const toggleAudio = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // SVG Icons
  const IconVideo = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>;
  const IconPhoneOff = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
  const IconMic = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>;
  const IconMicOff = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>;
  const IconChat = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
  const IconLogOut = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;

  const switchToVideo = () => {
    setViewMode("video");
    setShowChat(false); // Or keep it open if preferred
    startCall();
  };

  if (viewMode === "chat") {
    return (
      <div className="chat-interface">
        {/* Chat Header */}
        <header className="chat-header-styled">
          <div className="chat-user-info">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <button className="chat-back-btn">←</button>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="avatar" style={{ width: 40, height: 40, fontSize: '1rem' }}>{id.charAt(0).toUpperCase()}</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{id}</h3>
                <span style={{ fontSize: '0.8rem', color: '#3ba55c' }}>Online</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setViewMode("video")} className="video-call-action-btn">
              <IconVideo /> <span style={{ fontSize: '0.9rem' }}>Video Call</span>
            </button>
          </div>
        </header>

        {/* Chat Area (Reusing logic but full screen) */}
        <div className="messages-scroller" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {messages.map((m, i) => (
            <div key={i} className={`message-group ${m.isOwn ? "own" : ""}`}>
              {!m.isOwn && <div className="avatar">{m.user.charAt(0).toUpperCase()}</div>}
              <div className="message-content">
                {!m.isOwn && (
                  <div className="message-header">
                    <span className="username">{m.user}</span>
                    <span className="timestamp">{m.timer}</span>
                  </div>
                )}
                <div className="message-text">{m.text}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-wrapper" style={{ padding: '20px' }}>
          <div className="chat-input-bar">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send a message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>➤</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-room">
      {/* Main Video Stage */}
      <div className="stage-container">
        <div className="video-grid">
          <div className="video-card">
            <video ref={localVideo} autoPlay muted playsInline></video>
            <div className="video-label">You</div>
          </div>
          <div className="video-card">
            <video ref={remoteVideo} autoPlay playsInline></video>
            <div className="video-label">{id}</div>
            {!inCall && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', color: 'white' }}>Waiting to connect...</div>}
          </div>
        </div>

        {/* Incoming Call Popup Overlay */}
        {icoming && !inCall && (
          <div style={{
            position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(40, 43, 48, 0.95)', padding: '20px 40px', borderRadius: '12px',
            textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 200
          }}>
            <h3 style={{ marginBottom: '15px', color: 'white' }}>Incoming Video Call</h3>
            <div style={{ fontSize: '1.2rem', marginBottom: '20px' }}>{icoming.name || icoming.id}</div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <button onClick={acceptCall} style={{ background: '#3ba55c', padding: '10px 30px', border: 'none', borderRadius: '50px', color: 'white', fontSize: '1rem', cursor: 'pointer' }}>Accept</button>
              <button onClick={rejectCall} style={{ background: '#ed4245', padding: '10px 30px', border: 'none', borderRadius: '50px', color: 'white', fontSize: '1rem', cursor: 'pointer' }}>Decline</button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Controls */}
      <div className="controls-bar">
        {!inCall ? (
          <button className="control-btn active" onClick={startCall} title="Start Call">
            <IconVideo />
          </button>
        ) : (
          <button className="control-btn danger" onClick={hangup} title="End Call">
            <IconPhoneOff />
          </button>
        )}
        <button className={`control-btn ${isMuted ? 'danger' : ''}`} onClick={toggleAudio} title={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? <IconMicOff /> : <IconMic />}
        </button>
        <button className={`control-btn ${showChat ? 'active' : ''}`} onClick={() => setShowChat(!showChat)} title="Toggle Chat">
          <IconChat />
        </button>
        <Link to="/">
          <button className="control-btn danger" title="Leave">
            <IconLogOut />
          </button>
        </Link>
      </div>

      {/* Collapsible Chat Side Panel */}
      {showChat && (
        <div className="side-panel">
          <div className="sidebar-header" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <span>Chat</span>
            <button onClick={() => setShowChat(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
          </div>

          <div className="messages-scroller">
            {messages.map((m, i) => (
              <div key={i} className={`message-group ${m.isOwn ? "own" : ""}`}>
                {!m.isOwn && (
                  <div className="avatar">
                    {m.user.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="message-content">
                  {!m.isOwn && (
                    <div className="message-header">
                      <span className="username">{m.user}</span>
                      <span className="timestamp">{m.timer}</span>
                    </div>
                  )}
                  <div className="message-text">{m.text}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-wrapper">
            <div className="chat-input-bar">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send a message..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>➤</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}