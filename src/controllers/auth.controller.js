const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const knex = require("../../knexfile");
exports.signup = async (req, res) => {
  try {
    const { password, email } = req.body;
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
    const hashedPassword = await bcrypt.hash(password, 12);
    const userData = await knex("users").insert({
      email,
      password: hashedPassword,
    });
    res.status(200).json({ message: "Account created successfully", userData });
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
    const credentialsValid = await bcrypt.compare(password, user.password);
    if (!user || !credentialsValid)
      return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.status(200).json({ message: "Logged in successfully", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
