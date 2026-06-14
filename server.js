const { startServer } = require("./app");

const PORT = process.env.PORT || 3000;

startServer().then((app) => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
});
