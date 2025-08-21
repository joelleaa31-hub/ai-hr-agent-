export const runtime = "nodejs";

export async function GET() {
  const has = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-");
  return new Response(JSON.stringify({ ok: true, hasOpenAIKey: has, node: process.version }), {
    headers: { "content-type": "application/json" }
  });
}
