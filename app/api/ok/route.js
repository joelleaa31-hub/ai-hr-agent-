export const runtime = "nodejs";

export async function GET() {
  const ok = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-");
  return new Response(JSON.stringify({ ok, hasOpenAIKey: ok, node: process.version }), {
    headers: { "content-type": "application/json" }
  });
}
