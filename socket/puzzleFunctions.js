const { v4: uuid } = require("uuid");

const createLines = (answers, size) => {
    const newLines = [];
    for (let i = 0; size > i; i++) {
        const line = [];
        for (let i2 = 0; size > i2; i2++) {
            let letterid = "";
            let letter = "";
            letterid = `${i}, ${i2}`;
            for (let answer of answers) {
                if (answer.position === letterid) {
                    letter = answer.character;
                }
            }
            if (letter === "") {
                letter = randomLetter();
            }
            const newLetter = {
                text: letter,
                id: letterid,
                circle: "",
                first: "",
                color: "",
                hover: "",
            };
            line.push(newLetter);
            if (i2 + 1 === size) {
                const newLine = {
                    text: line,
                    id: uuid(),
                };
                newLines.push(newLine);
            }
        }
    }
    return newLines;
};

// selects a random letter
const randomLetter = () => {
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    return possible.charAt(Math.floor(Math.random() * possible.length));
};

const placeWords = (words, size) => {
    let coordinates = [];

    for (let word of words) {
        let attempts = 0;
        let possiblePlacement = true;
        let triedPositions = [];
        do {
            attempts++;
            const maxTries = size * size;
            if (triedPositions.length === maxTries) {
                return [];
            }

            const randomPosition = randomChecker(triedPositions, size);

            const directions = testDirections(word, randomPosition, size);
            const [
                directUp,
                directLeft,
                directDown,
                directRight,
                row,
                column,
            ] = directions;
            if (!directUp && !directLeft && !directDown && !directRight) {
                possiblePlacement = false;
            } else {
                const directUpLeft = testDiagonal(directUp, directLeft);
                const directUpRight = testDiagonal(directUp, directRight);
                const directDownRight = testDiagonal(directDown, directRight);
                const directDownLeft = testDiagonal(directDown, directLeft);

                const objUp = {
                    direction: "Up",
                    possible: directUp,
                };
                const objUpRight = {
                    direction: "UpRight",
                    possible: directUpRight,
                };
                const objRight = {
                    direction: "Right",
                    possible: directRight,
                };
                const objDownRight = {
                    direction: "DownRight",
                    possible: directDownRight,
                };
                const objDown = {
                    direction: "Down",
                    possible: directDown,
                };
                const objDownLeft = {
                    direction: "DownLeft",
                    possible: directDownLeft,
                };
                const objLeft = {
                    direction: "Left",
                    possible: directLeft,
                };
                const objUpLeft = {
                    direction: "UpLeft",
                    possible: directUpLeft,
                };

                const possibleDirections = [
                    objUp,
                    objUpRight,
                    objRight,
                    objDownRight,
                    objDown,
                    objDownLeft,
                    objLeft,
                    objUpLeft,
                ];
                let newPossibleDirections = [];

                for (let possibleDirection of possibleDirections) {
                    if (possibleDirection.possible) {
                        newPossibleDirections.push(possibleDirection);
                    }
                }

                let tryThis = false;

                while (newPossibleDirections.length > 0 && !tryThis) {
                    const randomDirection = Math.floor(
                        Math.random() * newPossibleDirections.length
                    );
                    const tryDirection = newPossibleDirections[randomDirection];
                    let wordPossibleCoordinates = [];
                    let wordPossible = true;
                    if (tryDirection.direction === "Up") {
                        wordPossibleCoordinates = goUp(word, row, column);
                    } else if (tryDirection.direction === "UpRight") {
                        wordPossibleCoordinates = goUpRight(word, row, column);
                    } else if (tryDirection.direction === "Right") {
                        wordPossibleCoordinates = goRight(word, row, column);
                    } else if (tryDirection.direction === "DownRight") {
                        wordPossibleCoordinates = goDownRight(
                            word,
                            row,
                            column
                        );
                    } else if (tryDirection.direction === "Down") {
                        wordPossibleCoordinates = goDown(word, row, column);
                    } else if (tryDirection.direction === "DownLeft") {
                        wordPossibleCoordinates = goDownLeft(word, row, column);
                    } else if (tryDirection.direction === "Left") {
                        wordPossibleCoordinates = goLeft(word, row, column);
                    } else {
                        wordPossibleCoordinates = goUpLeft(word, row, column);
                    }
                    if (word === "0") {
                        coordinates = wordPossibleCoordinates;
                        tryThis = true;
                    } else {
                        for (let coordinate of coordinates) {
                            if (!wordPossible) {
                                break;
                            }
                            for (let possibleCoordinate of wordPossibleCoordinates) {
                                if (
                                    coordinate.position ===
                                        possibleCoordinate.position &&
                                    coordinate.character !==
                                        possibleCoordinate.character
                                ) {
                                    if (newPossibleDirections.length === 1) {
                                        newPossibleDirections = [];
                                        wordPossible = false;
                                    } else {
                                        newPossibleDirections = newPossibleDirections.slice(
                                            randomDirection,
                                            1
                                        );
                                        wordPossible = false;
                                        break;
                                    }
                                }
                            }
                        }
                        if (wordPossible) {
                            coordinates = coordinates.concat(
                                wordPossibleCoordinates
                            );
                            tryThis = true;
                            possiblePlacement = true;
                            break;
                        }
                    }
                    if (newPossibleDirections.length === 0) {
                        possiblePlacement = false;
                    }
                }
            }
            if (attempts === 80 && !possiblePlacement) {
                return [];
            }
            if (!possiblePlacement) {
                triedPositions.push(randomPosition);
            }
        } while (attempts < 80 && !possiblePlacement);
    }
    return coordinates;
};

