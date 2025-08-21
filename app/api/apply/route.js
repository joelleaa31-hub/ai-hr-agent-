import { NextResponse } from "next/server";
import { JOBS } from "../jobs/data";

function simpleScore(job, skills, years){
  const jset = new Set(job.skills);
  const sset = new Set(skills.map(s=>s.trim().toLowerCase()).filter(Boolean));
  const overlap = [...sset].filter(s=>jset.has(s)).length;
  const skillsMatch = jset.size ? overlap / jset.size : 0;
  const expScore = Math.max(0, Math.min(1, years >= 0 ? 1 - Math.abs((years || 0) - 3)/3 : 0)); // simple proxy
  return Math.round(100 * (0.6*skillsMatch + 0.3*expScore + 0.1));
}

export async function POST(req){
  const { jobId, name, email, skills = "", years = 0 } = await req.json();
  const job = JOBS.find(j => j.id === jobId);
  if (!job) return NextResponse.json({ ok:false, error:"Job not found" }, { status:400 });
  if (!name || !email) return NextResponse.json({ ok:false, error:"Missing name/email" }, { status:400 });

  const skillsArr = String(skills).split(",");
  const score = simpleScore(job, skillsArr, Number(years||0));
  // POC: no DB; in real app you’d save to DB + email + ATS
  return NextResponse.json({ ok:true, score, message:`Thanks ${name}! We received your application for ${job.title}.` });
}
