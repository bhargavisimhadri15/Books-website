import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();

// ✅ CORS FIX (VERY IMPORTANT)
const normalizeOrigin = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const withoutSlash = trimmed.replace(/\/$/, "");

  // If user sets just the domain (common in dashboards), assume https.
  if (!/^https?:\/\//i.test(withoutSlash)) return `https://${withoutSlash}`;

  return withoutSlash;
};

const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((value) => normalizeOrigin(value.trim()))
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (no Origin header), like curl/Postman.
    if (!origin) return callback(null, true);

    // If no allow-list configured, allow all origins.
    if (allowedOrigins.length === 0) return callback(null, true);

    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true);

    // Don't throw (which becomes a 500 and breaks preflight); just disallow.
    // The browser will block the request due to missing CORS headers.
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
// Express 5 + path-to-regexp v6 does not accept "*" as a path pattern.
// Use a RegExp to cover all OPTIONS preflight requests.
app.options(/.*/, cors(corsOptions));

app.use(express.json());

// ================= FILE UPLOAD =================
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

// ================= DB =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log(err));

// ================= MODELS =================
const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Anonymous" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const bookSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  price: Number,
  description: String,
  image: String,
  flipkartLink: String,
  amazonLink: String,
  reviews: { type: [reviewSchema], default: [] }
});

const Book = mongoose.model("Book", bookSchema);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);

const getReviewStats = (reviews) => {
  const reviewCount = reviews.length;
  if (reviewCount === 0) return { reviewCount: 0, averageRating: 0 };

  const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  return {
    reviewCount,
    averageRating: Math.round((sum / reviewCount) * 10) / 10
  };
};

// ================= AUTH =================
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);

  await User.create({ name, email, password: hashed });

  res.json({ message: "Registered ✅" });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid email" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.json({ token });
});

// ================= MIDDLEWARE =================
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token" });

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ================= BOOK ROUTES =================
app.get("/api/books", async (req, res) => {
  const books = await Book.find();
  res.json(
    books.map((book) => {
      const bookObj = book.toObject();
      return { ...bookObj, ...getReviewStats(bookObj.reviews || []) };
    })
  );
});

app.get("/api/books/:id", async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });
  const bookObj = book.toObject();
  res.json({ ...bookObj, ...getReviewStats(bookObj.reviews || []) });
});

app.post("/api/books", protect, upload.single("image"), async (req, res) => {
  const image = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    : "";

  const book = await Book.create({
    ...req.body,
    image
  });

  res.json(book);
});

app.put("/api/books/:id", protect, upload.single("image"), async (req, res) => {
  let updateData = { ...req.body };

  if (req.file) {
    updateData.image = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  }

  const book = await Book.findByIdAndUpdate(req.params.id, updateData, {
    new: true
  });

  res.json(book);
});

app.delete("/api/books/:id", protect, async (req, res) => {
  await Book.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ================= REVIEWS =================
app.post("/api/books/:id/reviews", async (req, res) => {
  try {
    const { name, rating, comment } = req.body || {};

    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (!comment || !String(comment).trim()) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    book.reviews.push({
      name: String(name || "Anonymous").trim() || "Anonymous",
      rating: parsedRating,
      comment: String(comment).trim()
    });

    await book.save();

    const stats = getReviewStats(book.reviews);
    res.status(201).json({
      message: "Review added",
      reviews: book.reviews,
      ...stats
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to add review" });
  }
});

// ================= SERVER =================
app.get("/", (req, res) => {
  res.send("Author Book API Running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
