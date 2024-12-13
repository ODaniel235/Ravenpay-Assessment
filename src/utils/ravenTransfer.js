const axios = require("axios");
const qs = require("qs");
const handleWebhook = require("../controllers/webhook.controller");

const transferFunds = async (transferData) => {
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
      throw new Error(response.data);
    }
    return response.data; //Returns the response
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error(errorMsg);

    throw new Error(errorMsg);
  }
};
module.exports = transferFunds;
