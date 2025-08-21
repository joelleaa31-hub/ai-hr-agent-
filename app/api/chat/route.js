// app/api/chat/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw Object.assign(new Error("Missing OPENAI_API_KEY"), { status: 500 });
    }

    const { message, locale = "en" } = await req.json();

    const sys =
      locale === "fr" ? "Tu es un assistant RH. Réponds en français, de façon concise."
      : locale === "ar" ? "أنت مساعد للموارد البشرية. أجب بالعربية وباختصار."
      : "You are a recruiting assistant. Answer concisely in English.";

    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: String(message ?? "") }
      ]
    });

    return new Response(JSON.stringify({ reply: r.choices?.[0]?.message?.content ?? "" }), {
      headers: { "Content-Type": "application/json" }, status: 200
    });
  } catch (err) {
    console.error("chat_api_error", { status: err?.status, code: err?.code, message: err?.message });
    return new Response(JSON.stringify({ reply: "Sorry, an error occurred." }), {
      headers: { "Content-Type": "application/json" }, status: 200
    });
  }
}
