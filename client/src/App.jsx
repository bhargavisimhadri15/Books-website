import {
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useParams
} from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_BASE_URL
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("authorToken");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book/:id" element={<BookDetails />} />
        <Route path="/admin/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <Protected>
              <AdminDashboard />
            </Protected>
          }
        />

        <Route
          path="/admin/add"
          element={
            <Protected>
              <BookForm />
            </Protected>
          }
        />

        <Route
          path="/admin/edit/:id"
          element={
            <Protected>
              <BookForm edit />
            </Protected>
          }
        />
      </Routes>

      <Footer />
    </>
  );
}

function Protected({ children }) {
  const token = localStorage.getItem("authorToken");
  return token ? children : <Navigate to="/admin/login" />;
}

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("authorToken");

  const logout = () => {
    localStorage.removeItem("authorToken");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        Bhargavi Books
      </Link>

      <div className="nav-links">
        <a href="/#books">Books</a>
        <a href="/#about">About</a>
        <a href="/#contact">Contact</a>

        {token ? (
          <>
            <Link to="/admin">Dashboard</Link>
            <button onClick={logout} className="nav-btn">
              Logout
            </button>
          </>
        ) : (
          <Link to="/admin/login">Author Login</Link>
        )}
      </div>
    </nav>
  );
}

