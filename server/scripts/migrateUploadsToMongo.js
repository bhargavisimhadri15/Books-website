import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

dotenv.config();

if (!process.env.MONGO_URI) {
  console.error("Missing MONGO_URI in environment.");
  process.exit(1);
}

const uploadsDir = path.resolve(process.cwd(), "uploads");

const extractUploadsFilename = (imageValue) => {
  if (!imageValue) return null;

  let value = String(imageValue);

  try {
    if (/^https?:\/\//i.test(value)) value = new URL(value).pathname || value;
  } catch {
    // ignore
  }

  const marker = "/uploads/";
  const markerIndex = value.lastIndexOf(marker);
  if (markerIndex !== -1) value = value.slice(markerIndex + marker.length);

  value = value.replace(/^\/+/, "");
  if (value.startsWith("uploads/")) value = value.slice("uploads/".length);

  if (!value) return null;
  if (value.includes("..") || path.isAbsolute(value)) return null;

  return value;
};

const bookSchema = new mongoose.Schema(
  {
    image: String,
    imageStored: { type: Boolean, default: false },
    imageData: { type: Buffer, select: false },
    imageContentType: { type: String, select: false }
  },
  { strict: false }
);

const Book = mongoose.model("Book", bookSchema);

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const candidates = await Book.find({
    $or: [{ imageStored: { $exists: false } }, { imageStored: false }],
    image: { $type: "string", $ne: "" }
  });

  let migrated = 0;
  let skipped = 0;

  for (const book of candidates) {
    const filename = extractUploadsFilename(book.image);
    if (!filename) {
      skipped += 1;
      continue;
    }

    const filePath = path.join(uploadsDir, filename);
    if (!filePath.startsWith(uploadsDir)) {
      skipped += 1;
      continue;
    }

    try {
      const buffer = await fs.promises.readFile(filePath);
      const ext = path.extname(filename).toLowerCase();
      const contentType =
        ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".webp"
              ? "image/webp"
              : ext === ".gif"
                ? "image/gif"
                : "application/octet-stream";

      book.imageData = buffer;
      book.imageContentType = contentType;
      book.imageStored = true;
      await book.save();
      migrated += 1;
    } catch (err) {
      skipped += 1;
      console.log(`Skip ${book._id}: ${err?.message || err}`);
    }
  }

  console.log(`Done. Migrated: ${migrated}. Skipped: ${skipped}.`);
  await mongoose.disconnect();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

