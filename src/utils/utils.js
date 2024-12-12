require("dotenv").config();
const jwt = require("jsonwebtoken");
const signToken = async (id, email, res) => {
  const refreshToken = jwt.sign(
    {
      id: id,
      email: email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  const accessToken = jwt.sign({ id, email: email }, process.env.JWT_SECRET, {
    expiresIn: 60 * 1000,
  });
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
