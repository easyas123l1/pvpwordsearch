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
    getUserHistory,
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

function getGamesByIds(ids) {
    return db("games").where((game) => game.whereIn("id", ids));
}

function getWords(id) {
    return db("words").where("games_id", "=", id);
}

function getWordsByGameIds(ids) {
    return db("words").where((word) => word.whereIn("games_id", ids));
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

function getUsersByGameIds(gameIds) {
    return db("games_users")
        .join("users", "users.id", "games_users.user_id")
        .select(
            "games_users.id as games_users_id",
            "games_users.user_id",
            "games_users.game_id",
            "users.email",
            "users.name",
            "users.imageurl"
        )
        .where((gameUser) => gameUser.whereIn("game_id", gameIds));
}

function getUsersGames(userid) {
    return db("games_users").where("user_id", "=", userid);
}

function getUserHistory(email) {
    return getUserByEmail(email).then((user) => {
        return getUsersGames(user.id).then((gamesWithUser) => {
            let gameIds = [];
            if (gamesWithUser.length > 0) {
                gamesWithUser.forEach((game) => {
                    gameIds.push(game.id);
                });
                // eventually we will only want to select "X"
                // amount of games else we may get too many results
                // with users that have high game count
                return getGamesByIds(gameIds).then((allGames) => {
                    let gamesObj = {};
                    allGames.forEach((game) => {
                        gamesObj[game.id] = game;
                        gamesObj[game.id].words = [];
                        gamesObj[game.id].users = [];
                    });
                    return getWordsByGameIds(gameIds).then((words) => {
                        words.forEach((word) => {
                            gamesObj[word.games_id].words.push(word);
                        });
                        return getUsersByGameIds(gameIds).then((dbusers) => {
                            let userObj = {};
                            let gamesUserids = [];
                            dbusers.forEach((dbuser) => {
                                userObj[dbuser.games_users_id] = dbuser;
                                userObj[dbuser.games_users_id].solved = [];
                                gamesUserids.push(dbuser.games_users_id);
                            });
                            return getSolvedWordsByGamesUserIds(
                                gamesUserids
                            ).then((solvedWords) => {
                                solvedWords.forEach((word) => {
                                    userObj[word.games_users_id].solved.push(
                                        word.words_id
                                    );
                                });
                                const userArray = Object.values(userObj);
                                userArray.forEach((user) => {
                                    gamesObj[user.game_id].users.push(user);
                                });
                                const gamesArray = Object.values(gamesObj);
                                return gamesArray;
                            });
                        });
                    });
                });
            } else {
                // respond with no games played yet.
                return gamesWithUser;
            }
        });
    });
}
