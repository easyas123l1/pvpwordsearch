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
            for (let word of words) {
                word.game_id = gameid;
            }
            Puzzles.addWords(words).then((_) => {
                Puzzles.getGame(id).then((puzzle) => {
                    Puzzles.getWords(id).then((puzWords) => {
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
