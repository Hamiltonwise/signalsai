const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

console.log('=== TEST VERIFY FUNCTION LOADED ===', new Date().toISOString())

Deno.serve(async (req) => {
  console.log('=== TEST FUNCTION CALLED ===', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  })

  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing test request...')
    
    const response = {
      success: true,
      message: 'Test function is working',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    }
    
    console.log('Sending response:', response)
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Test function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})