import { useEffect, useState } from "react";
import API, { SERVER_URL } from "../api/api.js";

export default function Home() {
  const [books, setBooks] = useState([]);
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  useEffect(() => {
    API.get("/books").then((res) => setBooks(res.data)).catch(console.error);
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    try {
      await API.post("/messages", contact);
      setStatus("Message sent successfully ✅");
      setContact({ name: "", email: "", message: "" });
    } catch (error) {
      setStatus("Message failed. Try again ❌");
    }
  };

  return (
    <main>
      <section className="hero">
        <div>
          <p className="tag">Author Website</p>
          <h1>Books by <span>Bhargavi Simhadri</span></h1>
          <p className="hero-desc">Stories filled with life lessons, inspiration, failures, success, emotions, and hope.</p>
          <a className="primary-btn" href="#books">Explore Books</a>
        </div>
        <img className="hero-img" src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=700" alt="Books" />
      </section>

      <section className="section" id="books">
        <p className="tag center">Available Now</p>
        <h2 className="title center">My Books</h2>
        <div className="books-grid">
          {books.map((book) => (
            <div className="book-card" key={book._id}>
              {book.coverImage ? (
                <img src={`${SERVER_URL}${book.coverImage}`} alt={book.title} />
              ) : (
                <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500" alt={book.title} />
              )}
              <div className="book-body">
                <h3>{book.title}</h3>
                <p className="subtitle">{book.subtitle}</p>
                <p>{book.description}</p>
                <h4>₹{book.price}</h4>
                <div className="buy-row">
                  {book.flipkartLink && <a className="flipkart" href={book.flipkartLink} target="_blank" rel="noreferrer">Flipkart</a>}
                  {book.amazonLink && <a className="amazon" href={book.amazonLink} target="_blank" rel="noreferrer">Amazon</a>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="about" id="about">
        <h2>About Author</h2>
        <p>Hi, I am <b>Bhargavi Simhadri</b>. I write meaningful books filled with life lessons, inspiration, failures, success, emotions, and powerful stories.</p>
        <p>Every story I write carries emotions, struggles, hope, and a message to inspire others. ❤️</p>
      </section>

      <section className="contact" id="contact">
        <h2>Contact Author</h2>
        <p>Send your message, feedback, or collaboration request.</p>
        <form onSubmit={sendMessage}>
          <input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="Your Name" required />
          <input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="Your Email" required />
          <textarea value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} placeholder="Your Message" required />
          <button type="submit">Send Message</button>
          {status && <p className="status">{status}</p>}
        </form>
      </section>
    </main>
  );
}
