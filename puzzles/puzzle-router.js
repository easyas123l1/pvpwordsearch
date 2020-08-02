const router = require("express").Router();

const Puzzles = require("./puzzle-model.js");

// get all puzzles
router.get("/", (req, res) => {
  Puzzles.getPuzzles()
    .then((puzzles) => {
      res.status(200).json(puzzles);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Failed to get puzzles" });
    });
});

// get puzzle by id
router.get("/:id", (req, res) => {
  const id = req.params.id;
  Puzzles.getPuzzle(id)
    .then((puzzle) => {
      Puzzles.getWords(id).then((words) => {
        let retObj = {
          puzzle,
          words,
        };
        res.status(200).json(retObj);
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Failed to get puzzle" });
    });
});

// add puzzle and words
router.post("/", async (req, res) => {
  let { name, code, description, words } = req.body;
  let newObj = {
    name,
    code,
    description,
  };
  Puzzles.addPuzzle(newObj)
    .then((id) => {
      for (let word of words) {
        word.puzzle_id = id;
      }
      Puzzles.addWords(words).then((now) => {
        Puzzles.getPuzzle(id).then((puzzle) => {
          Puzzles.getWords(id).then((puzWords) => {
            let retObj = {
              puzzle,
              puzWords,
            };
            res.status(201).json(retObj);
          });
        });
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Failed to add puzzle" });
    });
});

module.exports = router;
