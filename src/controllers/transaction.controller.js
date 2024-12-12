const axios = require("axios");
const knex = require("../models/knex.js");
const transferFunds = require("../utils/ravenTransfer.js");
const handleWebhook = require("./webhook.controller.js");
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
    await handleWebhook({
      type: "deposit",
      account: updatedAccount.account_number,
      amount,
    });
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
      !amount ||
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
    console.log(req.body);
    //Fetching account
    const userAccount = await knex("accounts").where({ user_id });
    if (!userAccount || userAccount.balance < parseFloat(amount))
      return res
        .status(400)
        .json({ error: "Insufficient balance or account not found" });

    const request = await transferFunds(
      {
        amount: String(amount),
        bank_code: String(bank_code),
        bank: String(bank),
        account_number: String(account_number),
        account_name: String(account_name),
        narration: String(narration),
        reference: String(reference) || user_id,
      },
      res
    );
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
    await handleWebhook({
      type: "transfer",
      data: request,
      status: request.status,
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
      .where("user_id", userId)
      .select("*")
      .orderBy("id", "desc"); // Ordering by the id

    // Grouping transactions by type
    const groupedTransactions = transactions.reduce((acc, transaction) => {
      if (!acc[transaction.type]) {
        acc[transaction.type] = [];
      }
      acc[transaction.type].push(transaction);
      return acc;
    }, {});
    await handleWebhook(groupedTransactions);
    res.status(200).json({ groupedTransactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Using this to retrieve all bank codes for test case incase i forget
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
