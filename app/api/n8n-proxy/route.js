export async function POST(req) {
  try {
    // Your n8n test webhook URL
    const N8N_URL = "https://shariful.automationlearners.pro/webhook-test/ea39906b-1bbf-4b7b-b71b-23ae907fc2f6";

    const body = await req.json();

    const response = await fetch(N8N_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Proxy failed", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function GET() {
  return new Response(JSON.stringify({ ok: true, msg: "Proxy is working" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
