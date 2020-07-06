const db = require("../data/db-config.js");

module.exports = {
  getPuzzles,
  addPuzzle,
  addWords,
  getPuzzle,
  getWords,
};

function getPuzzles() {
  return db("puzzles");
}

function addPuzzle(data) {
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

function getPuzzle(id) {
  return db("puzzles").where("id", "=", id).first();
}

function getWords(id) {
  return db("words").where("puzzle_id", "=", id);
}
