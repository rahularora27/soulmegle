const { v4: uuidv4 } = require("uuid");

function handelStart(roomArry, socket, cb, io) {
  let availableroom = checkAvailableRoom();
  if (availableroom.is) {
    socket.join(availableroom.roomid);
    cb("p2");
    closeRoom(availableroom.roomid);
    if (availableroom && availableroom.room) {
      io.to(availableroom.room.p1.id).emit("remote-socket", socket.id);
      socket.emit("remote-socket", availableroom.room.p1.id);
      socket.emit("roomid", availableroom.room.roomid);
      console.log("room available ");
    }
  } else {
    let roomid = uuidv4();
    socket.join(roomid);
    roomArry.push({
      roomid,
      isAvailable: true,
      p1: {
        id: socket.id,
      },
      p2: {
        id: null,
      },
    });
    cb("p1");
    socket.emit("roomid", roomid);
    console.log("created new room");
  }

  function closeRoom(roomid) {
    for (let i = 0; i < roomArry.length; i++) {
      if (roomArry[i].roomid === roomid) {
        roomArry[i].isAvailable = false;
        roomArry[i].p2.id = socket.id;
        break;
      }
    }
  }

  function checkAvailableRoom() {
    for (let i = 0; i < roomArry.length; i++) {
      if (
        roomArry[i].isAvailable &&
        roomArry[i].p1.id !== socket.id &&
        roomArry[i].p2.id !== socket.id
      ) {
        return { is: true, roomid: roomArry[i].roomid, room: roomArry[i] };
      }
      if (roomArry[i].p1.id === socket.id || roomArry[i].p2.id === socket.id) {
        return { is: false, roomid: "", room: null };
      }
    }
    return { is: false, roomid: "", room: null };
  }
}

function getType(id, roomArr) {
  for (let i = 0; i < roomArr.length; i++) {
    if (roomArr[i].p1.id === id) {
      return { type: "p1", p2id: roomArr[i].p2.id };
    } else if (roomArr[i].p2.id === id) {
      return { type: "p2", p1id: roomArr[i].p1.id };
    }
  }

  return false;
}

function handelDisconnect(disconnectedId, roomArr, io) {
  for (let i = 0; i < roomArr.length; i++) {
    if (roomArr[i].p1.id === disconnectedId) {
      if (roomArr[i].p2.id) {
        io.to(roomArr[i].p2.id).emit("disconnected");
      }
      roomArr.splice(i, 1);
      break;
    } else if (roomArr[i].p2.id === disconnectedId) {
      if (roomArr[i].p1.id) {
        io.to(roomArr[i].p1.id).emit("disconnected");
      }
      roomArr.splice(i, 1);
      break;
    }
  }
}

function handelSkip(socketId, roomArr, io) {
  // Find the room the user is in
  let roomIndex = roomArr.findIndex(
    (room) => room.p1.id === socketId || room.p2.id === socketId
  );

  if (roomIndex !== -1) {
    let room = roomArr[roomIndex];
    let otherUserId = null;

    if (room.p1.id === socketId) {
      otherUserId = room.p2.id;
    } else if (room.p2.id === socketId) {
      otherUserId = room.p1.id;
    }

    // Notify the other user to skip
    if (otherUserId) {
      io.to(otherUserId).emit("skipped");
    }

    // Remove the room as both users are now disconnected
    roomArr.splice(roomIndex, 1);

    // The user who initiated skip starts a new search
    let socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit("start", (person) => {
        handelStart(
          roomArr,
          socket,
          (role) => {
            socket.emit("role", role);
          },
          io
        );
      });
    }

    // The other user starts a new search
    if (otherUserId) {
      let otherSocket = io.sockets.sockets.get(otherUserId);
      if (otherSocket) {
        otherSocket.emit("start", (person) => {
          handelStart(
            roomArr,
            otherSocket,
            (role) => {
              otherSocket.emit("role", role);
            },
            io
          );
        });
      }
    }
  }
}

module.exports = {
  handelStart,
  getType,
  handelDisconnect,
  handelSkip,
};
