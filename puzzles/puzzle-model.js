const db = require("../data/db-config.js");

module.exports = {
    addUser,
    getUserByEmail,
    getUsersByEmails,
    updateUserByEmail,
    getGames,
    addGame,
    addWords,
    getGame,
    getWords,
    addGamesToUsers,
    getGamesToUsersByGameId,
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
    return db("users")
        .where("email", "=", email)
        .then((users) => {
            const [user] = users;
            return user;
        });
}

function getUsersByEmails(emails) {
    return db("users").where((user) => user.whereIn("email", emails));
}

function updateUserByEmail(email, user) {
    return db("users")
        .where("email", "=", email)
        .update(user)
        .then(() => {
            return getUserByEmail(email);
        });
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

function addGamesToUsers(gameWithUser, gameid) {
    return db("games_users")
        .insert(gameWithUser, "id")
        .then(() => {
            return getGamesToUsersByGameId(gameid);
        });
}

function getGamesToUsersByGameId(gameid) {
    return db("games_users").where("game_id", "=", gameid);
}

function addSolvedWords(solvedWords, gamesUserIds) {
    return db("solved_words")
        .insert(solvedWords, "id")
        .then(() => {
            return getSolvedWordsByGamesUserIds(gamesUserIds);
        });
}

function getSolvedWordsByGamesUserIds(gamesUserIds) {
    return db("solved_words").where((id) =>
        id.whereIn("games_users_id", gamesUserIds)
    );
}
