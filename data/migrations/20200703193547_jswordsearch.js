const { table } = require("../db-config");

exports.up = function (knex) {
    return knex.schema
        .createTable("users", (tbl) => {
            tbl.increments();

            tbl.string("email", 255).notNullable().unique();

            tbl.string("name", 255);

            tbl.string("imageurl", 255);
        })
        .createTable("games", (tbl) => {
            tbl.increments();

            tbl.string("name", 255).notNullable().unique();

            tbl.string("code", 8000).notNullable();

            tbl.string("description", 500);

            tbl.integer("rating");
        })
        .createTable("games_users", (tbl) => {
            tbl.increments();

            tbl.integer("user_id")
                .unsigned()
                .references("id")
                .inTable("users")
                .onDelete("RESTRICT")
                .onUpdate("CASCADE");

            tbl.integer("game_id")
                .unsigned()
                .references("id")
                .inTable("games")
                .onDelete("RESTRICT")
                .onUpdate("CASCADE");
        })
        .createTable("words", (tbl) => {
            tbl.increments();

            tbl.string("word", 255).notNullable().index();

            tbl.string("position").notNullable();

            tbl.string("direction").notNullable();

            tbl.integer("games_id")
                .unsigned()
                .references("id")
                .inTable("puzzles")
                .onDelete("RESTRICT")
                .onUpdate("CASCADE");
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists("words")
        .dropTableIfExists("games_users")
        .dropTableIfExists("games")
        .dropTableIfExists("users");
};
