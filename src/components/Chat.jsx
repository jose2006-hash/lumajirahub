import { useState, useEffect, useRef } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import Nav from "./Nav";

export default function Chat({ ctx }) {
  const chat = ctx.activeChat;
  const [msgs, setMsgs]   = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!chat?.chatId) return;
    const q = query(collection(db, `chats/${chat.chatId}/msgs`), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => setMsgs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [chat?.chatId]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  if (!chat) return null;
  const isUser = ctx.user?.type === "usuario";

  const send = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    try {
      await addDoc(collection(db, `chats/${chat.chatId}/msgs`), {
        from: ctx.user.id,
        fromName: ctx.user.name || ctx.user.tallerName || "Usuario",
        text,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error enviando mensaje:", e);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Nav ctx={ctx} showBack />
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", maxWidth: 720, margin: "0 auto", width: "100%", padding: "16px 24px", gap: 14 }}>
        <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {msgs.length === 0 && (
              <div style={{ textAlign: "center", color: "#3F3F46", fontSize: 13, marginTop: 40 }}>
                Inicia la conversación con {isUser ? "el taller" : "el cliente"}.
              </div>
            )}
            {msgs.map((m) => {
              const isMe = m.from === ctx.user?.id;
              return (
                <div key={m.id} style={{ display: "flex", flexDirection: "column" }}>
                  {!isMe && (
                    <span style={{ fontSize: 11, color: "#F97316", fontWeight: 700, marginBottom: 3, paddingLeft: 4 }}>
                      {m.fromName}
                    </span>
                  )}
                  <div className={isMe ? "bubble-me" : "bubble-bot"}>{m.text}</div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: "12px", borderTop: "1px solid #27272A", display: "flex", gap: 8 }}>
            <input
              className="input"
              placeholder="Escribe un mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              style={{ flex: 1 }}
            />
            <button className="btn-primary" style={{ padding: "10px 16px" }} onClick={send}>→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
