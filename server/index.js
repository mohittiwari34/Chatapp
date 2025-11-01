const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Main2=require("./database");

const app = express();
const server = http.createServer(app);

// Allow CORS from frontend (localhost:1234)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:1234",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Keep track of users in each room
const roomUsers = {};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Save user name
  socket.on("name", (userName) => {
    socket.userName = userName;
  });
  

  // Join room
  socket.on("join-room", (room) => {
    if (!socket.userName) return;

    socket.room = room;
    socket.join(room);

    if (!roomUsers[room]) roomUsers[room] = [];
    roomUsers[room].push({ id: socket.id, name: socket.userName });
    io.to(socket.room).emit("table",roomUsers[socket.room]);

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
  socket.on("message", async({ msg, timer }) => {
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
  socket.on("privateChat", async({ to, msg, timer }) => {
    io.to(to).emit("recieve", {
      user: socket.userName,
      text:msg,
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

server.listen(2000, () => {
  console.log("Server running on port 2000");
});
