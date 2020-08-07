const server = require("../server.js");
const http = require("http").Server(server);
const io = require("socket.io")(http);
const fs = require("fs");
const { v4: uuid } = require("uuid");

let possibleWords = [];
const rooms = {};

const loadPossibleWords = (file) => {
    try {
        var data = fs.readFileSync(file, "utf8");
        data = data.replace(/(\r)/gm, "");
        possibleWords = data.split("\n");
    } catch (e) {
        console.log("Error:", e.stack);
    }
};

loadPossibleWords("./socket/words.txt");

/**
 * Will connect a socket to a specified room
 * @param socket A connected socket.io socket
 * @param room An object that represents a room from the `rooms` instance variable object
 */
const joinRoom = (socket, room) => {
    room.sockets.push(socket);
    socket.join(room.id, () => {
        // store the room id in the socket for future use
        socket.roomId = room.id;
        console.log(socket.id, "Joined", room.id);
        console.log(room.sockets.length);
        // do some for loop on room.sockets.playerobj we need to figure out how that will work...
        socket.emit("enteredRoom", room.id);
    });
};

/**
 * Will make the socket leave any rooms that it is a part of
 * @param socket A connected socket.io socket
 */
const leaveRooms = (socket) => {
    const roomsToDelete = [];
    for (const id in rooms) {
        const room = rooms[id];
        // check to see if the socket is in the current room
        if (room.sockets.includes(socket)) {
            socket.leave(id);
            // remove the socket from the room object
            room.sockets = room.sockets.filter((item) => item !== socket);
        }
        // Prepare to delete any rooms that are now empty
        if (room.sockets.length == 0) {
            roomsToDelete.push(room);
        }
    }

    // Delete all the empty rooms that we found earlier
    for (const room of roomsToDelete) {
        delete rooms[room.id];
    }
};

const getRooms = () => {
    const roomNames = [];
    for (const id in rooms) {
        const { name } = rooms[id];
        const room = { name, id };
        roomNames.push(room);
    }
    return roomNames;
};

io.on("connection", (socket) => {
    socket.id = uuid();
    console.log("a user connected  ", socket.id);
    const roomNames = getRooms();
    console.log(socket.id, " getting rooms");
    socket.emit("rooms", roomNames);
    /**
     * Gets fired when a user wants to create a new room.
     */
    socket.on("createRoom", (roomName) => {
        const room = {
            id: uuid(), // generate a unique id for the new room, that way we don't need to deal with duplicates.
            name: roomName,
            sockets: [],
        };
        rooms[room.id] = room;
        // have the socket join the room they've just created.
        joinRoom(socket, room);
        const roomNames = getRooms();
        console.log(socket.id, " getting rooms");
        io.emit("rooms", roomNames);
    });

    socket.on("getRoomNames", (data) => {
        const roomNames = getRooms();
        console.log(socket.id, " getting rooms");
        socket.emit("rooms", roomNames);
    });

    /**
     * Gets fired when a player has joined a room.
     */
    socket.on("joinRoom", (roomId) => {
        const room = rooms[roomId];
        joinRoom(socket, room);
    });

    /**
     * Gets fired when a player leaves a room.
     */
    socket.on("leaveRoom", () => {
        leaveRooms(socket);
        const roomNames = getRooms();
        socket.emit("rooms", roomNames);
    });

    /**
     * Gets fired when a player disconnects from the server.
     */
    socket.on("disconnect", () => {
        console.log("user disconnected");
        leaveRooms(socket);
    });
});

module.exports = http;
