export async function POST(req) {
  try {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    const endpoint = pathname.split("/").pop(); // e.g., "upload-image"

    // Construct dynamic webhook URL
    const N8N_BASE = "https://sharifulautomationforiansensory.gen/webhook-test";
    const N8N_URL = `${N8N_BASE}/${endpoint}`;

    const body = await req.json();

    console.log("Forwarding to:", N8N_URL);
    console.log("Request body:", body);

    const response = await fetch(N8N_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Origin": "https://facebook-autopost-dashboard.vercel.app",
        "User-Agent": "Vercel-Proxy/1.0"
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept, Origin",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({
        error: "Proxy failed",
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, Origin",
      "Access-Control-Max-Age": "86400",
    },
  });
}

