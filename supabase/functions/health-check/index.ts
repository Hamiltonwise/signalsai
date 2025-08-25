const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('Health check called:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

  // Check for authorization header
  const authHeader = req.headers.get('authorization')
  const apiKey = req.headers.get('apikey')
  
  console.log('Auth check:', {
    hasAuthHeader: !!authHeader,
    hasApiKey: !!apiKey
  })

  return new Response(
    JSON.stringify({ 
      status: "OK",
      timestamp: new Date().toISOString(),
      method: req.method,
      hasAuth: !!authHeader,
      hasApiKey: !!apiKey
    }), 
    { 
      status: 200,
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      }
    }
  )
})