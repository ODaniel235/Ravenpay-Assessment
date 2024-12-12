const axios = require("axios");
const handleWebhook = async (webhookData) => {
  try {
    const response = await axios.post(process.env.WEBHOOK_URL, webhookData);
    if (response.ok) {
      console.log("Webhook sent successfully", response.data);
    } else {
      console.log(response.data);
    }
  } catch (error) {
    console.log("Error sending webhook", error);
  }
};
module.exports = handleWebhook;