function Home() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    API.get("/books")
      .then((res) => setBooks(res.data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <p className="tag">Author Website</p>

          <h1>
            Books by <span>Bhargavi</span>
          </h1>

          <p>
            Meaningful books about life lessons, inspiration, failures, success,
            emotional stories, hope, and courage.
          </p>

          <a href="#books" className="main-btn">
            Explore Books
          </a>
        </div>

        <div className="hero-card">
          <img
            src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600"
            alt="Books"
          />
        </div>
      </section>

      <section id="books" className="section">
        <p className="tag center">Available Now</p>
        <h2 className="title">My Books</h2>

        <div className="books-grid">
          {books.length === 0 ? (
            <p className="empty">No books added yet.</p>
          ) : (
            books.map((book) => (
              <div className="book-card" key={book._id}>
                <img
                  src={
                    book.image ||
                    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500"
                  }
                  alt={book.title}
                />

                <div className="book-content">
                  <h3>{book.title}</h3>
                  <p className="subtitle">{book.subtitle}</p>
                  <p className="desc">{book.description}</p>
                  <h4>₹{book.price}</h4>

                  <Link to={`/book/${book._id}`} className="details-btn">
                    View Details
                  </Link>

                  {book.flipkartLink && (
                    <a
                      href={book.flipkartLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flipkart"
                    >
                      Buy on Flipkart
                    </a>
                  )}

                  {book.amazonLink && (
                    <a
                      href={book.amazonLink}
                      target="_blank"
                      rel="noreferrer"
                      className="amazon"
                    >
                      Buy on Amazon
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section id="about" className="about">
        <h2>About Author</h2>

        <p>
          Hi, I am <b>Bhargavi</b>. I write books filled with life
          lessons, inspiration, failures, success, emotions, and meaningful
          stories.
        </p>

        <p>
          Every story I write carries emotions, struggles, hope, and a message
          to inspire others. My books are created to touch hearts and remind
          readers that every struggle can become strength.
        </p>
      </section>

      <section id="contact" className="contact">
        <h2>Contact Author</h2>

        <p>
          Feel free to reach out for book inquiries, collaborations, or feedback.
        </p>

        <p>
          📩 Email:{" "}
          <a href="mailto:bhargavisimhadri1998@gmail.com">
            bhargavisimhadri1998@gmail.com
          </a>
        </p>
      </section>
    </>
  );
}

function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);

  useEffect(() => {
    API.get(`/books/${id}`)
      .then((res) => setBook(res.data))
      .catch((err) => console.log(err));
  }, [id]);

  if (!book) return <p className="loading">Loading...</p>;

  return (
    <section className="details">
      <img
        src={
          book.image ||
          "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500"
        }
        alt={book.title}
      />

      <div>
        <p className="tag">Book Details</p>
        <h1>{book.title}</h1>
        <h3>{book.subtitle}</h3>
        <p>{book.description}</p>
        <h2>₹{book.price}</h2>

        {book.flipkartLink && (
          <a
            href={book.flipkartLink}
            target="_blank"
            rel="noreferrer"
            className="flipkart"
          >
            Buy on Flipkart
          </a>
        )}

        {book.amazonLink && (
          <a
            href={book.amazonLink}
            target="_blank"
            rel="noreferrer"
            className="amazon"
          >
            Buy on Amazon
          </a>
        )}
      </div>
    </section>
  );
}

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/auth/login", form);
      localStorage.setItem("authorToken", res.data.token);
      alert("Login successful ✅");
      navigate("/admin");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed ❌");
    }
  };

  return (
    <section className="login">
      <form onSubmit={login}>
        <h2>Author Login</h2>

        <input
          type="email"
          placeholder="Author Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button type="submit">Login</button>
      </form>
    </section>
  );
}

function AdminDashboard() {
  const [books, setBooks] = useState([]);

  const loadBooks = async () => {
    try {
      const res = await API.get("/books");
      setBooks(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const deleteBook = async (id) => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      try {
        await API.delete(`/books/${id}`);
        alert("Book deleted ✅");
        loadBooks();
      } catch (err) {
        alert(err.response?.data?.message || "Delete failed ❌");
      }
    }
  };

  return (
    <section className="admin">
      <div className="admin-head">
        <h1>Author Dashboard</h1>

        <Link to="/admin/add" className="main-btn">
          Add New Book
        </Link>
      </div>

      <h2>Manage Books</h2>

      <div className="admin-list">
        {books.length === 0 ? (
          <p>No books added yet.</p>
        ) : (
          books.map((book) => (
            <div className="admin-item" key={book._id}>
              <img
                src={
                  book.image ||
                  "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500"
                }
                alt={book.title}
              />

              <div>
                <h3>{book.title}</h3>
                <p>₹{book.price}</p>
              </div>

              <Link to={`/admin/edit/${book._id}`} className="edit">
                Edit
              </Link>

              <button
                onClick={() => deleteBook(book._id)}
                className="delete"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function BookForm({ edit }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    price: "",
    description: "",
    flipkartLink: "",
    amazonLink: ""
  });

  const [image, setImage] = useState(null);
  const [oldImage, setOldImage] = useState("");

  useEffect(() => {
    if (edit && id) {
      API.get(`/books/${id}`)
        .then((res) => {
          setForm({
            title: res.data.title || "",
            subtitle: res.data.subtitle || "",
            price: res.data.price || "",
            description: res.data.description || "",
            flipkartLink: res.data.flipkartLink || "",
            amazonLink: res.data.amazonLink || ""
          });

          setOldImage(res.data.image || "");
        })
        .catch((err) => console.log(err));
    }
  }, [edit, id]);

  const submitBook = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      data.append("title", form.title);
      data.append("subtitle", form.subtitle);
      data.append("price", form.price);
      data.append("description", form.description);
      data.append("flipkartLink", form.flipkartLink);
      data.append("amazonLink", form.amazonLink);

      if (image) {
        data.append("image", image);
      }

      if (edit) {
        await API.put(`/books/${id}`, data);
        alert("Book updated ✅");
      } else {
        await API.post("/books", data);
        alert("Book added ✅");
      }

      navigate("/admin");
    } catch (err) {
      alert(err.response?.data?.message || "Book save failed ❌");
      console.log(err.response?.data || err.message);
    }
  };

  const previewImage = image ? URL.createObjectURL(image) : oldImage;

  return (
    <section className="book-form">
      <form onSubmit={submitBook}>
        <h2>{edit ? "Update Book" : "Add New Book"}</h2>

        <input
          placeholder="Book Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <input
          placeholder="Subtitle"
          value={form.subtitle}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
        />

        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <input
          placeholder="Flipkart Link"
          value={form.flipkartLink}
          onChange={(e) => setForm({ ...form, flipkartLink: e.target.value })}
        />

        <input
          placeholder="Amazon Link"
          value={form.amazonLink}
          onChange={(e) => setForm({ ...form, amazonLink: e.target.value })}
        />

        <div className="image-upload">
          <label htmlFor="fileUpload" className="upload-box">
            {previewImage ? (
              <img src={previewImage} alt="Book preview" className="preview" />
            ) : (
              <p>📷 Tap to upload book cover</p>
            )}
          </label>

          <input
            id="fileUpload"
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="file-input"
          />
        </div>

        <button type="submit">
          {edit ? "Update Book" : "Add Book"}
        </button>
      </form>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <p>Contact: bhargavisimhadri1998@gmail.com</p>

      <p>© 2026 Bhargavi Books. All Rights Reserved.</p>
    </footer>
  );
}

export default App;
