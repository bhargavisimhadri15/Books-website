import express from "express";
import Book from "../models/Book.js";
import { protect, authorOnly } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const books = await Book.find().sort({ createdAt: -1 });
  res.json(books);
});

router.get("/:id", async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });
  res.json(book);
});

router.post("/", protect, authorOnly, upload.single("coverImage"), async (req, res) => {
  try {
    const { title, subtitle, price, description, amazonLink, flipkartLink } = req.body;
    const coverImage = req.file ? `/uploads/${req.file.filename}` : "";

    const book = await Book.create({
      title,
      subtitle,
      price,
      description,
      amazonLink,
      flipkartLink,
      coverImage
    });

    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", protect, authorOnly, upload.single("coverImage"), async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const fields = ["title", "subtitle", "price", "description", "amazonLink", "flipkartLink"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) book[field] = req.body[field];
    });

    if (req.file) book.coverImage = `/uploads/${req.file.filename}`;

    const updatedBook = await book.save();
    res.json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", protect, authorOnly, async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });
  await book.deleteOne();
  res.json({ message: "Book deleted successfully" });
});

export default router;
