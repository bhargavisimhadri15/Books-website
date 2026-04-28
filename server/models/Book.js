import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    coverImage: { type: String, default: "" },
    amazonLink: { type: String, default: "" },
    flipkartLink: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Book", bookSchema);
