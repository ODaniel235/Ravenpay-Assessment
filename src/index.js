require("dotenv").config();

const express = require("express");
const authRoutes = require("./routes/auth.route.js");
const transactionRoutes = require("./routes/transaction.route.js");
const accountRoutes = require("./routes/accounts.route.js");
const cookieParser = require("cookie-parser");
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/transaction", transactionRoutes); /* 
app.use("/api/webhook", webhookRoutes); */
app.use("/api/accounts", accountRoutes);
PORT = 8000;
app.listen(PORT, () => {
  console.log(`Listening to PORT:${PORT}`);
});
