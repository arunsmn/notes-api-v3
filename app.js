require("dotenv").config();
const express = require("express");
const notesRouter = require("./routes/notes");
const authRouter = require("./routes/auth");

const app = express();

// Middleware — tells Express to parse JSON request bodies
app.use(express.json());

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Notes API is running" });
});

app.use("/auth", authRouter);
app.use("/notes", notesRouter);

// 404 handler — catches requests to routes that don't exist
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// Global error handler — catches anything that breaks unexpectedly
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong on our end" });
});

module.exports = app;
