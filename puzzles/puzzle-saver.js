const Puzzles = require("./puzzle-model.js");

module.exports = {
    savePuzzle,
};

/**
 * Will solve a word and update users wordsDir lines and word score.
 * @param room A object that represents a room from the `rooms` instance variable object in socket
 */
function savePuzzle(room) {
    let words = room.puzzle.wordsDir;
    let name = room.name;
    let code = room.puzzle.puzzle;
    let description = "";
    // let { name, code, description, words } =
    let newObj = {
        name,
        code,
        description,
    };
    Puzzles.addGames(newObj)
        .then((id) => {
            for (let word of words) {
                word.puzzle_id = id;
            }
            Puzzles.addWords(words).then((_) => {
                Puzzles.getPuzzle(id).then((puzzle) => {
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
