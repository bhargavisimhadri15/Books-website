import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api.js";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", form);
      localStorage.setItem("authorUser", JSON.stringify(res.data));
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={submitHandler}>
        <h2>Author Login</h2>
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <button type="submit">Login</button>
        {error && <p className="error">{error}</p>}
      </form>
    </section>
  );
}
