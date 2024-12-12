const express = require("express");
const { createBankAccount } = require("../controllers/account.controller.js");
const authMiddleware = require("../middlewares/auth.middleware.js");

const router = express.Router();

router.post("/create", authMiddleware, createBankAccount);

module.exports = router;
