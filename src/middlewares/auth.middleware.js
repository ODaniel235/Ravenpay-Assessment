const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const { RefreshToken, AccessToken } = req.cookies;
    if (!RefreshToken)
      return res
        .status(401)
        .json({ error: "Session expired, sign in to continue" });
    if (AccessToken) {
      const decoded = jwt.verify(AccessToken, process.env.JWT_SECRET);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      req.user = decoded;
      console.log(decoded);
      next();
    } else {
      const decoded = jwt.verify(RefreshToken, process.env.JWT_SECRET);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const accessToken = jwt.sign(
        {
          id: decoded.id,
          email: decoded.email,
          account_number: decoded.account_number,
        },
        process.env.JWTSECRET,
        { expiresIn: 60 * 1000 }
      );
      res.cookie("AccessToken", accessToken, {
        httpOnly: true,
        sameSite: "none",
        /*     secure: "true", */
        maxAge: 60 * 1000,
      });
      req.user = decoded;
      console.log(decoded);
      next();
    }
  } catch (error) {
    res.status(403).json({ error: "Invalid token" });
  }
};
