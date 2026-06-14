const { gql } = require("graphql-tag");

const typeDefs = gql`
  type User {
    id: Int
    name: String
    email: String
  }

  type Note {
    id: Int
    title: String
    content: String
    userId: Int
    createdAt: String
    updatedAt: String
    user: User
  }

  type AuthPayload {
    token: String
    user: User
  }

  type Query {
    notes: [Note]
    note(id: Int!): Note
  }

  type Mutation {
    signup(name: String!, email: String!, password: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload
    createNote(title: String!, content: String!): Note
    updateNote(id: Int!, title: String, content: String): Note
    deleteNote(id: Int!): Note
  }
`;

module.exports = typeDefs;
