/* components/ChatWidget.jsx */
"use client";
import { useEffect, useMemo, useRef, useState } from "react";

const LOCALES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
];

// Simple i18n helpers
const T = {
  title: { en: "HR Assistant", fr: "Assistant RH", ar: "مساعد الموارد البشرية" },
  hello: {
    en: "Hi! Ask about roles, process, or say 'apply'.",
    fr: "Bonjour ! Demandez des informations sur les postes, le process, ou dites « postuler ».",
    ar: "مرحباً! اسأل عن الوظائف أو العملية أو قل « التقديم »."
  },
  typeHere: { en: "Type a message…", fr: "Écrivez un message…", ar: "اكتب رسالة…" },
  apply: { en: "Apply", fr: "Postuler", ar: "التقديم" },
  details: { en: "Details", fr: "Détails", ar: "التفاصيل" },
  topMatches: {
    en: "Here are the top matches:",
    fr: "Voici les meilleurs postes correspondant à votre recherche :",
    ar: "أفضل الوظائف المطابقة لبحثك:"
  },
  applyBelow: {
    en: "Pick a role below to apply.",
    fr: "Choisissez un poste ci-dessous pour postuler.",
    ar: "اختر وظيفة بالأسفل للتقديم."
  },
  applyFormTitle: {
    en: "Quick Apply",
    fr: "Candidature rapide",
    ar: "تقديم سريع"
  },
  name: { en: "Full name", fr: "Nom complet", ar: "الاسم الكامل" },
  email: { en: "Email", fr: "Email", ar: "البريد الإلكتروني" },
  skills: {
    en: "Top skills (comma separated)",
    fr: "Compétences (séparées par des virgules)",
    ar: "المهارات الرئيسية (مفصولة بفاصلة)"
  },
  years: {
    en: "Years of experience",
    fr: "Années d’expérience",
    ar: "سنوات الخبرة"
  },
  submit: { en: "Submit", fr: "Envoyer", ar: "إرسال" },
  scoreTitle: { en: "Fit score", fr: "Score d’adéquation", ar: "نسبة الملاءمة" },
  getSlots: { en: "Get interview slots", fr: "Voir des créneaux", ar: "عرض مواعيد مقابلة" },
  slotsIntro: {
    en: "Earliest available slots:",
    fr: "Créneaux disponibles au plus tôt :",
    ar: "أقرب المواعيد المتاحة:"
  },
};

