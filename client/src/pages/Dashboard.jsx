import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API, { SERVER_URL } from "../api/api.js";

export default function Dashboard() {
  const [books, setBooks] = useState([]);

  const loadBooks = async () => {
    const res = await API.get("/books");
    setBooks(res.data);
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const deleteBook = async (id) => {
    if (!window.confirm("Delete this book?")) return;
    await API.delete(`/books/${id}`);
    loadBooks();
  };

  return (
    <section className="admin-page">
      <div className="admin-header">
        <div>
          <p className="tag">Author Panel</p>
          <h2>Manage Books</h2>
        </div>
        <div className="admin-actions">
          <Link to="/admin/add" className="primary-btn">Add Book</Link>
          <Link to="/admin/messages" className="secondary-btn">View Messages</Link>
        </div>
      </div>

      <div className="admin-list">
        {books.map((book) => (
          <div className="admin-book" key={book._id}>
            <img src={book.coverImage ? `${SERVER_URL}${book.coverImage}` : "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300"} alt={book.title} />
            <div>
              <h3>{book.title}</h3>
              <p>₹{book.price}</p>
            </div>
            <div className="row-actions">
              <Link to={`/admin/edit/${book._id}`}>Edit</Link>
              <button onClick={() => deleteBook(book._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
