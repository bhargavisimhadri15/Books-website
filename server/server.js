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

const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin header), like curl/Postman.
      if (!origin) return callback(null, true);

      if (allowedOrigins.length === 0) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error("CORS: Origin not allowed"));
    }
  })
);
app.use(express.json());

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use("/uploads", express.static("uploads"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("MongoDB connection error:", err.message));

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: String,
    price: { type: Number, required: true },
    description: String,
    image: String,
    flipkartLink: String,
    amazonLink: String
  },
  { timestamps: true }
);

const Book = mongoose.model("Book", bookSchema);

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: "author" }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

const messageSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    message: String
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
  }
});

const upload = multer({ storage });

const getBaseUrl = (req) => `${req.protocol}://${req.get("host")}`;

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token. Author login required." });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

const authorOnly = (req, res, next) => {
  if (req.user.role !== "author") {
    return res.status(403).json({ message: "Access denied. Author only." });
  }
  next();
};

app.get("/", (req, res) => {
  res.send("Author Book API Running 🚀");
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Author already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "author"
    });

    res.json({ message: "Author account created ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/books", async (req, res) => {
  const books = await Book.find().sort({ createdAt: -1 });
  res.json(books);
});

app.get("/api/books/:id", async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });
  res.json(book);
});

app.post(
  "/api/books",
  protect,
  authorOnly,
  upload.single("image"),
  async (req, res) => {
    try {
      const image = req.file
        ? `${getBaseUrl(req)}/uploads/${req.file.filename}`
        : req.body.image;

      const book = await Book.create({
        title: req.body.title,
        subtitle: req.body.subtitle,
        price: req.body.price,
        description: req.body.description,
        image,
        flipkartLink: req.body.flipkartLink,
        amazonLink: req.body.amazonLink
      });

      res.json({ message: "Book added ✅", book });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

app.put(
  "/api/books/:id",
  protect,
  authorOnly,
  upload.single("image"),
  async (req, res) => {
    try {
      const updateData = {
        title: req.body.title,
        subtitle: req.body.subtitle,
        price: req.body.price,
        description: req.body.description,
        flipkartLink: req.body.flipkartLink,
        amazonLink: req.body.amazonLink
      };

      if (req.file) {
        updateData.image = `${getBaseUrl(req)}/uploads/${req.file.filename}`;
      }

      const book = await Book.findByIdAndUpdate(req.params.id, updateData, {
        new: true
      });

      res.json({ message: "Book updated ✅", book });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

app.delete("/api/books/:id", protect, authorOnly, async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: "Book deleted ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/contact", async (req, res) => {
  try {
    await Message.create(req.body);
    res.json({ message: "Message sent successfully ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/messages", protect, authorOnly, async (req, res) => {
  const messages = await Message.find().sort({ createdAt: -1 });
  res.json(messages);
});

app.delete("/api/messages/:id", protect, authorOnly, async (req, res) => {
  await Message.findByIdAndDelete(req.params.id);
  res.json({ message: "Message deleted ✅" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
