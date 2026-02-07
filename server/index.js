const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
// const Main2=require("./database");

const app = express();
const server = http.createServer(app);

// Allow CORS from frontend
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for easier deployment, or set to your frontend URL
    methods: ["GET", "POST"],
  },
});

const twilio = require("twilio");

// Twilio Config
const accountSid = "AC8f7dca7a007a5619efed78a6c00bfb49";
const authToken = "1ebc2917fde1bfae3fc7c5dcba2d21dd";
const client = twilio(accountSid, authToken);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/api/turn-credentials", async (req, res) => {
  try {
    const token = await client.tokens.create();
    res.json(token.iceServers);
  } catch (error) {
    console.error("Error creating Twilio token:", error);
    res.status(500).send("Could not create TURN credentials");
  }
});

// ... content ...


// Keep track of users in each room
const roomUsers = {};
function isInSameRoom(socket, targetId) {
  if (!socket.room) return false;
  const users = roomUsers[socket.room] || [];
  return users.some((u) => u.id === targetId);
}

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Save user name
  socket.on("name", (userName) => {
    socket.userName = userName;
  });


  socket.on("call-user", ({ to, fromName }) => {
    if (!isInSameRoom(socket, to)) {
      socket.emit("call-error", { message: "Target not in same room" });
      return;
    }
    io.to(to).emit("incoming-call", {
      id: socket.id,
      name: fromName
    }

    );
  });
  socket.on("offer", ({ to, offer }) => {
    if (!isInSameRoom(socket, to)) {
      socket.emit("signal-error", { message: "Target not in same room" });
      return;
    }
    io.to(to).emit("offer",
      {
        from: socket.id,
        offer,

      }
    );
  });
  socket.on("answer", ({ to, answer }) => {
    if (!isInSameRoom(socket, to)) {
      socket.emit("signal-error", { message: "Target not in same room" });
      return;
    }
    io.to(to).emit("answer", {
      from: socket.id,
      answer,
    })
  })
  socket.on("candidate", ({ to, candidate }) => {
    if (!isInSameRoom(socket, to)) {

      return;
    }
    io.to(to).emit("candidate", {
      from: socket.id,
      candidate,
    });
  });
  socket.on("hangup", ({ to }) => {
    io.to(to).emit("hangup", { from: socket.id });
  })
  // Join room
  // Join room
  socket.on("join-room", (payload) => {
    console.log("Received join-room event with payload:", payload);

    let room, userName;

    if (typeof payload === 'object') {
      room = payload.room;
      userName = payload.userName;
    } else {
      room = payload;
    }

    if (userName) socket.userName = userName;

    console.log(`User ${socket.id} (Name: ${socket.userName}) joining room: ${room}`);

    if (!socket.userName) {
      console.log("Join failed: No username set for socket");
      return;
    }

    socket.room = room;
    socket.join(room);

    if (!roomUsers[room]) roomUsers[room] = [];

    // Prevent duplicate user entries
    roomUsers[room] = roomUsers[room].filter(u => u.id !== socket.id);
    roomUsers[room].push({ id: socket.id, name: socket.userName });

    console.log("Current users in room:", roomUsers[room]);

    io.to(socket.room).emit("table", roomUsers[socket.room]);

    // Update all users in the room
    io.to(room).emit("update users", {
      userList: roomUsers[room],
      nasa: `${socket.userName} joined the chat`,
    });

  });

  // Typing indicator
  socket.on("on-Typing", (name) => {
    socket.to(socket.room).emit("typingison", name);
  });
  socket.on("stop-Typing", () => {
    socket.to(socket.room).emit("typingisof");
  });

  // Public message
  socket.on("message", async ({ msg, timer }) => {
    if (!socket.room) return;
    io.to(socket.room).emit("new-message", {
      user: socket.userName,
      text: msg,
      timer,
    });
    //await Main2("Messages",msg,socket.userName,timer);
  });

  //raj
  // Private message
  socket.on("privateChat", async ({ to, msg, timer, userName }) => {
    io.to(to).emit("recieve", {
      user: socket.userName || userName,
      text: msg,
      timer,
    });
    //await Main2("Messages",msg,socket.userName,timer);
  });


  // Disconnect
  socket.on("disconnect", () => {
    if (socket.room && socket.userName) {
      const users = roomUsers[socket.room];
      if (users) {
        roomUsers[socket.room] = users.filter((u) => u.id !== socket.id);
        io.to(socket.room).emit("update users", {
          userList: roomUsers[socket.room],
          nasa: `${socket.userName} left the chat`,
        });
      }
    }
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 2000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
