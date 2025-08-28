// app/api/n8n-proxy/route.js

const allowedEndpoints = [
  "get-posts",
  "create-post",
  "upload-image",
  "upload-image-data"
];

function extractEndpoint(url) {
  const parts = url.split("/");
  return parts[parts.length - 1]; // e.g., "upload-image"
}

function validateEndpoint(endpoint) {
  return allowedEndpoints.includes(endpoint);
}

async function forwardToN8N(method, endpoint, body = null) {
  const N8N_BASE = "https://sharifulautomationforiansensory.gen/webhook-test";
  const N8N_URL = `${N8N_BASE}/${endpoint}`;

  const response = await fetch(N8N_URL, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Origin": "https://facebook-autopost-dashboard.vercel.app",
      "User-Agent": "Vercel-Proxy/1.0"
    },
    body: body ? JSON.stringify(body) : undefined,
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
}

export async function POST(req) {
  const endpoint = extractEndpoint(req.url);
  if (!validateEndpoint(endpoint)) {
    return new Response(JSON.stringify({ error: "Invalid endpoint", endpoint }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  return await forwardToN8N("POST", endpoint, body);
}

export async function GET(req) {
  const endpoint = extractEndpoint(req.url);
  if (!validateEndpoint(endpoint)) {
    return new Response(JSON.stringify({ error: "Invalid endpoint", endpoint }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return await forwardToN8N("GET", endpoint);
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


