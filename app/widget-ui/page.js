"use client";
import { useState } from "react";
import styles from "./widget.module.css";

export default function WidgetPage() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Bonjour ! Comment puis-je vous aider ?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const text = input.trim();
    setMessages(prev => [...prev, { from: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();
      setMessages(prev => [...prev, { from: "bot", text: data.reply }]);

    } catch (e) {
      setMessages(prev => [...prev, { from: "bot", text: "Erreur serveur." }]);
    }

    setLoading(false);
  }

  function onKey(e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>BVLAB Chat</div>

      <div className={styles.messages}>
        {messages.map((m, i) => (
          <div key={i} className={m.from === "user" ? styles.msgUser : styles.msgBot}>
            {m.text}
          </div>
        ))}
        {loading && <div className={styles.msgBot}>...</div>}
      </div>

      <div className={styles.inputArea}>
        <input
          className={styles.input}
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Écrire un message..."
        />
        <button className={styles.sendBtn} onClick={sendMessage}>Envoyer</button>
      </div>
    </div>
  );
}
