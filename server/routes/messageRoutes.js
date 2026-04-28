import express from "express";
import Message from "../models/Message.js";
import { protect, authorOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const saved = await Message.create({ name, email, message });
    res.status(201).json({ message: "Message sent successfully", data: saved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", protect, authorOnly, async (req, res) => {
  const messages = await Message.find().sort({ createdAt: -1 });
  res.json(messages);
});

router.delete("/:id", protect, authorOnly, async (req, res) => {
  const msg = await Message.findById(req.params.id);
  if (!msg) return res.status(404).json({ message: "Message not found" });
  await msg.deleteOne();
  res.json({ message: "Message deleted" });
});

export default router;
