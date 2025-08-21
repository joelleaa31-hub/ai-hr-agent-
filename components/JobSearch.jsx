"use client";
import { useEffect, useState } from "react";
import ApplyModal from "./ApplyModal";

const LOCATIONS = ["Paris","London","Dubai","Berlin","Lisbon","Remote","EMEA","MENA"];

export default function JobSearch(){
  const [q,setQ]=useState(""),[location,setLocation]=useState(""),
        [jobs,setJobs]=useState([]),[loading,setLoading]=useState(false),
        [selectedJob,setSelectedJob]=useState(null);

  useEffect(()=>{ // read ?q=&location= from URL
    const sp = new URLSearchParams(window.location.search);
    const q0 = sp.get("q") || "", loc0 = sp.get("location") || "";
    setQ(q0); setLocation(loc0);
  },[]);

  useEffect(()=>{ // auto search if params present
    if (q || location) search();
    else loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, location]);

  async function loadAll(){
    setLoading(true);
    try{ const r=await fetch("/api/jobs"); const d=await r.json(); setJobs(d.jobs||[]); }
    finally{ setLoading(false); }
  }

  async function search(e){
    e?.preventDefault(); setLoading(true);
    try{
      const r=await fetch("/api/jobs/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({q,location})});
      const d=await r.json(); setJobs(d.jobs||[]);
    } finally { setLoading(false); }
  }

  return (
    <section className="card" id="jobs">
      <h2 style={{marginTop:0}}>Open Positions</h2>

      {/* Quick location pills */}
      <div style={{display:"flex",flexWrap:"wrap",gap:8,margin:"0 0 12px 0"}}>
        {LOCATIONS.map(loc => (
          <button key={loc} className="badge" onClick={()=>setLocation(loc)}>{loc}</button>
        ))}
        <button className="badge" onClick={()=>{setLocation(""); setQ(""); loadAll();}}>All</button>
      </div>

      <form onSubmit={search} style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:12, marginBottom:16}}>
        <input className="input" placeholder="Keyword e.g. frontend, data…" value={q} onChange={e=>setQ(e.target.value)} />
        <input className="input" placeholder="Location e.g. Paris, Remote…" value={location} onChange={e=>setLocation(e.target.value)} />
        <button className="btn" type="submit">{loading ? "Searching…" : "Search"}</button>
      </form>

      <div className="grid">
        {jobs.map((job)=>(
          <article key={job.id} className="card" style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <h3 style={{margin:"0 0 4px 0"}}>{job.title}</h3>
              <span className="badge">{job.type}</span>
            </div>
            <div style={{color:"var(--muted)"}}>{job.department} • {job.location}</div>
            <p style={{margin:"6px 0 0 0"}}>{job.description}</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
              {job.skills.slice(0,6).map(s => <span key={s} className="badge">#{s}</span>)}
            </div>
            <div style={{display:"flex",gap:8,marginTop:"auto"}}>
              <a href={job.applyUrl || "#"} className="btn">Details</a>
              <button className="btn" type="button" onClick={()=>setSelectedJob(job)}
                style={{background:"linear-gradient(90deg,var(--brand-3),var(--brand-2))"}}>Apply</button>
            </div>
          </article>
        ))}
      </div>

      <ApplyModal open={!!selectedJob} job={selectedJob} onClose={()=>setSelectedJob(null)} />
    </section>
  );
}
