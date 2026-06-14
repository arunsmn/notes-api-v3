const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../db/prisma");

const signup = async (req, res) => {
  const { name, email, password } = req.body;

  // Validate
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email and password are required" });
  }

  if (password < 6) {
    return res
      .status(400)
      .json({ error: "Password must be atleast 6 characters" });
  }

  try {
    // Hash the password - never store plain text
    const hash = await bcrypt.hash(password, 10);

    // Insert user into database
    const user = await prisma.user.create({
      data: { name, email, password: hash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    res.status(201).json({ user });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Email already in use" });
    }
    console.error("Signup error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare password against stored hash
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Sign a JWT Token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = { signup, login };
