"use client";
import { useEffect, useMemo, useRef, useState } from "react";

const LOCALES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
];

export default function ChatWidget() {
  const [open, setOpen] = useState(true);
  const [locale, setLocale] = useState(LOCALES[0]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! Ask about roles, process, say 'apply', or try 'jobs in Paris'." },
  ]);

  // Simple apply flow state machine
  const [applyFlow, setApplyFlow] = useState({
    active: false, step: 0,
    payload: { job: "", name: "", email: "", location: "", resume: "" }
  });

  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // keep scrolled to last message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // open via #chat and programmatically
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.openHRChat = () => setOpen(true);
    const onHash = () => { if (location.hash === "#chat") setOpen(true); };
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const t = (en, fr, ar) => ({ en, fr, ar }[locale.code]);

  const placeholder = useMemo(
    () => t("Type a message…", "Écrivez un message…", "اكتب رسالة…"),
    [locale.code]
  );

  function pushAssistant(text){ setMessages(m => [...m, { role:"assistant", content:text }]); }
  function pushUser(text){ setMessages(m => [...m, { role:"user", content:text }]); }

  // ---------- APPLY FLOW ----------
  function startApplyFlow(seedJob=""){
    const first = t(
      "Great — let's apply. Which role? (e.g., Frontend Engineer)",
      "Parfait — commençons. Quel poste ? (ex: Frontend Engineer)",
      "رائع — لنبدأ. ما الوظيفة؟ (مثال: Frontend Engineer)"
    );
    setApplyFlow({ active:true, step: seedJob ? 1 : 0, payload:{ job: seedJob, name:"", email:"", location:"", resume:"" } });
    pushAssistant(seedJob ? t("Got it. What's your full name?", "Bien noté. Votre nom complet ?", "تمام. ما اسمك الكامل؟")
                          : first);
  }

  async function handleApplyReply(text){
    const f = { ...applyFlow };
    if (f.step === 0){ f.payload.job = text; f.step = 1; pushAssistant(t("What's your full name?", "Votre nom complet ?", "ما اسمك الكامل؟")); }
    else if (f.step === 1){ f.payload.name = text; f.step = 2; pushAssistant(t("Your email address?", "Votre adresse e-mail ?", "بريدك الإلكتروني؟")); }
    else if (f.step === 2){ f.payload.email = text; f.step = 3; pushAssistant(t("Location (city / country)?", "Lieu (ville / pays) ?", "الموقع (مدينة/بلد)؟")); }
    else if (f.step === 3){ f.payload.location = text; f.step = 4; pushAssistant(t("Resume/CV URL (optional). If none, type 'skip'.", "Lien du CV (optionnel). Tapez 'skip' si non.", "رابط السيرة الذاتية (اختياري). اكتب 'skip' إن لم يوجد.")); }
    else if (f.step === 4){
      if (text.toLowerCase() !== "skip") f.payload.resume = text;
      // submit
      try{
        setLoading(true);
        await fetch("/api/apply", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ ...f.payload, locale: locale.code })
        });
        pushAssistant(t(
          `Thanks ${f.payload.name}! Your application for "${f.payload.job}" has been submitted. Our team will reach out to ${f.payload.email}.`,
          `Merci ${f.payload.name} ! Votre candidature pour « ${f.payload.job} » a été envoyée. Nous vous contacterons à ${f.payload.email}.`,
          `شكرًا ${f.payload.name}! تم إرسال طلبك لوظيفة «${f.payload.job}». سيتواصل فريقنا عبر ${f.payload.email}.`
        ));
      }catch{
        pushAssistant(t("Sorry, I couldn't submit right now.", "Désolé, l’envoi a échoué.", "عذرًا، تعذر الإرسال الآن."));
      }finally{
        setLoading(false);
        setApplyFlow({ active:false, step:0, payload:{ job:"", name:"", email:"", location:"", resume:"" } });
      }
    }
    setApplyFlow(f);
  }

  // ---------- MAIN SEND ----------
  async function send(){
    const text = (inputRef.current?.value ?? "").trim();
    if (!text) return;
    pushUser(text);
    inputRef.current && (inputRef.current.value = "");
    setLoading(true);

    try{
      // If apply flow active, continue it
      if (applyFlow.active){
        await handleApplyReply(text);
        return;
      }

      // Intent detection: "apply"
      if (/^apply\b|apply for|i want to apply|candidature|postuler|قدّم|التقديم/i.test(text)){
        startApplyFlow("");
        return;
      }

      // Job-like queries -> hit Jobs API first
      const looksLikeJobs = /job|role|opening|position|apply|hiring|vacancy|وظيفة|فرصة|توظيف|offre|poste/i.test(text);
      if (looksLikeJobs){
        const res = await fetch("/api/jobs/search", {
          method:"POST", headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ q: text, location: "" })
        });
        const data = await res.json();
        const jobs = data.jobs || [];
        if (jobs.length){
          const list = jobs.slice(0,4).map(j => `• ${j.title} — ${j.location}`).join("\n");
          const note = t(
            `Here are matches:\n${list}\n\nTo apply, say: "apply for <job title>".`,
            `Voici des correspondances :\n${list}\n\nPour postuler, dites : "postuler pour <intitulé>".`,
            `هذه نتائج مطابقة:\n${list}\n\nللتقديم، اكتب: "التقديم على <المسمى>".`
          );
          pushAssistant(note);
          return;
        }
      }

      // Otherwise, ask the AI
      const r = await fetch("/api/chat", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ message: text, locale: locale.code })
      });
      const data = await r.json();
      const reply = (data.reply ?? "").trim();

      // very tiny intent hook from AI reply
      if (/apply now|quick apply|start application/i.test(reply)) {
        startApplyFlow("");
        setLoading(false);
        return;
      }

      pushAssistant(reply || t("Thanks!","Merci !","شكرًا!"));
    }catch{
      pushAssistant(t("Sorry, something went wrong.","Désolé, une erreur est survenue.","عذرًا، حدث خطأ."));
    }finally{
      setLoading(false);
    }
  }

  return (
    <div style={{ position:"fixed", bottom:16, right:16, zIndex:50 }} dir={locale.dir}>
      {open && (
        <div
          style={{
            marginBottom:12, width:380, maxWidth:"92vw",
            border:"1px solid var(--line)", borderRadius:"var(--radius)",
            boxShadow:"var(--shadow)", background:"var(--surface)", overflow:"hidden"
          }}
        >
          {/* Header */}
          <div
            style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"10px 14px", color:"#fff",
              background:"linear-gradient(90deg, var(--brand), var(--brand-2))"
            }}
          >
            <b>HR Assistant</b>
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              <select
                aria-label="Language"
                value={locale.code}
                onChange={(e)=>setLocale(LOCALES.find(l=>l.code===e.target.value) ?? LOCALES[0])}
                style={{ borderRadius:8, padding:"4px 8px", border:"none", background:"#ffffff22", color:"#fff" }}
              >
                {LOCALES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              <button
                onClick={()=>setOpen(false)}
                aria-label="Close"
                style={{ borderRadius:8, border:"none", padding:"4px 8px", background:"#ffffff22", color:"#fff" }}
              >✕</button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{
              height:320, overflowY:"auto", padding:12,
              background:"var(--surface-2)", borderTop:"1px solid var(--line)", borderBottom:"1px solid var(--line)"
            }}
          >
            {messages.map((m,i)=>(
              <div key={i} style={{ textAlign:m.role==="user" ? "right" : "left", margin:"8px 0" }}>
                <span
                  style={{
                    display:"inline-block", maxWidth:"85%", padding:"9px 12px", borderRadius:14,
                    background: m.role==="user" ? "var(--brand-weak)" : "var(--surface)",
                    border:"1px solid var(--line)", color:"var(--text)", fontSize:14
                  }}
                >
                  {m.content}
                </span>
              </div>
            ))}
            {loading && <div className="text-muted" style={{fontSize:12}}>…</div>}
          </div>

          {/* Input */}
          <div style={{ display:"flex", gap:8, padding:10, background:"var(--surface)" }}>
            <input
              ref={inputRef}
              placeholder={placeholder}
              onKeyDown={(e)=>e.key==="Enter" && send()}
              className="input"
              style={{flex:1}}
            />
            <button onClick={send} className="btn btn-primary">
              {applyFlow.active ? t("Next","Suivant","التالي") : t("Send","Envoyer","إرسال")}
            </button>
          </div>
        </div>
      )}

      {!open && (
        <button className="btn btn-primary" onClick={()=>setOpen(true)}>
          Chat
        </button>
      )}
    </div>
  );
}
