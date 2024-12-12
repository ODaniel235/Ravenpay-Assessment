const knex = require("../models/knex.js");
const crypto = require("crypto");
exports.createBankAccount = async (req, res) => {
  try {
    const user_id = req.user.id;
    const account_number = crypto.randomBytes(8).toString("hex");
    await knex("accounts").insert({
      user_id,
      account_number,
    });
    res
      .status(201)
      .json({ message: "Account created successfully", account_number });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
