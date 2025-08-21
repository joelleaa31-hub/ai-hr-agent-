import { NextResponse } from "next/server";
import { JOBS } from "./data";
export async function GET(){ return NextResponse.json({ jobs: JOBS }); }
