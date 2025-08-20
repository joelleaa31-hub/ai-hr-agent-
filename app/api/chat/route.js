export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { message, locale = "en" } = await req.json();
    const sys =
      locale === "fr" ? "Tu es un assistant RH. Réponds en français, de façon concise."
      : locale === "ar" ? "أنت مساعد للموارد البشرية. أجب بالعربية وباختصار."
      : "You are a recruiting assistant. Answer concisely in English.";

    const chat = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      messages: [{ role: "system", content: sys }, { role: "user", content: String(message ?? "") }]
    });

    return new Response(JSON.stringify({ reply: chat.choices[0]?.message?.content ?? "" }), {
      headers: { "Content-Type": "application/json" }, status: 200
    });
  } catch {
    return new Response(JSON.stringify({ reply: "Sorry, an error occurred." }), {
      headers: { "Content-Type": "application/json" }, status: 200
    });
  }
}
