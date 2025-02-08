const jwt = require("jsonwebtoken");
require("dotenv").config();

function auth(req, res, next) {
  // Get token from header
  const token = req.header("Authorization")?.split(" ")[1];

  // Check if no token
  if (!token) {
    return res
      .status(401)
      .json({ error: "Authorization denied. No token provided." });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Token is not valid" });
  }
}

module.exports = auth;
