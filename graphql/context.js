const jwt = require("jsonwebtoken");

const context = async ({ req }) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { userId: null };
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { userId: decoded.userId };
  } catch (err) {
    return { userId: null };
  }
};

module.exports = context;
