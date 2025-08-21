import { NextResponse } from "next/server";
import { JOBS } from "../../jobs/data";

function scoreJob(job, q, loc){
  const hay = (job.title+" "+job.department+" "+job.skills.join(" ")+" "+job.description).toLowerCase();
  const kw = String(q||"").toLowerCase().trim();
  const locok = !loc || job.location.toLowerCase().includes(String(loc||"").toLowerCase());
  const s = kw ? (hay.includes(kw) ? 1 : 0) : 0.5;
  return locok ? s : 0;
}
export async function POST(req){
  const { q, location } = await req.json();
  const ranked = JOBS.map(j => ({ j, s: scoreJob(j,q,location) }))
    .filter(x => x.s > 0).sort((a,b)=>b.s-a.s).map(x => x.j);
  return NextResponse.json({ jobs: ranked });
}
