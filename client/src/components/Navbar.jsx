import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("authorToken");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("authorToken");
    navigate("/");
    setIsMenuOpen(false);
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="navbar">
      <Link to="/" className="logo" onClick={closeMenu}>
        Bhargavi Books
      </Link>

      <button
        type="button"
        className="nav-toggle"
        aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-controls="primary-navigation"
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        {isMenuOpen ? "\u2715" : "\u2630"}
      </button>

      <div
        id="primary-navigation"
        className={`nav-links ${isMenuOpen ? "open" : ""}`}
      >
        <a href="/#books" onClick={closeMenu}>
          Books
        </a>
        <a href="/#about" onClick={closeMenu}>
          About
        </a>
        <a href="/#contact" onClick={closeMenu}>
          Contact
        </a>
        {token ? (
          <>
            <Link to="/admin" onClick={closeMenu}>
              Dashboard
            </Link>
            <button onClick={logout} className="nav-btn">
              Logout
            </button>
          </>
        ) : (
          <Link to="/admin/login" onClick={closeMenu}>
            Author Login
          </Link>
        )}
      </div>
    </nav>
  );
}
