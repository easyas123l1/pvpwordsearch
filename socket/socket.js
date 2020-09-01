const server = require("../server.js");
const http = require("http").Server(server);
const io = require("socket.io")(http);
const fs = require("fs");
const { v4: uuid } = require("uuid");

let possibleWords = [];
const rooms = {};
const connections = {};
const connectionsEmail = {};

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
 * Will start the game changing room state to STARTING
 * @param room An object that represents a room from the `rooms` instance variable object
 */
const startGame = (socket, room) => {
    // only host can start the game!
    if (socket.id === room.hostId) {
        room.state = "STARTING";
        room.sockets.forEach((socket) => {
            socket.emit("gameStarting");
        });
    }
};

/**
 * Will update the state of a room and emit to all sockets
 * @param room An object that represents a room from the `rooms` instance variable object
 */
const updateRoom = (room) => {
    const responseObj = {
        players: room.players,
        id: room.id,
        name: room.name,
        state: room.state,
        puzzle: room.puzzle,
    };

    room.sockets.forEach((socket) => {
        socket.emit("roomInfo", responseObj);
    });
};

/**
 * Will connect a socket to a specified room
 * @param socket A connected socket.io socket
 * @param room An object that represents a room from the `rooms` instance variable object
 */
const joinRoom = (socket, room) => {
    if (!socket.roomId) {
        room.sockets.push(socket);
        const playerObj = {
            email: socket.email,
            id: socket.id,
            score: 0,
        };
        room.players.push(playerObj);
        socket.join(room.id, () => {
            // store the room id in the socket for future use
            socket.roomId = room.id;
            console.log(socket.id, "Joined", room.id);
            console.log(room.sockets.length);
            updateRoom(room);
        });
    }
};

/**
 * Will make the socket leave the server
 * @param socket A connected socket.io socket
 */
const disconnectServer = (socket) => {
    leaveRooms(socket);
    if (socket.email) {
        delete connections[socket.id];
        delete connectionsEmail[socket.email];
        console.log("user disconnected  ", socket.email);
        socket.email = undefined;
        socket.id = undefined;
        console.log(connections);
        console.log(connectionsEmail);
    }
};

/**
 * Will make the socket leave any rooms that it is a part of
 * @param socket A connected socket.io socket
 */
const leaveRooms = (socket) => {
    socket.roomId = undefined;
    const roomsToDelete = [];
    for (const id in rooms) {
        const room = rooms[id];
        // check to see if the socket is in the current room
        if (room.sockets.includes(socket)) {
            socket.leave(id);
            // remove the socket from the room object
            room.sockets = room.sockets.filter((item) => item !== socket);
            if (room.state === "FILLING") {
                room.players = room.players.filter(
                    (item) => item.id !== socket.id
                );
            }
            // if there is other players we need to update the room
            if (room.sockets.length > 0) {
                // check host left lobby before game start.
                if (room.hostId === socket.id && room.state === "FILLING") {
                    // disconnect all sockets inform host left.
                    room.sockets.forEach((item) => {
                        item.emit("lobbyClosedHostLeft");
                        leaveRooms(item);
                    });
                } else {
                    updateRoom(room);
                }
            }
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

    io.emit("rooms", getRooms());
};

const getRooms = () => {
    const roomNames = [];
    for (const id in rooms) {
        const { name, players, state, puzzle, hostId } = rooms[id];
        const room = { id, name, players, state, puzzle, hostId };
        roomNames.push(room);
    }
    return roomNames;
};

io.on("connection", (socket) => {
    socket.emit("getUserInfo");

    /**
     * Gets fired when a user connects should respond with userInfo
     */
    socket.on("userInfo", (email) => {
        // make sure user sent us a email
        if (email) {
            // if user hasn't been set yet.
            if (!socket.email) {
                // check if user already logged in by email
                if (email in connectionsEmail) {
                    // socket.emit("alreadyConnected"); //uncomment this line for production
                    socket.id = uuid(); //comment out this line for production
                    socket.email = email; //comment out this line for production
                    connections[socket.id] = email; //comment out this line for production
                    socket.emit("goodConnection", socket.id); //comment out this line for production
                } else {
                    socket.id = uuid();
                    socket.email = email;
                    connections[socket.id] = email;
                    connectionsEmail[email] = socket.id;
                    socket.emit("goodConnection", socket.id);
                    console.log("a user connected  ", socket.email);
                    console.log(connections);
                }
            } else if (socket.email === email) {
                socket.emit("goodConnection", socket.id);
            } else if (socket.email !== email) {
                // !*TO BE DONE!*not the same user...
            }
            socket.emit("rooms", getRooms());
        }
    });
    /**
     * Gets fired when a user wants to create a new room.
     */
    socket.on("createRoom", (roomInfo) => {
        if (!socket.roomId) {
            const room = {
                id: uuid(), // generate a unique id for the new room, that way we don't need to deal with duplicates.
                name: roomInfo.name,
                sockets: [],
                players: [],
                // state will let us know what phase the room is in.
                state: "FILLING",
                hostId: socket.id,
                puzzle: {
                    size: roomInfo.size,
                    numberOfWords: roomInfo.numberOfWords,
                    timer: roomInfo.timer,
                    words: [],
                    puzzle: "",
                },
            };
            rooms[room.id] = room;
            // have the socket join the room they've just created.
            joinRoom(socket, room);
            io.emit("rooms", getRooms());
        }
    });

    /**
     * Gets fired when user wants list of rooms.
     */
    socket.on("getRoomNames", () => {
        socket.emit("rooms", getRooms());
    });

    /**
     * Gets fired when a player has joined a room.
     */
    socket.on("joinRoom", (roomId) => {
        const room = rooms[roomId];
        joinRoom(socket, room);
    });

    socket.on("startGame", () => {
        const room = rooms[socket.roomId];
        startGame(socket, room);
    });

    /* 
    what i have made up my mind is game settings will need to be set 
    before the game room is created.  From there the
    creator should be assumed host and can start lobby whenever they want.
    If the creator leaves before the game starts the whole lobby 
    should be notified and backed out.  If the game has already started 
    nothing will happen.
    */

    /**
     * Gets fired when a player leaves a room.
     */
    socket.on("leaveRoom", () => {
        leaveRooms(socket);
    });

    /**
     * Gets fired when a player logs out of google account
     */
    socket.on("disconnecting", () => {
        disconnectServer(socket);
    });

    /**
     * Gets fired when a player disconnects from the server.
     */
    socket.on("disconnect", () => {
        disconnectServer(socket);
    });
});

module.exports = http;
