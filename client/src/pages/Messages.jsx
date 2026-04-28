import { useEffect, useState } from "react";
import API from "../api/api.js";

export default function Messages() {
  const [messages, setMessages] = useState([]);

  const loadMessages = async () => {
    const res = await API.get("/messages");
    setMessages(res.data);
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const deleteMessage = async (id) => {
    await API.delete(`/messages/${id}`);
    loadMessages();
  };

  return (
    <section className="admin-page">
      <p className="tag">Reader Messages</p>
      <h2>Contact Messages</h2>
      <div className="messages-list">
        {messages.map((msg) => (
          <div className="message-card" key={msg._id}>
            <h3>{msg.name}</h3>
            <p><b>Email:</b> {msg.email}</p>
            <p>{msg.message}</p>
            <button onClick={() => deleteMessage(msg._id)}>Delete</button>
          </div>
        ))}
      </div>
    </section>
  );
}
