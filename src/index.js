require("dotenv").config();

const express = require("express");
const authRoutes = require("./routes/auth.route.js");
const transactionRoutes = require("./routes/transaction.route.js");
const cookieParser = require("cookie-parser");
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/transaction", transactionRoutes);
PORT = 8000;
app.listen(PORT, () => {
  console.log(`Listening to PORT:${PORT}`);
});
