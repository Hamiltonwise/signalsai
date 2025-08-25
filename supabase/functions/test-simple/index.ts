Deno.serve(async (req) => {
  console.log('Simple test function called')
  
  return new Response(
    JSON.stringify({ 
      message: 'Function is working!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    }),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      } 
    }
  )
})