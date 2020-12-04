const server = require("../server.js");
const http = require("http").Server(server);
const io = require("socket.io")(http);
const fs = require("fs");
const { v4: uuid } = require("uuid");
const {
    placeWords,
    createLines,
    wordPositionDirection,
} = require("./puzzleFunctions");
const { savePuzzle } = require("../puzzles/puzzle-saver.js");

let possibleWords = [];
const rooms = {};
const connections = {};
const connectionsEmail = {};

const loadPossibleWords = (file) => {
    // success will add 58114 words
    try {
        var data = fs.readFileSync(file, "utf8");
        data = data.replace(/(\r)/gm, "");
        possibleWords = data.split("\n");
    } catch (e) {
        console.log("Error:", e.stack);
    }
};

loadPossibleWords("./socket/words.txt");

const generatePuzzle = (roomPuzzle) => {
    let {
        size,
        numberOfWords,
        words,
        minimumWordSize,
        maximumWordSize,
    } = roomPuzzle;
    uniqueRandomNumbers = [];
    let allWordsLength = 0;
    while (words.length < numberOfWords) {
        let r = Math.floor(Math.random() * possibleWords.length);
        if (uniqueRandomNumbers.indexOf(r) === -1) {
            uniqueRandomNumbers.push(r);
            if (
                possibleWords[r].length >= minimumWordSize &&
                possibleWords[r].length <= maximumWordSize
            ) {
                words.push(possibleWords[r].toUpperCase());
                allWordsLength += possibleWords[r].length;
            }
        }
    }
    const answers = placeWords(words, size);
    const lines = createLines(answers, size);
    let letters = [];
    lines.forEach((line) => {
        line.text.map((letter) => letters.push(letter.text));
    });
    roomPuzzle.lines = lines;
    roomPuzzle.puzzle = letters.join("");
    roomPuzzle.wordsDir = wordPositionDirection(words, answers);
    // something to check if answers.length and allWordsLength are the same.
};

/**
 * Will solve a word and update users wordsDir lines and word score.
 * @param socket A connected socket.io socket
 * @param room A object that represents a room from the `rooms` instance variable object
 * @param word A object with word that the user solved.
 * @param lines A Array of Arrays with the users puzzle. (room.players.lines)
 */
const solveWord = (socket, room, word, lines) => {
    room.players.map((player) => {
        if (player.id === socket.id) {
            player.wordsDir.map((playerWord) => {
                if (
                    playerWord.word === word.word &&
                    playerWord.position === word.position &&
                    playerWord.direction === word.direction &&
                    !playerWord.solved
                ) {
                    playerWord.solved = word.solved;
                    playerWord.color = word.color;
                    player.lines = lines;
                    player.score += 1;
                    if (room.puzzle.numberOfWords === player.score) {
                        // change room.state to game over user won
                        room.state = "GAMEOVER";
                    }
                    updateRoom(room);
                }
            });
        }
    });
};

/**
 * Will start the game timer
 * @param room An object that represents a room from the `rooms` instance variable object
 */
const startTimer = (room) => {
    if (room.puzzle.timer >= 0 && room.state !== "GAMEOVER") {
        setTimeout(() => {
            room.puzzle.timer -= 1;
            startTimer(room);
        }, 1000);
    } else {
        room.state = "GAMEOVER";
        updateRoom(room);
        endGame(room);
    }
};

/**
 * Will start the game changing room state to STARTING
 * @param socket A connected socket.io socket
 * @param room An object that represents a room from the `rooms` instance variable object
 */
const startGame = (socket, room) => {
    // only host can start the game!
    if (socket.id === room.hostId) {
        room.state = "STARTING";
        // !TODO! generate the puzzle here should be fine.
        generatePuzzle(room.puzzle);
        console.log(room.puzzle.puzzle, "THEPUZZLE", room.puzzle.wordsDir);
        room.players.forEach((player) => {
            player.wordsDir = JSON.parse(JSON.stringify(room.puzzle.wordsDir));
            player.lines = JSON.parse(JSON.stringify(room.puzzle.lines));
        });
        updateRoom(room);

        setTimeout(() => {
            room.state = "START";
            updateRoom(room);
            // start game room timer.
            startTimer(room);
        }, 3000);
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
        hostId: room.hostId,
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
            name: socket.name,
            id: socket.id,
            score: 0,
            wordsDir: [],
            lines: [],
        };
        playerObj.wordsDir = JSON.parse(JSON.stringify(room.puzzle.wordsDir));
        playerObj.lines = JSON.parse(JSON.stringify(room.puzzle.lines));
        room.players.push(playerObj);
        socket.join(room.id, () => {
            // store the room id in the socket for future use
            socket.roomId = room.id;
            console.log(socket.id, "Joined", room.id);
            updateRoom(room);
        });
    }
};

/**
 * Will end the game for the current room.
 * @param room An object that represents a room from the `rooms` instance variable object
 */
const endGame = (room) => {
    // should end the game and return array with placements based off score.
    // Ties can and will happen. Solution Example: [1st, 1st, 3rd]
    // placement array will be an array of objects with each object
    // having a user then place. IE: [{easy, 1st}, {another, 2nd}]
    // const playerPlacements = room.players.sort((a, b) => {
    //     return a.score - b.score;
    // });
    savePuzzle(room);
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
        console.log("connections", connections);
        console.log("connectionsEmail", connectionsEmail);
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
    socket.on("userInfo", (email, name) => {
        // make sure user sent us a email
        if (email && name) {
            // if user hasn't been set yet.
            if (!socket.email) {
                // check if user already logged in by email
                if (email in connectionsEmail) {
                    // socket.emit("alreadyConnected"); //uncomment this line for production
                    socket.id = uuid(); //comment out this line for production
                    socket.email = email; //comment out this line for production
                    socket.name = name; //comment out this line for production
                    connections[socket.id] = email; //comment out this line for production
                    socket.emit("goodConnection", socket.id); //comment out this line for production
                } else {
                    socket.id = uuid();
                    socket.email = email;
                    socket.name = name;
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
            let room = {
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
                    minimumWordSize: roomInfo.minimumWordSize,
                    maximumWordSize: roomInfo.maximumWordSize,
                    lines: [],
                    words: [],
                    wordsDir: [],
                    puzzle: "",
                    originalTime: roomInfo.timer,
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

    /**
     * Gets fired when a player starts the game.
     */
    socket.on("startGame", () => {
        const room = rooms[socket.roomId];
        startGame(socket, room);
    });

    /**
     * Gets fired when a player solves a word.
     */
    socket.on("solveWord", (word, lines) => {
        const room = rooms[socket.roomId];
        solveWord(socket, room, word, lines);
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
