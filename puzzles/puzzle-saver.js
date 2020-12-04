const Puzzles = require("./puzzle-model.js");

module.exports = {
    savePuzzle,
};

/**
 * Will save the puzzle and the game state to database.
 * @param room A object that represents a room from the `rooms` instance variable object in socket
 */
function savePuzzle(room) {
    let words = room.puzzle.wordsDir;
    let description = "";
    let saveGame = {
        name: room.name,
        code: room.puzzle.puzzle,
        description,
        size: room.puzzle.size,
        number_of_words: room.puzzle.numberOfWords,
        time: room.puzzle.originalTime,
        minimum_word_length: room.puzzle.minimumWordSize,
        maximum_word_length: room.puzzle.maximumWordSize,
    };
    Puzzles.addGame(saveGame)
        .then((gameid) => {
            const saveWords = [];
            for (let word of words) {
                const saveWord = {
                    word: word.word,
                    position: word.position,
                    direction: word.direction,
                    games_id: gameid,
                };
                saveWords.push(saveWord);
            }
            Puzzles.addWords(saveWords).then((_) => {
                Puzzles.getGame(gameid).then((puzzle) => {
                    Puzzles.getWords(gameid).then((puzWords) => {
                        // let retObj = {
                        //     puzzle,
                        //     puzWords,
                        // };
                        const wordIdPair = {};
                        puzWords.map((puzWord) => {
                            wordIdPair[puzWord.word] = puzWord.id;
                        });
                        let usersEmails = [];
                        room.players.map((player) => {
                            usersEmails.push(player.email);
                        });
                        Puzzles.getUsersByEmails(usersEmails).then(
                            (usersDB) => {
                                const userEmailDBIdPair = {};
                                const userDBIdEmailPair = {};
                                usersDB.map((user) => {
                                    userEmailDBIdPair[user.email] = user.id;
                                    userDBIdEmailPair[user.id] = user.email;
                                });
                                let saveGamesToUsers = [];
                                room.players.map((player) => {
                                    let dbUserId =
                                        userEmailDBIdPair[player.email];
                                    const saveGameToUser = {
                                        user_id: dbUserId,
                                        game_id: gameid,
                                    };
                                    saveGamesToUsers.push(saveGameToUser);
                                });
                                Puzzles.addGamesToUsers(
                                    saveGamesToUsers,
                                    gameid
                                ).then((dbGamesToUsers) => {
                                    console.log(dbGamesToUsers);
                                    let saveSolvedWords = [];
                                    let gamesUserIds = [];
                                    for (
                                        i = 0;
                                        i < dbGamesToUsers.length;
                                        i++
                                    ) {
                                        gamesUserIds.push(dbGamesToUsers[i].id);
                                        room.players[i].wordsDir.map(
                                            (wordObj) => {
                                                if (wordObj.solved) {
                                                    let gameUserId =
                                                        dbGamesToUsers[i].id;
                                                    let wordId =
                                                        wordIdPair[
                                                            wordObj.word
                                                        ];
                                                    const saveSolvedWord = {
                                                        games_users_id: gameUserId,
                                                        words_id: wordId,
                                                    };
                                                    saveSolvedWords.push(
                                                        saveSolvedWord
                                                    );
                                                }
                                            }
                                        );
                                    }
                                    if (saveSolvedWords.length > 0) {
                                        Puzzles.addSolvedWords(
                                            saveSolvedWords,
                                            gamesUserIds
                                        )
                                            .then((solvedWordsHope) => {
                                                console.log(solvedWordsHope);
                                            })
                                            .catch((err) => {
                                                console.log(err);
                                            });
                                    } else {
                                        console.log("no words solved!");
                                    }
                                });
                            }
                        );
                    });
                });
            });
        })
        .catch((err) => {
            console.log(err);
        });
}
