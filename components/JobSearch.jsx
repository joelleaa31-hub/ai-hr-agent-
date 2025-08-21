"use client";
import { useState } from "react";
export default function JobSearch(){
  const [q,setQ]=useState(""),[location,setLocation]=useState(""),[jobs,setJobs]=useState([]),[loading,setLoading]=useState(false);
  async function search(e){ e?.preventDefault(); setLoading(true);
    try{const r=await fetch("/api/jobs/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({q,location})});
      const d=await r.json(); setJobs(d.jobs||[]);} finally{setLoading(false)}}
  async function loadAll(){ setLoading(true);
    try{const r=await fetch("/api/jobs");const d=await r.json();setJobs(d.jobs||[]);} finally{setLoading(false)}}
  if (jobs.length===0 && !loading) loadAll();
  return (<section className="card" id="jobs">
    <h2 style={{marginTop:0}}>Open Positions</h2>
    <form onSubmit={search} style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:12,marginBottom:16}}>
      <input className="input" placeholder="Keyword e.g. frontend, data…" value={q} onChange={e=>setQ(e.target.value)} />
      <input className="input" placeholder="Location e.g. Paris, Remote…" value={location} onChange={e=>setLocation(e.target.value)} />
      <button className="btn" type="submit">{loading?"Searching…":"Search"}</button>
    </form>
    <div className="grid">
      {jobs.map(job=>(
        <article key={job.id} className="card" style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <h3 style={{margin:"0 0 4px 0"}}>{job.title}</h3>
            <span className="badge">{job.type}</span>
          </div>
          <div style={{color:"var(--muted)"}}>{job.department} • {job.location}</div>
          <p style={{margin:"6px 0 0 0"}}>{job.description}</p>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
            {job.skills.slice(0,5).map(s => <span key={s} className="badge">#{s}</span>)}
          </div>
          <a href={job.applyUrl || "#"} className="btn" style={{marginTop:"auto",textAlign:"center"}}>Apply</a>
        </article>
      ))}
    </div>
  </section>);
}
