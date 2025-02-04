require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const server = http.createServer(app);
const {
  handelStart,
  getType,
  handelDisconnect,
  handelSkip,
} = require("./src/function");

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true,
};

let online = 0;
let roomArr = [];

const io = socketIO(server, {
  cors: corsOptions,
});

io.on("connection", (socket) => {
  online++;
  console.log(`A user connected with id ${socket.id}`);
  io.emit("online", online);

  // Flag to prevent double decrementing
  let alreadyDisconnected = false;

  socket.on("start", (cb) => {
    handelStart(roomArr, socket, cb, io);
  });

  socket.on("ice:send", ({ candidate }) => {
    let type = getType(socket.id, roomArr);
    if (type) {
      if (type.type === "p1" && type.p2id) {
        io.to(type.p2id).emit("ice:reply", { candidate, from: socket.id });
      } else if (type.type === "p2" && type.p1id) {
        io.to(type.p1id).emit("ice:reply", { candidate, from: socket.id });
      }
    }
  });

  socket.on("sdp:send", ({ sdp }) => {
    let type = getType(socket.id, roomArr);
    if (type) {
      if (type.type === "p1" && type.p2id) {
        io.to(type.p2id).emit("sdp:reply", { sdp, from: socket.id });
      } else if (type.type === "p2" && type.p1id) {
        io.to(type.p1id).emit("sdp:reply", { sdp, from: socket.id });
      }
    }
  });

  // Handle chat messages
  socket.on("chat:send", ({ message }) => {
    let type = getType(socket.id, roomArr);
    if (type) {
      if (type.type === "p1" && type.p2id) {
        io.to(type.p2id).emit("chat:receive", { message, from: socket.id });
      } else if (type.type === "p2" && type.p1id) {
        io.to(type.p1id).emit("chat:receive", { message, from: socket.id });
      }
    }
  });

  // Handle skip event
  socket.on("skip", () => {
    console.log(`User ${socket.id} requested to skip`);
    handelSkip(socket.id, roomArr, io);
  });

  socket.on("leave", () => {
    console.log("leave reached here");

    if (!alreadyDisconnected) {
      online--;
      io.emit("online", online);
      alreadyDisconnected = true;
    }

    // No need to call socket.disconnect() here
    console.log(`Online users: ${online}`);
    handelDisconnect(socket.id, roomArr, io);
  });

  socket.on("disconnect", () => {
    if (!alreadyDisconnected) {
      online--;
      io.emit("online", online);
      alreadyDisconnected = true;
    }
    console.log(`A user disconnected. Online users: ${online}`);
    handelDisconnect(socket.id, roomArr, io);
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
