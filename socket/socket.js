const server = require("../server.js");
const http = require("http").Server(server);
const io = require("socket.io")(http);
const fs = require("fs");
let possibleWords = [];

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

console.log(possibleWords.length);

io.on("connection", (socket) => {
    console.log("a user connected");
    socket.emit("welcome", "hello and welcome to the server");
});

module.exports = http;
