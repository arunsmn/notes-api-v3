require("dotenv").config();
const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express5");
const typeDefs = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");
const context = require("./graphql/context");
const notesRouter = require("./routes/notes");
const authRouter = require("./routes/auth");

const app = express();

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Notes API is running" });
});

// REST routes
app.use("/auth", authRouter);
app.use("/notes", notesRouter);

const startServer = async () => {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  // GraphQL route — must be before 404 handler
  app.use("/graphql", expressMiddleware(server, { context }));

  // 404 handler — after all routes
  app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong on our end" });
  });

  return app;
};

module.exports = { app, startServer };
