const router = require("express").Router();

const Puzzles = require("./puzzle-model.js");

// user first login if exist in db find id else create user in db and get id
router.post("/user", (req, res) => {
    let { email } = req.body;
    Puzzles.getUserByEmail(email)
        .then((user) => {
            if (user) {
                if (user.name) {
                    res.status(200).json(user);
                } else {
                    res.status(201).json({
                        newAccount: "create new account please enter name.",
                    });
                }
            } else {
                let newUser = {
                    email,
                    name: "",
                    imageurl: "",
                    time_played: 0,
                    words_solved: 0,
                };
                Puzzles.addUser(newUser)
                    .then((dbuser) => {
                        res.status(201).json({
                            newAccount: "create new account please enter name.",
                            dbuser,
                        });
                    })
                    .catch((err) => {
                        console.log(err);
                        res.status(201).json({
                            message: "duplicate creations attempted",
                        });
                    });
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ message: "failed on user." });
        });
});

// update users info by email.
router.put("/user", (req, res) => {
    let { email, name } = req.body;
    const updateUser = {
        email,
        name,
    };
    Puzzles.updateUserByEmail(email, updateUser)
        .then((user) => {
            res.status(200).json(user);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ message: "failed to update user." });
        });
});

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

// get users match history
router.post("/user/history", (req, res) => {
    let { email } = req.body;
    Puzzles.getUserHistory(email)
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
