// controllers/notes.js
const prisma = require("../db/prisma");
const redis = require("../db/redis");

const getAllNotes = async (req, res) => {
  const cacheKey = `notes:user:${req.userId}`;
  try {
    // Step 1 - check Redis first
    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log("Cache hit");
      return res.status(200).json(JSON.parse(cached));
    }

    console.log("Cache miss");

    // Step 2 - cache miss, query PostgreSQL
    const notes = await prisma.note.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });

    // Step 3 - store in Redis with 60 seconds TTL
    await redis.set(cacheKey, JSON.stringify(notes), "EX", 60);

    res.status(200).json(notes);
  } catch (err) {
    console.error("getAllNotes error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const getNoteById = async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID — must be a number" });
  }

  try {
    const note = await prisma.note.findFirst({
      where: { id, userId: req.userId },
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.status(200).json(note);
  } catch (err) {
    console.error("getNoteById error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const createNote = async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  try {
    const note = await prisma.note.create({
      data: { title, content, userId: req.userId },
    });

    // Invalidate cache — notes list is now stale
    await redis.del(`notes:user:${req.userId}`);

    res.status(201).json(note);
  } catch (err) {
    console.error("createNote error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const updateNote = async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID — must be a number" });
  }

  const { title, content } = req.body;

  if (title === undefined && content === undefined) {
    return res
      .status(400)
      .json({ error: "Provide title or content to update" });
  }

  try {
    const note = await prisma.note.findFirst({
      where: { id, userId: req.userId },
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    const updated = await prisma.note.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
      },
    });

    // Invalidate cache — notes list is now stale
    await redis.del(`notes:user:${req.userId}`);

    res.status(200).json(updated);
  } catch (err) {
    console.error("updateNote error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const replaceNote = async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID — must be a number" });
  }

  const { title, content } = req.body;

  if (!title || !content) {
    return res
      .status(400)
      .json({ error: "Title and content are both required" });
  }

  try {
    const note = await prisma.note.findFirst({
      where: { id, userId: req.userId },
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    const replaced = await prisma.note.update({
      where: { id },
      data: { title, content },
    });

    // Invalidate cache — notes list is now stale
    await redis.del(`notes:user:${req.userId}`);

    res.status(200).json(replaced);
  } catch (err) {
    console.error("replaceNote error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const deleteNote = async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID — must be a number" });
  }

  try {
    const note = await prisma.note.findFirst({
      where: { id, userId: req.userId },
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    await prisma.note.delete({
      where: { id },
    });

    // Invalidate cache — notes list is now stale
    await redis.del(`notes:user:${req.userId}`);

    res.sendStatus(204);
  } catch (err) {
    console.error("deleteNote error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  replaceNote,
  deleteNote,
};
