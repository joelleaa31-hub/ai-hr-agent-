"use client";
import { useState } from "react";

export default function ApplyModal({ open, onClose, job }){
  const [name,setName]=useState(""),[email,setEmail]=useState(""),
        [skills,setSkills]=useState(""),[years,setYears]=useState(""),
        [result,setResult]=useState(null),[submitting,setSubmitting]=useState(false);

  if(!open || !job) return null;

  async function submit(e){
    e.preventDefault(); setSubmitting(true);
    try{
      const r = await fetch("/api/apply", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ jobId: job.id, name, email, skills, years: Number(years||0) })
      });
      const data = await r.json(); setResult(data);
    } finally { setSubmitting(false); }
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",display:"grid",placeItems:"center",zIndex:60}}>
      <div className="card" style={{width:520, maxWidth:"92vw"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <h3 style={{margin:0}}>Apply — {job.title}</h3>
          <button onClick={onClose} className="btn" style={{background:"#fff",color:"var(--text)"}}>Close</button>
        </div>

        {!result && (
          <form onSubmit={submit} className="grid" style={{gap:10}}>
            <input className="input" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required />
            <input className="input" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
            <input className="input" placeholder="Top skills (comma separated)" value={skills} onChange={e=>setSkills(e.target.value)} />
            <input className="input" placeholder="Years of experience" type="number" min="0" value={years} onChange={e=>setYears(e.target.value)} />
            <button className="btn" type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit application"}</button>
          </form>
        )}

        {result && (
          <div className="card" style={{marginTop:12}}>
            <div><b>{result.ok ? "Application received!" : "Something went wrong"}</b></div>
            {"score" in result && <div style={{marginTop:6}}>Pre-screen score: <b>{result.score}</b>/100</div>}
            <div style={{marginTop:6}}>{result.message || result.error}</div>
          </div>
        )}
      </div>
    </div>
  );
}
