const db = require("../data/db-config.js");

module.exports = {
    addUser,
    getUserByEmail,
    getGames,
    addGame,
    addWords,
    getGame,
    getWords,
    addGamesToUsers,
    addSolvedWords,
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
    return db("games");
}

function addGame(game) {
    return db("games")
        .insert(game, "id")
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
    return db("games").where("id", "=", id).first();
}

function getWords(id) {
    return db("words").where("games_id", "=", id);
}

function addGamesToUsers(gameWithUser) {
    return db("games_users")
        .insert(gameWithUser, "id")
        .then((ids) => {
            const [id] = ids;

            return id;
        });
}

function addSolvedWords(solvedWords) {
    return db("solved_words")
        .insert(solvedWords, "id")
        .then((ids) => {
            const [id] = ids;

            return id;
        });
}
