const axios = require("axios");
const qs = require("qs");
const handleWebhook = require("../controllers/webhook.controller");

const transferFunds = async (transferData, res) => {
  try {
    // Incase i forget to stringify the data and return here
    const data = qs.stringify({
      amount: transferData.amount,
      bank_code: transferData.bank_code,
      bank: transferData.bank,
      account_number: transferData.account_number,
      account_name: transferData.account_name,
      narration: transferData.narration,
      reference: transferData.reference,
      currency: "NGN",
    });

    const config = {
      method: "post",
      url: "https://integrations.getravenbank.com/v1/transfers/create",
      headers: {
        Authorization: `Bearer ${process.env.RAVEN_API_KEY}`,
      },
      data: data,
    };

    // Make the POST request
    const response = await axios(config);
    console.log(JSON.stringify(response.data));
    if (!response.ok) {
      return res.status(400).json({ error: response });
    }
    return response.data; //Returns the response
  } catch (error) {
    const errorMsg = error.response.data.message || error.message;

    handleWebhook(
      `Transfer to ${transferData.account_number} failed due to ${errorMsg}`
    );
    console.error(
      "Error occurred during transfer:",
      error.response.data.message
    );
    return res.status(401).json({ error: errorMsg });
  }
};
module.exports = transferFunds;
