const express = require("express");
const {
  transferMoney,
  getTransactionHistory,
  retrieveBankCodes,
  depositMoney,
} = require("../controllers/transaction.controller.js");
const authMiddleware = require("../middlewares/auth.middleware.js");

const router = express.Router();

/* router.post("/transfer", authMiddleware, transferMoney); */
router.post("/transfer", authMiddleware, transferMoney);
router.post("/deposit", authMiddleware, depositMoney);
router.get("/history", authMiddleware, getTransactionHistory);
router.get("/banks", retrieveBankCodes);
module.exports = router;
