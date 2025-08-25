import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept, accept-language, content-language',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  console.log('Test function called')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  
  return new Response(
    JSON.stringify({ 
      message: 'Test function working',
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    }),
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json',
      } 
    }
  )
})