require("dotenv").config();
const jwt = require("jsonwebtoken");
const signToken = async (id, email,account_number, res) => {
  const refreshToken = jwt.sign(
    {
      id: id,
      email: email,
      account_number:account_number
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  const accessToken = jwt.sign(
    { id, email: email, account_number: account_number },
    process.env.JWT_SECRET,
    {
      expiresIn: 60 * 1000,
    }
  );
  res.cookie("RefreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "none",
    /*     secure: "true", */
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.cookie("AccessToken", accessToken, {
    httpOnly: true,
    sameSite: "none",
    /*     secure: "true", */
    maxAge: 24 * 60 * 60 * 1000,
  });
  return { refreshToken, accessToken };
};
module.exports = signToken;
