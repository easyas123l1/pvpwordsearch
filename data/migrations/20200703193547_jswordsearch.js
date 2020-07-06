exports.up = function (knex) {
  return knex.schema
    .createTable("users", (tbl) => {
      tbl.increments();

      tbl.string("name", 255).notNullable();

      tbl.string("imageurl", 255);

      tbl.string("email", 255);

      tbl.string("created").notNullable();

      tbl.integer("wordsFound").notNullable();
    })
    .createTable("puzzles", (tbl) => {
      tbl.increments();

      tbl.string("name", 255).notNullable().unique();

      tbl.string("code", 8000).notNullable();

      tbl.string("description", 500);

      tbl.integer("rating");
    })
    .createTable("words", (tbl) => {
      tbl.increments();

      tbl.string("word", 255).notNullable().index();

      tbl.string("position").notNullable();

      tbl.string("direction").notNullable();

      tbl
        .integer("puzzle_id")
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
    .dropTableIfExists("puzzles")
    .dropTableIfExists("users");
};
