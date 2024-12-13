const axios = require("axios");
const knex = require("../models/knex.js");
const transferFunds = require("../utils/ravenTransfer.js");
const handleWebhook = require("./webhook.controller.js");
exports.depositMoney = async (req, res) => {
  try {
    const user_id = req.user.id;
    console.log(req.user);
    const { amount } = req.body;
    if (!amount)
      return res.status(400).json({ error: "amount is a required field" });

    const numericalAmount = parseFloat(amount);
    const [user] = await knex("users").where({ id: user_id });
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
    console.log(user);
    await knex("deposits").insert({
      user_id: user_id,
      transaction_id: transaction.id,
      amount: numericalAmount,
    });

    // Update account balance
    console.log(user.balance);
    await knex("users")
      .where({ id: user_id })
      .update({ balance: parseFloat(user.balance) + numericalAmount });
    const updatedAccount = await knex("users").where({ id: user_id }).first();

    console.log("Before update:", user.balance, typeof user.balance);
    console.log("Updated account:", updatedAccount);
    handleWebhook({
      message: `Deposit of ${numericalAmount} to your account successful`,
      data: {
        account: updatedAccount.account_number,
        balance: updatedAccount.account_balance,
      },
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
  try {
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
    const userAccount = await knex("users").where({ id: user_id });
    if (!userAccount || userAccount.balance < parseFloat(amount)) {
      handleWebhook(
        `Transfer to ${account_number} failed  due to insufficient funds`
      );
      return res
        .status(400)
        .json({ error: "Insufficient balance or account not found" });
    }
    const request = await transferFunds(
      {
        amount: String(amount),
        bank_code: String(bank_code),
        bank: String(bank),
        account_number: String(account_number),
        account_name: String(account_name),
        narration: String(narration),
        reference: user_id,
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
      user_id: userAccount.id,
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
    await knex("users")
      .where({ id: userAccount.id })
      .update({
        balance: parseFloat(userAccount.balance) - parseFloat(amount),
      });
    handleWebhook(
      `New transfer to ${account_number} Successful, your new balance is ${parseFloat(
        userAccount.balance - parseFloat(amount)
      )}` /* {
      type: "transfer",
      data: request,
      status: request.status,
    } */
    );
    res
      .status(201)
      .json({ message: "Transfer successfull", response: request });
  } catch (err) {
    handleWebhook({
      message: `Transafer to account number ${account_number} failed because ${err.message}`,
    });
    await knex("transactions").insert({
      user_id,
      type: "transfer",
      amount: parseFloat(amount),
    });
    const [newTransaction] = await knex("transactions")
      .where({ user_id, amount: parseFloat(amount), type: "transfer" })
      .orderBy("id", "desc")
      .limit(1);
    console.log(newTransaction);

    await knex("transfers").insert({
      user_id: user_id,
      transaction_id: newTransaction.id,
      amount: parseFloat(amount),
      account_number: account_number.toString(),
      account_name: account_name.toString(),
      bank: bank.toString(),
      narration: narration.toString(),
      reference: String(user_id),
      status: "failed",
    });
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
    handleWebhook({
      type: "Transaction histore",
      history: groupedTransactions,
    });
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
