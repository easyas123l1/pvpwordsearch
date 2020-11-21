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
        time: room.puzzle.timer,
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
                        let retObj = {
                            puzzle,
                            puzWords,
                        };
                        console.log("puzzle saved succesfully!", retObj);
                    });
                });
            });
        })
        .catch((err) => {
            console.log(err);
        });
}
