const { table } = require("../models/knex");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("deposits", (table) => {
    table.increments("id").primary();
    table
      .integer("account_id")
      .unsigned()
      .references("id")
      .inTable("accounts")
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
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("deposits");
};
