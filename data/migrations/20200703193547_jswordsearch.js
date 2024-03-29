exports.up = function (knex) {
    return knex.schema
        .createTable("users", (tbl) => {
            tbl.increments();

            tbl.string("email", 255).notNullable().unique();

            tbl.string("name", 255);

            tbl.string("imageurl", 255);

            tbl.integer("time_played"); //in seconds

            tbl.integer("words_solved");
        })
        .createTable("games", (tbl) => {
            tbl.increments();

            tbl.string("name", 255).notNullable();

            tbl.string("code", 8000).notNullable();

            tbl.string("description", 500).notNullable();

            tbl.integer("size").notNullable();

            tbl.integer("number_of_words").notNullable();

            tbl.integer("time").notNullable();

            tbl.integer("minimum_word_length").notNullable();

            tbl.integer("maximum_word_length").notNullable();

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
                .inTable("games")
                .onDelete("RESTRICT")
                .onUpdate("CASCADE");
        })
        .createTable("solved_words", (tbl) => {
            tbl.increments();

            tbl.integer("games_users_id")
                .unsigned()
                .references("id")
                .inTable("games_users")
                .onDelete("RESTRICT")
                .onUpdate("CASCADE");

            tbl.integer("words_id")
                .unsigned()
                .references("id")
                .inTable("words")
                .onDelete("RESTRICT")
                .onUpdate("CASCADE");
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists("solved_words")
        .dropTableIfExists("words")
        .dropTableIfExists("games_users")
        .dropTableIfExists("games")
        .dropTableIfExists("users");
};
