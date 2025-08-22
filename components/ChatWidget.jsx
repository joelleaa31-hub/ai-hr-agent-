"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Supported languages
const LOCALES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
];

// A tiny helper to spot job-like queries
const JOB_REGEX =
  /job|role|opening|position|apply|hiring|vacancy|وظيفة|فرصة|توظيف|offre|poste/i;

export default function ChatWidget() {
  const [open, setOpen] = useState(true);
  const [locale, setLocale] = useState(LOCALES[0]);
  const [loading, setLoading] = useState(false);

  // messages can be: { role, type: "text", content } or { role, type:"jobs", items:[...] } or { role, type:"system", content }
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      type: "text",
      content:
        "Hi! Ask about roles, locations, process, or say 'apply'. I can show openings and let you apply here.",
    },
  ]);

  // last jobs shown (used when user types “apply senior engineer” without clicking a card)
  const [lastJobs, setLastJobs] = useState([]);

  // Quick Apply state
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyJob, setApplyJob] = useState(null);
  const [applyData, setApplyData] = useState({
    name: "",
    email: "",
    resumeUrl: "",
    note: "",
  });
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyDone, setApplyDone] = useState(null); // { ok, id } or null

  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open, applyOpen]);

  // Open widget when URL has #chat
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.openHRChat = () => setOpen(true);
    const onHash = () => {
      if (window.location.hash === "#chat") setOpen(true);
    };
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const placeholder = useMemo(
    () =>
      (
        { en: "Type a message…", fr: "Écrivez un message…", ar: "اكتب رسالة…" } as const
      )[locale.code],
    [locale.code]
  );

  // ---------- helpers ----------

  function pushUser(text: string) {
    setMessages((m) => [...m, { role: "user", type: "text", content: text }]);
  }

  function pushAssistantText(text: string) {
    setMessages((m) => [...m, { role: "assistant", type: "text", content: text }]);
  }

  function pushAssistantJobs(items: any[]) {
    setMessages((m) => [...m, { role: "assistant", type: "jobs", items }]);
  }

  function openApply(job: any) {
    setApplyJob(job);
    setApplyData({ name: "", email: "", resumeUrl: "", note: "" });
    setApplyDone(null);
    setApplyOpen(true);
  }

  // Try fuzzy match on last shown jobs
  function findJobByText(text: string) {
    if (!lastJobs?.length) return null;
    const normalized = text.toLowerCase();
    return (
      lastJobs.find(
        (j) =>
          normalized.includes(String(j.title).toLowerCase()) ||
          normalized.includes(String(j.id ?? "").toLowerCase())
      ) ?? null
    );
  }

  // ---------- send ----------

  async function send() {
    const text = (inputRef.current?.value ?? "").trim();
    if (!text) return;

    // push user bubble
    pushUser(text);
    if (inputRef.current) inputRef.current.value = "";
    setLoading(true);

    try {
      // 1) If looks like a jobs query => show jobs with Apply buttons
      if (JOB_REGEX.test(text)) {
        const res = await fetch("/api/jobs/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: text, location: "" }),
        });
        const data = await res.json();
        const jobs = data.jobs || [];

        if (jobs.length) {
          setLastJobs(jobs);
          pushAssistantJobs(jobs.slice(0, 5)); // show up to 5 in chat
          setLoading(false);
          return;
        } else {
          pushAssistantText(
            locale.code === "fr"
              ? "Je n’ai pas trouvé de postes pour cette recherche. Essayez un autre mot-clé ou une autre ville."
              : locale.code === "ar"
              ? "لم أجد وظائف لهذه الكلمات. جرّب كلمة مفتاحية أو مدينة أخرى."
              : "I didn’t find openings for that. Try a different keyword or city."
          );
          setLoading(false);
          return;
        }
      }

      // 2) If user typed “apply ...” try to auto-match job from last shown list
      if (/^apply\b/i.test(text)) {
        const job = findJobByText(text);
        if (job) {
          openApply(job);
          setLoading(false);
          return;
        }
        pushAssistantText(
          locale.code === "fr"
            ? "Dites 'apply' suivi du titre du poste (ex: apply senior engineer) ou cliquez sur le bouton 'Apply' d’une offre."
            : locale.code === "ar"
            ? "اكتب 'apply' ثم اسم الوظيفة (مثال: apply senior accountant) أو اضغط زر 'Apply' في بطاقة الوظيفة."
            : "Say 'apply' + the role (e.g., apply senior engineer), or click the 'Apply' button on a job card."
        );
        setLoading(false);
        return;
      }

      // 3) Otherwise, let the AI answer normally
      const ai = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, locale: locale.code }),
      }).then((r) => r.json());

      pushAssistantText(ai.reply ?? "(no reply)");
    } catch (err) {
      pushAssistantText(
        locale.code === "fr"
          ? "Oups, une erreur est survenue."
          : locale.code === "ar"
          ? "عذرًا، حدث خطأ ما."
          : "Sorry, something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------- apply submit ----------

  async function submitApplication(e) {
    e.preventDefault();
    if (!applyJob) return;

    setApplySubmitting(true);
    setApplyDone(null);

    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: applyJob.id ?? null,
          title: applyJob.title,
          location: applyJob.location,
          ...applyData,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setApplyDone({ ok: true, id: data.id });
        pushAssistantText(
          locale.code === "fr"
            ? `Candidature envoyée pour “${applyJob.title}” à ${applyJob.location}. Nous reviendrons vers vous très vite.`
            : locale.code === "ar"
            ? `تم إرسال طلبك لوظيفة “${applyJob.title}” في ${applyJob.location}. سنعاود التواصل معك قريبًا.`
            : `Application submitted for “${applyJob.title}” in ${applyJob.location}. We’ll get back to you soon.`
        );
      } else {
        setApplyDone({ ok: false, id: null });
      }
    } catch {
      setApplyDone({ ok: false, id: null });
    } finally {
      setApplySubmitting(false);
    }
  }

  // ---------- UI ----------

  function JobCard({ job }) {
    return (
      <div
        className="card"
        style={{
          margin: "6px 0",
          padding: 12,
          borderRadius: 12,
          border: "1px solid var(--line)",
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 600 }}>{job.title}</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>{job.location}</div>
        {job.description ? (
          <div style={{ fontSize: 13, marginTop: 6, color: "#334" }}>
            {String(job.description).slice(0, 180)}
            {String(job.description).length > 180 ? "…" : ""}
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            onClick={() => openApply(job)}
            className="btn"
            style={{
              border: "none",
              borderRadius: 10,
              padding: "8px 12px",
              background:
                "linear-gradient(90deg, var(--brand-1), var(--brand-2))",
              color: "#fff",
            }}
          >
            {locale.code === "fr" ? "Postuler" : locale.code === "ar" ? "قدّم" : "Apply"}
          </button>
          <a
            className="btn"
            href="#jobs"
            style={{
              border: "1px solid var(--line)",
              borderRadius: 10,
              padding: "8px 12px",
              background: "#fff",
            }}
          >
            {locale.code === "fr" ? "Voir la fiche" : locale.code === "ar" ? "التفاصيل" : "View"}
          </a>
        </div>
      </div>
    );
  }

  function Message({ m }) {
    if (m.type === "jobs") {
      return (
        <div style={{ margin: "6px 0" }}>
          {m.items.map((job, i) => (
            <JobCard key={`${job.id ?? i}-${job.title}`} job={job} />
          ))}
        </div>
      );
    }
    // text bubble
    return (
      <div
        style={{
          textAlign: m.role === "user" ? "right" : "left",
          margin: "6px 0",
        }}
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
    );
  }

  return (
    <div
      style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50 }}
      dir={locale.dir}
    >
      {open && (
        <div
          style={{
            marginBottom: 12,
            width: 380,
            maxWidth: "92vw",
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
                  setLocale(LOCALES.find((l) => l.code === e.target.value) ??
                    LOCALES[0])
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
              height: 360,
              overflowY: "auto",
              padding: 12,
              background:
                "linear-gradient(180deg, rgba(108,92,231,.05), rgba(0,184,148,.05))",
            }}
          >
            {messages.map((m, i) => (
              <Message key={i} m={m} />
            ))}
            {loading && (
              <div style={{ fontSize: 12, color: "var(--muted)" }}>…</div>
            )}
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
                background:
                  "linear-gradient(90deg, var(--brand-1), var(--brand-2))",
                color: "#fff",
              }}
            >
              {locale.code === "fr" ? "Envoyer" : locale.code === "ar" ? "إرسال" : "Send"}
            </button>
          </div>

          {/* Quick Apply Drawer (inline) */}
          {applyOpen && (
            <div
              className="card"
              style={{
                borderTop: "1px solid var(--line)",
                padding: 12,
                background: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b>
                  {locale.code === "fr"
                    ? "Candidature rapide"
                    : locale.code === "ar"
                    ? "تقديم سريع"
                    : "Quick Apply"}
                  {applyJob ? ` — ${applyJob.title} (${applyJob.location})` : ""}
                </b>
                <button
                  onClick={() => setApplyOpen(false)}
                  className="btn"
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    padding: "4px 8px",
                    background: "#fff",
                  }}
                >
                  {locale.code === "fr" ? "Fermer" : locale.code === "ar" ? "إغلاق" : "Close"}
                </button>
              </div>

              {applyDone?.ok ? (
                <div
                  className="card"
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 10,
                    background: "rgba(0,184,148,.1)",
                    border: "1px solid rgba(0,184,148,.3)",
                  }}
                >
                  ✅{" "}
                  {locale.code === "fr"
                    ? "Candidature envoyée. Merci !"
                    : locale.code === "ar"
                    ? "تم إرسال الطلب. شكرًا لك!"
                    : "Application submitted. Thank you!"}
                </div>
              ) : (
                <form onSubmit={submitApplication} style={{ marginTop: 10 }}>
                  <div style={{ display: "grid", gap: 8 }}>
                    <input
                      required
                      placeholder={
                        locale.code === "fr"
                          ? "Nom complet"
                          : locale.code === "ar"
                          ? "الاسم الكامل"
                          : "Full name"
                      }
                      value={applyData.name}
                      onChange={(e) =>
                        setApplyData((d) => ({ ...d, name: e.target.value }))
                      }
                      style={{
                        border: "1px solid var(--line)",
                        borderRadius: 10,
                        padding: "10px 12px",
                      }}
                    />
                    <input
                      required
                      type="email"
                      placeholder={
                        locale.code === "fr"
                          ? "Email"
                          : locale.code === "ar"
                          ? "البريد الإلكتروني"
                          : "Email"
                      }
                      value={applyData.email}
                      onChange={(e) =>
                        setApplyData((d) => ({ ...d, email: e.target.value }))
                      }
                      style={{
                        border: "1px solid var(--line)",
                        borderRadius: 10,
                        padding: "10px 12px",
                      }}
                    />
                    <input
                      required
                      placeholder={
                        locale.code === "fr"
                          ? "Lien vers le CV (Google Drive, etc.)"
                          : locale.code === "ar"
                          ? "رابط السيرة الذاتية"
                          : "Resume link (Google Drive, etc.)"
                      }
                      value={applyData.resumeUrl}
                      onChange={(e) =>
                        setApplyData((d) => ({ ...d, resumeUrl: e.target.value }))
                      }
                      style={{
                        border: "1px solid var(--line)",
                        borderRadius: 10,
                        padding: "10px 12px",
                      }}
                    />
                    <textarea
                      placeholder={
                        locale.code === "fr"
                          ? "Note (optionnelle)"
                          : locale.code === "ar"
                          ? "ملاحظة (اختياري)"
                          : "Note (optional)"
                      }
                      value={applyData.note}
                      onChange={(e) =>
                        setApplyData((d) => ({ ...d, note: e.target.value }))
                      }
                      rows={3}
                      style={{
                        border: "1px solid var(--line)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  {!applyDone?.ok && (
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button
                        type="submit"
                        disabled={applySubmitting}
                        className="btn"
                        style={{
                          border: "none",
                          borderRadius: 10,
                          padding: "10px 14px",
                          background:
                            "linear-gradient(90deg, var(--brand-1), var(--brand-2))",
                          color: "#fff",
                        }}
                      >
                        {applySubmitting
                          ? locale.code === "fr"
                            ? "Envoi…"
                            : locale.code === "ar"
                            ? "جارٍ الإرسال…"
                            : "Sending…"
                          : locale.code === "fr"
                          ? "Envoyer"
                          : locale.code === "ar"
                          ? "إرسال"
                          : "Submit"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setApplyOpen(false)}
                        className="btn"
                        style={{
                          border: "1px solid var(--line)",
                          borderRadius: 10,
                          padding: "10px 14px",
                          background: "#fff",
                        }}
                      >
                        {locale.code === "fr" ? "Annuler" : locale.code === "ar" ? "إلغاء" : "Cancel"}
                      </button>
                    </div>
                  )}

                  {applyDone?.ok === false && (
                    <div
                      className="card"
                      style={{
                        marginTop: 10,
                        padding: 10,
                        borderRadius: 10,
                        background: "rgba(239,68,68,.08)",
                        border: "1px solid rgba(239,68,68,.2)",
                        color: "#a11",
                      }}
                    >
                      {locale.code === "fr"
                        ? "Échec de l’envoi. Réessayez."
                        : locale.code === "ar"
                        ? "فشل الإرسال. حاول مرة أخرى."
                        : "Couldn’t submit. Please try again."}
                    </div>
                  )}
                </form>
              )}
            </div>
          )}
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
