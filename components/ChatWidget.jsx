"use client";
import { useEffect, useMemo, useRef, useState } from "react";

const LOCALES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" }
];

export default function ChatWidget() {
  const [open, setOpen] = useState(true);
  const [locale, setLocale] = useState(LOCALES[0]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! Ask about roles, process, or say 'apply'." }
  ]);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const placeholder = useMemo(
    () => ({ en: "Type a message…", fr: "Écrivez un message…", ar: "اكتب رسالة…" }[locale.code]),
    [locale.code]
  );

  async function send() {
    const text = (inputRef.current?.value ?? "").trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    inputRef.current.value = "";
    setLoading(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, locale: locale.code })
      });
      const data = await r.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "(no reply)" }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50 }} dir={locale.dir}>
      {open && (
        <div style={{ marginBottom: 12, width: 380, border: "1px solid #e5e7eb", borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,.08)", background: "#fff", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #eee" }}>
            <b>HR Assistant</b>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={locale.code} onChange={(e) => setLocale(LOCALES.find(l => l.code === e.target.value) ?? LOCALES[0])}>
                {LOCALES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              <button onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>
          </div>

          <div ref={scrollRef} style={{ height: 320, overflowY: "auto", padding: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ textAlign: m.role === "user" ? "right" : "left", margin: "6px 0" }}>
                <span style={{
                  display: "inline-block", maxWidth: "85%", padding: "8px 10px", borderRadius: 14,
                  background: m.role === "user" ? "transparent" : "#f3f4f6",
                  border: m.role === "user" ? "1px solid #e5e7eb" : "none", fontSize: 14
                }}>
                  {m.content}
                </span>
              </div>
            ))}
            {loading && <div style={{ fontSize: 12, color: "#6b7280" }}>…</div>}
          </div>

          <div style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid #eee" }}>
            <input ref={inputRef} placeholder={placeholder} onKeyDown={(e) => e.key === "Enter" && send()} style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 12, padding: "8px 10px", fontSize: 14 }} />
            <button onClick={send} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "8px 12px" }}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