// test which directions a word can go.
const testDirections = (word, position, size) => {
    // function test the four directions up right down and left.
    let length = word.length - 1;
    let newPosition = position.replace(",", "");
    newPosition = newPosition.split(" ");
    let row = newPosition[0];
    let column = newPosition[1];
    row = +row;
    column = +column;
    let up = true;
    let left = true;
    let down = true;
    let right = true;
    if (column - length < 0) {
        up = false;
    }
    if (row - length < 0) {
        left = false;
    }
    if (column + length > size - 1) {
        down = false;
    }
    if (row + length > size - 1) {
        right = false;
    }
    return [up, left, down, right, row, column];
};

// test diagonal directions
const testDiagonal = (d1, d2) => {
    // test direction1 and direction2
    if (d1 && d2) {
        return true;
    }
    return false;
};

// create position character object
const logPosition = (row, column, character) => {
    let position = `${row}, ${column}`;
    const newCharacter = {
        position: position,
        character: character,
    };
    return newCharacter;
};

// this is for words that go up
const goUp = (word, row, column) => {
    let coordinates = [];
    for (let i = 0; i < word.length; i++) {
        let position = logPosition(row, column, word.charAt(i));
        coordinates.push(position);
        column--;
    }
    return coordinates;
};

// this is for words that go up and right
const goUpRight = (word, row, column) => {
    let coordinates = [];
    for (let i = 0; i < word.length; i++) {
        let position = logPosition(row, column, word.charAt(i));
        coordinates.push(position);
        column--;
        row++;
    }
    return coordinates;
};

// this is for words that go right
const goRight = (word, row, column) => {
    let coordinates = [];
    for (let i = 0; i < word.length; i++) {
        let position = logPosition(row, column, word.charAt(i));
        coordinates.push(position);
        row++;
    }
    return coordinates;
};

// this is for words that go down and right
const goDownRight = (word, row, column) => {
    let coordinates = [];
    for (let i = 0; i < word.length; i++) {
        let position = logPosition(row, column, word.charAt(i));
        coordinates.push(position);
        row++;
        column++;
    }
    return coordinates;
};

// this is for words that go down
const goDown = (word, row, column) => {
    let coordinates = [];
    for (let i = 0; i < word.length; i++) {
        let position = logPosition(row, column, word.charAt(i));
        coordinates.push(position);
        column++;
    }
    return coordinates;
};

// this is for words that go down and left
const goDownLeft = (word, row, column) => {
    let coordinates = [];
    for (let i = 0; i < word.length; i++) {
        let position = logPosition(row, column, word.charAt(i));
        coordinates.push(position);
        column++;
        row--;
    }
    return coordinates;
};

// this is for words that go left
const goLeft = (word, row, column) => {
    let coordinates = [];
    for (let i = 0; i < word.length; i++) {
        let position = logPosition(row, column, word.charAt(i));
        coordinates.push(position);
        row--;
    }
    return coordinates;
};

// this is for words that go up and left
const goUpLeft = (word, row, column) => {
    let coordinates = [];
    for (let i = 0; i < word.length; i++) {
        let position = logPosition(row, column, word.charAt(i));
        coordinates.push(position);
        column--;
        row--;
    }
    return coordinates;
};

// this checks to see if the random position has been tried
const randomChecker = (tried, size) => {
    let newPosition = false;
    while (!newPosition) {
        const newRandomPosition = randomPosition(size);
        newPosition = true;
        for (let index of tried) {
            if (newRandomPosition === index) {
                newPosition = false;
            }
        }
        if (newPosition) {
            return newRandomPosition;
        }
    }
};

const randomPosition = (size) => {
    let position1 = Math.floor(Math.random() * size);
    let position2 = Math.floor(Math.random() * size);

    return `${position1}, ${position2}`;
};

// the function thats turning the data into variables the database can understand and save.
const wordPositionDirection = (words, answers) => {
    let index = 0;
    let final = [];
    for (let word of words) {
        let dir = "";
        let first = answers[index].position;
        let second = answers[index + 1].position;
        let firstPos = first.replace(",", "").split(" ");
        let secondPos = second.replace(",", "").split(" ");
        if (+firstPos[0] === +secondPos[0]) {
            if (+firstPos[1] > +secondPos[1]) {
                dir = "Up";
            } else {
                dir = "Down";
            }
        }
        if (+firstPos[0] > +secondPos[0]) {
            if (+firstPos[1] > +secondPos[1]) {
                dir = "UpLeft";
            } else if (+firstPos[1] === +secondPos[1]) {
                dir = "Left";
            } else {
                dir = "DownLeft";
            }
        }
        if (+firstPos[0] < +secondPos[0]) {
            if (+firstPos[1] > +secondPos[1]) {
                dir = "UpRight";
            } else if (+firstPos[1] === +secondPos[1]) {
                dir = "Right";
            } else {
                dir = "DownRight";
            }
        }
        const newObj = {
            word: word,
            position: answers[index].position,
            direction: dir,
            solved: false,
            id: uuid(),
            color: "",
        };
        final.push(newObj);
        index += word.length;
    }
    return final;
};

module.exports = {
    placeWords,
    createLines,
    wordPositionDirection,
};
