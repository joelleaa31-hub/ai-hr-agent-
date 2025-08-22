/* components/ChatWidget.jsx */
"use client";
import { useEffect, useMemo, useRef, useState } from "react";

const LOCALES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
];

export default function ChatWidget() {
  // Start closed so clicking "Chat with us" visibly opens it
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState(LOCALES[0]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! Ask about roles, process, or say 'apply'." },
  ]);

  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Keep scrolled to the latest message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // ✅ Open the widget when URL hash is #chat (hook INSIDE the component)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Optional helper for programmatic open: window.openHRChat()
    window.openHRChat = () => setOpen(true);

    const openIfHashIsChat = () => {
      if (window.location.hash === "#chat") setOpen(true);
    };

    window.addEventListener("hashchange", openIfHashIsChat);
    openIfHashIsChat(); // open immediately if URL already has #chat

    return () => window.removeEventListener("hashchange", openIfHashIsChat);
  }, []);

  const placeholder = useMemo(
    () =>
      ({
        en: "Type a message…",
        fr: "Écrivez un message…",
        ar: "اكتب رسالة…",
      }[locale.code]),
    [locale.code]
  );

  async function send() {
    const text = (inputRef.current?.value ?? "").trim();
    if (!text) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    if (inputRef.current) inputRef.current.value = "";
    setLoading(true);

    try {
      // 1) If user asks about jobs/openings, hit our Jobs API first for instant results
      const looksLikeJobs =
        /job|role|opening|position|apply|hiring|vacancy|وظيفة|فرصة|توظيف|offre|poste/i.test(text);

      if (looksLikeJobs) {
        const res = await fetch("/api/jobs/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: text, location: "" }),
        });
        const data = await res.json();
        const jobs = data.jobs || [];
        if (jobs.length) {
          const list = jobs
            .slice(0, 3)
            .map((j) => `• ${j.title} — ${j.location}`)
            .join("\n");

          const note =
            locale.code === "fr"
              ? `Voici les meilleurs postes correspondant à votre recherche:\n${list}\n\nAllez à la section *Open Positions* pour postuler.`
              : locale.code === "ar"
              ? `هذه أفضل الوظائف المطابقة لبحثك:\n${list}\n\nاذهب إلى قسم *الوظائف المتاحة* للتقديم.`
              : `Here are the top matches:\n${list}\n\nScroll to *Open Positions* below to apply.`;

          setMessages((m) => [...m, { role: "assistant", content: note }]);
          setLoading(false);
          return; // done
        }
      }

      // 2) Otherwise, call the AI chat API
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, locale: locale.code }),
      });
      const data = await r.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "(no reply)" }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50 }} dir={locale.dir}>
      {open && (
        <div
          style={{
            marginBottom: 12,
            width: 380,
            border: "1px solid var(--line)",
            borderRadius: 18,
            boxShadow: "var(--shadow)",
            background: "#fff",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              background: "linear-gradient(90deg, var(--brand-1), var(--brand-2))",
              color: "#fff",
            }}
          >
            <b>HR Assistant</b>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                aria-label="Language"
                value={locale.code}
                onChange={(e) =>
                  setLocale(LOCALES.find((l) => l.code === e.target.value) ?? LOCALES[0])
                }
                style={{ borderRadius: 8, padding: "2px 6px", border: "none" }}
              >
                {LOCALES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{
                  borderRadius: 8,
                  border: "none",
                  padding: "2px 8px",
                  background: "#ffffff22",
                  color: "#fff",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{
              height: 320,
              overflowY: "auto",
              padding: 12,
              background: "linear-gradient(180deg, rgba(108,92,231,.05), rgba(0,184,148,.05))",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{ textAlign: m.role === "user" ? "right" : "left", margin: "6px 0" }}
              >
                <span
                  style={{
                    display: "inline-block",
                    maxWidth: "85%",
                    padding: "9px 12px",
                    borderRadius: 14,
                    background: m.role === "user" ? "transparent" : "rgba(15,23,42,.05)",
                    border: m.role === "user" ? "1px solid var(--line)" : "none",
                    fontSize: 14,
                  }}
                >
                  {m.content}
                </span>
              </div>
            ))}
            {loading && <div style={{ fontSize: 12, color: "var(--muted)" }}>…</div>}
          </div>

          {/* Input */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 10,
              borderTop: "1px solid var(--line)",
              background: "#fff",
            }}
          >
            <input
              ref={inputRef}
              placeholder={placeholder}
              onKeyDown={(e) => e.key === "Enter" && send()}
              style={{
                flex: 1,
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: "10px 12px",
                fontSize: 14,
              }}
            />
            <button
              onClick={send}
              style={{
                borderRadius: 12,
                padding: "10px 14px",
                border: "none",
                background: "linear-gradient(90deg, var(--brand-1), var(--brand-2))",
                color: "#fff",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            border: "1px solid var(--line)",
            borderRadius: 999,
            padding: "12px 18px",
            background: "#fff",
            boxShadow: "var(--shadow)",
          }}
        >
          Chat
        </button>
      )}
    </div>
  );
}
