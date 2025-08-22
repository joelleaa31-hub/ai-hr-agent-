"use client";
import { useEffect, useMemo, useState } from "react";

const LOCATIONS = ["Paris","London","Dubai","Remote","Berlin","Lisbon","EMEA","MENA","All"];

export default function JobSearch(){
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("All");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  // initialize from URL ?location=
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const loc = url.searchParams.get("location");
    if (loc && LOCATIONS.includes(loc)) setLocation(loc);
  }, []);

  const placeholder = "Keyword e.g. frontend, data…";
  const locationPlaceholder = "Location e.g. Paris, Remote…";

  async function search(){
    setLoading(true);
    try{
      const res = await fetch("/api/jobs/search", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ q, location: location==="All" ? "" : location })
      });
      const data = await res.json();
      setJobs(data.jobs ?? []);
    }catch{
      setJobs([]);
    }finally{
      setLoading(false);
    }
  }

  useEffect(() => { search(); /* initial & on mount */ }, []);
  useEffect(() => { const t = setTimeout(search, 250); return () => clearTimeout(t); }, [q, location]);

  const filteredText = useMemo(() => (location==="All" ? "" : ` • ${location}`), [location]);

  return (
    <section id="jobs" className="card">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:12, flexWrap:"wrap"}}>
        <h2 style={{margin:"0 0 6px 0"}}>Open Positions<span className="text-muted">{filteredText}</span></h2>
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          {LOCATIONS.map(loc => (
            <button
              key={loc}
              className={`chip ${loc===location ? "chip-primary" : ""}`}
              onClick={()=>setLocation(loc)}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Search bars */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:10, marginTop:12}}>
        <input className="input" placeholder={placeholder} value={q} onChange={(e)=>setQ(e.target.value)} />
        <input className="input" placeholder={locationPlaceholder} value={location==="All" ? "" : location}
               onChange={(e)=>setLocation(e.target.value || "All")} />
        <button className="btn btn-primary" onClick={search}>Search</button>
      </div>

      {/* Results */}
      <div className="jobs-grid" style={{marginTop:14}}>
        {loading && <div className="text-muted">Loading jobs…</div>}
        {!loading && jobs.length===0 && <div className="text-muted">No jobs found.</div>}

        {!loading && jobs.map(job => (
          <article key={job.id || job.slug || job.title} className="job-card" style={{display:"grid", gap:8}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8}}>
              <h3 style={{margin:0}}>{job.title}</h3>
              {job.type ? <span className="chip">{job.type}</span> : null}
            </div>
            <p className="text-muted" style={{margin:0}}>
              {job.team || job.department || "—"} • {job.location}
            </p>
            {job.summary && <p className="text-muted" style={{margin:"4px 0 0"}}>{job.summary}</p>}

            <div style={{display:"flex", gap:8, marginTop:8, flexWrap:"wrap"}}>
              {job.url ? <a className="btn" href={job.url}>Details</a> : null}
              {/* Quick apply route (optional backend) */}
              <a className="btn btn-primary" href={`#chat`}>Apply in chat</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
