const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");

const {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  replaceNote,
  deleteNote,
} = require("../controllers/notes");

// All notes routes are protected
router.use(authenticate);

router.get("/", getAllNotes);
router.get("/:id", getNoteById);
router.post("/", createNote);
router.put("/:id", replaceNote);
router.patch("/:id", updateNote);
router.delete("/:id", deleteNote);

module.exports = router;
