import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/api.js";

export default function BookForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    price: "",
    description: "",
    amazonLink: "",
    flipkartLink: ""
  });
  const [coverImage, setCoverImage] = useState(null);

  useEffect(() => {
    if (id) {
      API.get(`/books/${id}`).then((res) => {
        const b = res.data;
        setForm({
          title: b.title || "",
          subtitle: b.subtitle || "",
          price: b.price || "",
          description: b.description || "",
          amazonLink: b.amazonLink || "",
          flipkartLink: b.flipkartLink || ""
        });
      });
    }
  }, [id]);

  const submitHandler = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    if (coverImage) data.append("coverImage", coverImage);

    if (id) await API.put(`/books/${id}`, data);
    else await API.post("/books", data);

    navigate("/admin");
  };

  return (
    <section className="form-page">
      <form className="book-form" onSubmit={submitHandler}>
        <h2>{id ? "Edit Book" : "Add New Book"}</h2>
        <input placeholder="Book Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
        <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <input placeholder="Flipkart Link" value={form.flipkartLink} onChange={(e) => setForm({ ...form, flipkartLink: e.target.value })} />
        <input placeholder="Amazon Link" value={form.amazonLink} onChange={(e) => setForm({ ...form, amazonLink: e.target.value })} />
        <label>Upload Book Cover</label>
        <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files[0])} />
        <button type="submit">{id ? "Update Book" : "Add Book"}</button>
      </form>
    </section>
  );
}
