const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../db/prisma");

const resolvers = {
  Query: {
    // Get all notes for logged in user
    notes: async (_, __, context) => {
      if (!context.userId) {
        throw new Error("Not authenticated");
      }
      return prisma.note.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: "desc" },
      });
    },

    // Get single note
    note: async (_, { id }, context) => {
      if (!context.userId) {
        throw new Error("Not authenticated");
      }
      const note = await prisma.note.findFirst({
        where: { id, userId: context.userId },
      });
      if (!note) throw new Error("Note not found");
      return note;
    },
  },

  Mutation: {
    // Signup
    signup: async (_, { name, email, password }) => {
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      const hash = await bcrypt.hash(password, 10);
      try {
        const user = await prisma.user.create({
          data: { name, email, password: hash },
          select: { id: true, name: true, email: true },
        });
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });
        return { token, user };
      } catch (err) {
        if (err.code === "P2002") {
          throw new Error("Email already in use");
        }
        throw err;
      }
    },

    // Login
    login: async (_, { email, password }) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error("Invalid email or password");

      const match = await bcrypt.compare(password, user.password);
      if (!match) throw new Error("Invalid email or password");

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      return {
        token,
        user: { id: user.id, name: user.name, email: user.email },
      };
    },

    // Create note
    createNote: async (_, { title, content }, context) => {
      if (!context.userId) throw new Error("Not authenticated");
      return prisma.note.create({
        data: { title, content, userId: context.userId },
      });
    },

    // Update note
    updateNote: async (_, { id, title, content }, context) => {
      if (!context.userId) throw new Error("Not authenticated");
      const note = await prisma.note.findFirst({
        where: { id, userId: context.userId },
      });
      if (!note) throw new Error("Note not found");
      return prisma.note.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(content !== undefined && { content }),
        },
      });
    },

    // Delete note
    deleteNote: async (_, { id }, context) => {
      if (!context.userId) throw new Error("Not authenticated");
      const note = await prisma.note.findFirst({
        where: { id, userId: context.userId },
      });
      if (!note) throw new Error("Note not found");
      return prisma.note.delete({ where: { id } });
    },
  },

  // Field resolver — fetch user for a note
  Note: {
    user: async (parent) => {
      return prisma.user.findUnique({
        where: { id: parent.userId },
        select: { id: true, name: true, email: true },
      });
    },
    createdAt: (parent) => {
      return new Date(parent.createdAt).toISOString();
    },
    updatedAt: (parent) => {
      return new Date(parent.updatedAt).toISOString();
    },
  },
};

module.exports = resolvers;
