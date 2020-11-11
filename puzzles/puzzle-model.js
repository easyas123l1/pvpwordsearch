const db = require("../data/db-config.js");

module.exports = {
    addUser,
    getUserByEmail,
    getGames,
    addGame,
    addWords,
    getGame,
    getWords,
};

function addUser(user) {
    return db("users")
        .insert(user, "id")
        .then((ids) => {
            const [id] = ids;
            return id;
        });
}

function getUserByEmail(email) {
    return db("users").where("email", "=", email).first();
}

function getGames() {
    return db("puzzles");
}

function addGame(data) {
    return db("puzzles")
        .insert(data, "id")
        .then((ids) => {
            const [id] = ids;

            return id;
        });
}

function addWords(words) {
    return db("words")
        .insert(words, "id")
        .then((ids) => {
            const [id] = ids;

            return id;
        });
}

function getGame(id) {
    return db("puzzles").where("id", "=", id).first();
}

function getWords(id) {
    return db("words").where("puzzle_id", "=", id);
}
