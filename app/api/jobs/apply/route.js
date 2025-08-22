// app/api/jobs/apply/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();

    // Minimal validation
    const required = ["name", "email", "resumeUrl", "title", "location"];
    for (const k of required) {
      if (!body?.[k] || String(body[k]).trim() === "") {
        return new Response(
          JSON.stringify({ ok: false, error: `Missing field: ${k}` }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }
    }

    // In real life, send to your ATS/DB/Email here:
    // - Email: send via a provider (SendGrid, Resend, SES…)
    // - DB: insert into your database
    // - Ticket: create a ticket in your CRM/Discord/Slack
    console.log("New application:", {
      jobId: body.jobId ?? null,
      title: body.title,
      location: body.location,
      name: body.name,
      email: body.email,
      resumeUrl: body.resumeUrl,
      note: body.note ?? "",
      ts: new Date().toISOString(),
    });

    // Fake ID for demo
    const id = Math.random().toString(36).slice(2, 10).toUpperCase();

    return new Response(JSON.stringify({ ok: true, id }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: "server_error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
