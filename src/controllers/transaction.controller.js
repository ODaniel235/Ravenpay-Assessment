const axios = require("axios");
const knex = require("../models/knex.js");
const transferFunds = require("../utils/ravenTransfer.js");
exports.depositMoney = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { account_number, amount } = req.body;
    if (!account_number || !amount)
      return res
        .status(400)
        .json({ error: "account_number and amount are required fields" });

    const numericalAmount = parseFloat(amount);
    const account = await knex("accounts").where({ account_number }).first();
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Insert into transactions and get the transaction id
    await knex("transactions").insert({
      user_id,
      type: "deposit",
      amount: numericalAmount,
    });
    // Get the last inserted transaction id
    const [transaction] = await knex("transactions")
      .where({ user_id, amount: numericalAmount, type: "deposit" })
      .orderBy("id", "desc")
      .limit(1);

    console.log(transaction);
    // Insert into deposit table
    await knex("deposits").insert({
      account_id: account.id,
      transaction_id: transaction.id,
      amount: numericalAmount,
    });

    // Update account balance
    await knex("accounts")
      .where({ id: account.id })
      .update({ balance: parseFloat(account.balance) + numericalAmount });

    const updatedAccount = await knex("accounts")
      .where({ id: account.id })
      .first();

    console.log("Before update:", account.balance, typeof account.balance);
    console.log("Updated account:", updatedAccount);

    res.status(201).json({
      message: "Deposit handled successfully",
      data: {
        account: updatedAccount.account_number,
        updatedBalance: updatedAccount.balance,
      },
    });
  } catch (err) {
    console.error(err); // Log the error for better debugging
    res.status(500).json({ error: err.message });
  }
};
exports.transferMoney = async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      amount,
      account_number,
      bank,
      account_name,
      narration,
      reference,
      bank_code,
    } = req.body;
    if (
      amount ||
      !account_number ||
      !bank ||
      !account_name ||
      !narration ||
      !bank_code
    ) {
      return res.status(400).json({
        error:
          "amount, account_number, bank_code, bank, account_name, narration are required fields",
      });
    }
    console.log(r)
    //Fetching account
    const userAccount = await knex("accounts").where({ user_id });
    if (!userAccount || userAccount.balance < parseFloat(amount))
      return res
        .status(400)
        .json({ error: "Insufficient balance or account not found" });

    const request = await transferFunds({
      amount: amount.toString(),
      bank_code: bank_code,
      bank: bank.toString(),
      account_number: account_number.toString(),
      account_name: account_name.toString(),
      narration: narration.toString(),
      reference: reference.toString() || user_id,
    });
    //Create a transaction model for the transaction
    await knex("transactions").insert({
      user_id,
      type: "transfer",
      amount: parseFloat(amount),
    });
    // Get the last inserted transaction id
    const [transaction] = await knex("transactions")
      .where({ user_id, amount: parseFloat(amount), type: "transfer" })
      .orderBy("id", "desc")
      .limit(1);

    console.log(transaction);
    //Creating a new transfer model and making sure everything is converted to the right data type
    await knex("transfers").insert({
      account_id: userAccount.id,
      transaction_id: transaction.id,
      amount: parseFloat(amount),
      account_number: account_number.toString(),
      account_name: account_name.toString(),
      bank: bank.toString(),
      narration: narration.toString(),
      reference: reference.toString(),
      status: request.status,
    });
    //Deducting amount
    await knex("accounts")
      .where({ id: userAccount.id })
      .update({
        balance: parseFloat(userAccount.balance) - parseFloat(amount),
      });
    res
      .status(201)
      .json({ message: "Transfer successfull", response: request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    // Fetch all transactions with type and account info
    const transactions = await knex("transactions")
      .join("accounts", "transactions.account_id", "accounts.id")
      .where("accounts.user_id", userId)
      .select("transactions.*")
      .orderBy("transactions.created_at", "desc"); // Ordering by date

    // Grouping transactions by type here
    const groupedTransactions = transactions.reduce((acc, transaction) => {
      // Checking if transaction type already exists in accumulator
      if (!acc[transaction.type]) {
        acc[transaction.type] = [];
      }
      // Pushing transactions to their types
      acc[transaction.type].push(transaction);
      return acc;
    }, {});

    res.status(200).json({ groupedTransactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Using this to retrieve all bank codes for test case
exports.retrieveBankCodes = async (req, res) => {
  try {
    const response = await axios.get(
      "https://integrations.getravenbank.com/v1/banks",
      { headers: { Authorization: `Bearer ${process.env.RAVEN_API_KEY}` } }
    );
    res.status(200).json({ response: response.data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
