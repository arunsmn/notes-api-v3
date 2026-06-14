const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  // Get the token from the Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  // Extract the token - "Bearer erJhbG..." → "erJhbG..."
  const token = authHeader.split(" ")[1];

  try {
    // Verify the token using your secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user id to the request
    req.userId = decoded.userId;

    // Pass control to the next middleware or route handler
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authenticate;
