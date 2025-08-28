// app/api/n8n-proxy/route.js

export async function POST(req) {
  try {
    // Updated n8n webhook URL - make sure this matches your actual webhook
    const N8N_URL = "https://shariful.automationlearners.pro/webhook-test/ea39906b-1bbf-4b7b-b71b-23ae907fc2f6";
    
    const body = await req.json();
    
    console.log('Forwarding request to n8n:', N8N_URL);
    console.log('Request body:', body);
    
    const response = await fetch(N8N_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Vercel-Proxy/1.0",
        // Add origin header to help with CORS
        "Origin": "https://facebook-autopost-dashboard.vercel.app"
      },
      body: JSON.stringify(body),
    });

    console.log('n8n response status:', response.status);
    
    if (!response.ok) {
      console.error('n8n error response:', response.status, response.statusText);
      throw new Error(`n8n responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('n8n response data:', data);
    
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
    console.error("Detailed proxy error:", error);
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

export async function GET() {
  try {
    const N8N_URL = "https://shariful.automationlearners.pro/webhook-test/ea39906b-1bbf-4b7b-b71b-23ae907fc2f6";
    
    console.log('Testing connection to:', N8N_URL);
    
    const response = await fetch(N8N_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Vercel-Proxy/1.0",
      },
    });

    console.log('Test response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Connection test failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify({
      status: "connected",
      n8n_response: data,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept, Origin",
      },
    });
  } catch (error) {
    console.error("Connection test error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Connection test failed", 
        details: error.message,
        url: "https://shariful.automationlearners.pro/webhook-test/ea39906b-1bbf-4b7b-b71b-23ae907fc2f6",
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
      "Access-Control-Max-Age": "86400", // 24 hours
    },
  });
}
