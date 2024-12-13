/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("transfers", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .references("id")
      .inTable("users")
      .notNullable()
      .onDelete("CASCADE");
    table
      .integer("transaction_id")
      .unsigned()
      .references("id")
      .inTable("transactions")
      .notNullable()
      .onDelete("CASCADE");
    table.decimal("amount", 14, 2).notNullable();
    table.string("account_number").nullable();
    table.string("bank").notNullable();
    table.string("account_name").notNullable();
    table.string("narration").notNullable();
    table.string("reference").notNullable();
    table.string("status").notNullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("transfers");
};
