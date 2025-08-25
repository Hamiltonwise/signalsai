const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function closeWithPostMessage(result: unknown) {
  const payload = JSON.stringify(result).replaceAll('<', '&lt;')
  return new Response(`<!doctype html>
<meta charset="utf-8">
<script>
  (function() {
    try {
      var data = ${payload};
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth:complete', data }, '*');
      }
    } catch (e) {
      console.error('PostMessage failed:', e);
    }
    window.close();
    setTimeout(function(){ 
      if (window.location.origin !== 'null') {
        location.replace(window.location.origin); 
      }
    }, 500);
  })();
</script>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders }
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== OAuth Callback Function Called ===')
  console.log('Request URL:', req.url)
  
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const callbackError = url.searchParams.get('error')
    
    if (callbackError) {
      console.error('OAuth Error:', callbackError)
      return closeWithPostMessage({ 
        ok: false, 
        message: callbackError 
      })
    }

    if (!code) {
      console.error('Missing authorization code')
      return closeWithPostMessage({ 
        ok: false, 
        message: 'Missing authorization code' 
      })
    }

    // For now, just return success - the individual callback functions will handle token exchange
    console.log('OAuth callback received code successfully')
    
    return closeWithPostMessage({ 
      ok: true, 
      message: 'OAuth callback received successfully'
    })
    
  } catch (err) {
    console.error('Callback error:', err)
    return closeWithPostMessage({ 
      ok: false, 
      message: err.message 
    })
  }
})