export default function ChatWidget() {
  // Start closed so clicking #chat visibly opens it
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState(LOCALES[0]);
  const [loading, setLoading] = useState(false);

  // Messages support text or jobs lists
  // { role:'assistant'|'user', content?:string, type?:'jobs', jobs?:[{id,title,location}] }
  const [messages, setMessages] = useState([
    { role: "assistant", content: T.hello.en },
  ]);

  // Inline apply state
  const [applyJob, setApplyJob] = useState(null);
  const [applyForm, setApplyForm] = useState({ name: "", email: "", skills: "", years: "" });
  const [slots, setSlots] = useState([]);

  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // localize initial hello when locale changes (only for the first msg if it's still hello)
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [{ role: "assistant", content: T.hello[locale.code] }];
      }
      return prev;
    });
  }, [locale.code]);

  // Keep scrolled to the latest message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, applyJob, slots.length]);

  // Open the widget when URL hash is #chat and expose a helper on window
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.openHRChat = () => setOpen(true);
    const openIfHashIsChat = () => {
      if (window.location.hash === "#chat") setOpen(true);
    };
    window.addEventListener("hashchange", openIfHashIsChat);
    openIfHashIsChat();
    return () => window.removeEventListener("hashchange", openIfHashIsChat);
  }, []);

  const placeholder = useMemo(
    () => ({ en: T.typeHere.en, fr: T.typeHere.fr, ar: T.typeHere.ar }[locale.code]),
    [locale.code]
  );

  // Detect job-like queries
  function looksLikeJobQuery(text) {
    return /job|role|opening|position|apply|hiring|vacancy|وظيفة|فرصة|توظيف|offre|poste/i.test(text);
  }

  async function send() {
    const text = (inputRef.current?.value ?? "").trim();
    if (!text) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    if (inputRef.current) inputRef.current.value = "";
    setLoading(true);

    try {
      // 1) If query looks like jobs, hit search API and show interactive job cards
      if (looksLikeJobQuery(text)) {
        const res = await fetch("/api/jobs/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: text, location: "" }),
        });
        const data = await res.json();
        const jobs = data.jobs || [];
        if (jobs.length) {
          setMessages((m) => [
            ...m,
            { role: "assistant", content: `${T.topMatches[locale.code]}\n${T.applyBelow[locale.code]}` },
            { role: "assistant", type: "jobs", jobs: jobs.slice(0, 6) },
          ]);
          setLoading(false);
          return;
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
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setLoading(false);
    }
  }

  // Start inline apply
  function startApply(job) {
    setApplyJob(job);
    setApplyForm({ name: "", email: "", skills: "", years: "" });
    setSlots([]);
  }

  async function submitApply(e) {
    e?.preventDefault?.();
    if (!applyJob) return;

    try {
      setLoading(true);
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: applyJob.id,
          candidate: {
            name: applyForm.name,
            email: applyForm.email,
            skills: applyForm.skills,
            years: Number(applyForm.years || 0),
          },
        }),
      });
      const json = await res.json();
      const score = Math.round(json?.score ?? 0);
      const rationale = json?.rationale ?? "";

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `${T.scoreTitle[locale.code]}: ${score}/100\n${rationale}`,
        },
      ]);
      setApplyJob(null);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Apply failed. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSlots() {
    try {
      setLoading(true);
      const res = await fetch("/api/schedule/slots", { method: "POST" });
      const data = await res.json();
      const s = (data?.slots ?? []).slice(0, 5);
      setSlots(s);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `${T.slotsIntro[locale.code]}\n${s.map((d) => "• " + new Date(d).toString()).join("\n")}` },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Could not fetch slots." }]);
    } finally {
      setLoading(false);
    }
  }

  // Render helpers
  function Bubble({ role, children }) {
    return (
      <div style={{ textAlign: role === "user" ? "right" : "left", margin: "6px 0" }}>
        <span
          style={{
            display: "inline-block",
            maxWidth: "85%",
            padding: "9px 12px",
            borderRadius: 14,
            background: role === "user" ? "transparent" : "rgba(15,23,42,.05)",
            border: role === "user" ? "1px solid var(--line)" : "none",
            fontSize: 14,
          }}
        >
          {children}
        </span>
      </div>
    );
  }

  function JobsList({ jobs }) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {jobs.map((j) => (
          <div
            key={j.id}
            style={{
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: "10px 12px",
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>{j.title}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{j.location}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <a
                href="#open-positions"
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  padding: "6px 10px",
                  fontSize: 12,
                  textDecoration: "none",
                  color: "#0f172a",
                  background: "#fff",
                }}
              >
                {T.details[locale.code]}
              </a>
              <button
                onClick={() => startApply(j)}
                style={{
                  border: "none",
                  borderRadius: 10,
                  padding: "6px 10px",
                  fontSize: 12,
                  color: "#fff",
                  background: "linear-gradient(90deg, var(--brand-1), var(--brand-2))",
                }}
              >
                {T.apply[locale.code]}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function ApplyForm() {
    return (
      <form
        onSubmit={submitApply}
        style={{
          marginTop: 8,
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: 12,
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>
          {T.applyFormTitle[locale.code]} — {applyJob?.title}
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <input
            placeholder={T.name[locale.code]}
            value={applyForm.name}
            onChange={(e) => setApplyForm((f) => ({ ...f, name: e.target.value }))}
            required
            style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "8px 10px", fontSize: 14 }}
          />
          <input
            type="email"
            placeholder={T.email[locale.code]}
            value={applyForm.email}
            onChange={(e) => setApplyForm((f) => ({ ...f, email: e.target.value }))}
            required
            style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "8px 10px", fontSize: 14 }}
          />
          <input
            placeholder={T.skills[locale.code]}
            value={applyForm.skills}
            onChange={(e) => setApplyForm((f) => ({ ...f, skills: e.target.value }))}
            required
            style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "8px 10px", fontSize: 14 }}
          />
          <input
            type="number"
            min="0"
            placeholder={T.years[locale.code]}
            value={applyForm.years}
            onChange={(e) => setApplyForm((f) => ({ ...f, years: e.target.value }))}
            required
            style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "8px 10px", fontSize: 14 }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            type="submit"
            style={{
              border: "none",
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 14,
              color: "#fff",
              background: "linear-gradient(90deg, var(--brand-1), var(--brand-2))",
            }}
          >
            {T.submit[locale.code]}
          </button>
          <button
            type="button"
            onClick={() => setApplyJob(null)}
            style={{
              border: "1px solid var(--line)",
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 14,
              background: "#fff",
            }}
          >
            ✕
          </button>
        </div>
      </form>
    );
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
            <b>{T.title[locale.code]}</b>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                aria-label="Language"
                value={locale.code}
                onChange={(e) => setLocale(LOCALES.find((l) => l.code === e.target.value) ?? LOCALES[0])}
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
                style={{ borderRadius: 8, border: "none", padding: "2px 8px", background: "#ffffff22", color: "#fff" }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages + jobs + apply form */}
          <div
            ref={scrollRef}
            style={{
              height: 360,
              overflowY: "auto",
              padding: 12,
              background: "linear-gradient(180deg, rgba(108,92,231,.05), rgba(0,184,148,.05))",
            }}
          >
            {messages.map((m, i) =>
              m.type === "jobs" ? (
                <div key={`jobs-${i}`} style={{ margin: "6px 0" }}>
                  <JobsList jobs={m.jobs} />
                </div>
              ) : (
                <Bubble key={i} role={m.role}>
                  {m.content}
                </Bubble>
              )
            )}

            {applyJob && <ApplyForm />}

            {slots.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={fetchSlots}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    padding: "8px 12px",
                    background: "#fff",
                    fontSize: 14,
                  }}
                >
                  {T.getSlots[locale.code]}
                </button>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid var(--line)", background: "#fff" }}>
            <input
              ref={inputRef}
              placeholder={placeholder}
              onKeyDown={(e) => e.key === "Enter" && send()}
              style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 12, padding: "10px 12px", fontSize: 14 }}
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
          style={{ border: "1px solid var(--line)", borderRadius: 999, padding: "12px 18px", background: "#fff", boxShadow: "var(--shadow)" }}
        >
          Chat
        </button>
      )}
    </div>
  );
}
