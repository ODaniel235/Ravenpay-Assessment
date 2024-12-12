const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const knex = require("../models/knex.js");
const signToken = require("../utils/utils.js");
exports.signup = async (req, res) => {
  try {
    const { password, email } = req.body;
    console.log(knex);
    console.log(req.body);
    if (!password || !email)
      return res
        .status(400)
        .json({ error: "email and password are required fields" });
    //Check if user with either credentials exists
    const userExists = await knex("users").where({ email }).first();
    if (userExists)
      return res
        .status(400)
        .json({ error: "Email is already linked to an account" });
    const hashedPassword = await bcrypt.hash(password, 12); //Hashing password before saving to database
    await knex("users").insert({
      email,
      password: hashedPassword,
    });
    res.status(201).json({
      message: "Account created successfully",
      userData: { email, password: hashedPassword },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ error: "email and password are required fields" });
    const user = await knex("users").where({ email }).first();
    const credentialsValid = await bcrypt.compare(password, user.password); //Comparing hashed password with inputted password
    if (!user || !credentialsValid)
      return res.status(401).json({ error: "Invalid credentials" });

    const tokens = await signToken(user.id, user.email, res);
    res.status(200).json({ message: "Logged in successfully", tokens });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};