const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const session = require("express-session");
const KnexSessionStore = require("connect-session-knex")(session);

const PuzzleRouter = require("./puzzles/puzzle-router.js");

const knex = require("./data/db-config");
const server = express();

const sessionConfig = {
  name: "secret", //sid
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false, //GDPR laws against setting cookies automatically
  resave: false,
  store: new KnexSessionStore({
    knex,
    createtable: true,
    clearInterval: 1000 * 60 * 10, //10 minutes
    sidfieldname: "sid",
    tablename: "sessions",
  }),
  cookie: {
    maxAge: 1000 * 30,
    secure: false, // true in production!
    httpOnly: true,
  },
};

server.use(express.json());
server.use(helmet());
server.use(cors());
server.use(morgan("dev"));
server.use(session(sessionConfig));

server.use("/puzzle", PuzzleRouter);

// server sanity check
server.use("/", (req, res) => {
  res.status(200).json("server is running!");
});

// error handling middleware
server.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status).json(err.message);
});

module.exports = server;
