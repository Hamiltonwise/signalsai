import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none';",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID()
  console.log(`[get-ai-insights] ${requestId} start ${req.method} ${new URL(req.url).pathname}`)

  try {
    // Handle GET requests (health check/ping)
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const clientId = url.searchParams.get('clientId')
      
      if (!clientId) {
        return j({ ok: true, ping: true, ts: new Date().toISOString() })
      }

      // Get the latest insights for this client
      const { data: insights, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('client_id', clientId)
        .order('report_date', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Database error:', error)
        return j({ ok: false, code: 'database_error', message: error.message })
      }

      if (!insights) {
        console.log('No insights found for client:', clientId)
        return j({ ok: true, data: null, message: 'No insights found for this client' })
      }

      console.log(`[get-ai-insights] ${requestId} success: returning insights`)
      return j({ ok: true, data: insights, message: 'AI insights retrieved successfully' })
    }

    // Handle POST requests (generate new insights)
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      const { clientId, forceRefresh = false } = body

      if (!clientId) {
        return j({ ok: false, code: 'missing_client_id', message: 'Missing required parameter: clientId' })
      }

      console.log('Processing AI insights request for client:', clientId)

      // Check if we already have insights for this month (unless force refresh)
      const currentDate = new Date()
      const reportDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-01`
      
      if (!forceRefresh) {
        const { data: existingInsights } = await supabase
          .from('ai_insights')
          .select('*')
          .eq('client_id', clientId)
          .eq('report_date', reportDate)
          .single()

        if (existingInsights) {
          console.log('Found existing insights for this month, returning cached data')
          return j({ ok: true, data: existingInsights, message: 'Returned cached insights for this month' })
        }
      }

      // For now, return empty insights if no AI provider is configured
      if (!Deno.env.get('OPENAI_API_KEY')) {
        console.log(`[get-ai-insights] ${requestId} no AI provider configured -> empty insights`)
        
        // Create default insights
        const defaultInsights = {
          client_id: clientId,
          report_date: reportDate,
          sections: {
            Awareness: {
              keyWins: [],
              recommendations: [
                {
                  text: "Connect analytics platforms to track search visibility and brand awareness",
                  supportingEvidence: [
                    { source: "System", metric: "Integration Status", value: "incomplete", comparison: "required for insights" }
                  ],
                  impact: "High",
                  timeframe: "1 day"
                }
              ],
              nextBestSteps: ["Set up Google Search Console and Google Analytics integrations"]
            },
            Research: { keyWins: [], recommendations: [], nextBestSteps: [] },
            Consideration: { keyWins: [], recommendations: [], nextBestSteps: [] },
            Decision: { keyWins: [], recommendations: [], nextBestSteps: [] },
            Loyalty: { keyWins: [], recommendations: [], nextBestSteps: [] },
            Growth: { keyWins: [], recommendations: [], nextBestSteps: [] }
          },
          dataQuality: {
            missingSources: ["GA4", "GBP", "GSC", "Clarity", "PMS"],
            dataGaps: ["Analytics integrations needed for comprehensive patient journey insights"],
            anomalies: []
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Store default insights
        const { data: storedInsights, error: insertError } = await supabase
          .from('ai_insights')
          .upsert(defaultInsights, {
            onConflict: 'client_id,report_date'
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error storing default insights:', insertError)
          return j({ ok: false, code: 'storage_error', message: insertError.message })
        }

        return j({ ok: true, data: storedInsights, message: 'Default insights created' })
      }

      // TODO: Add actual AI provider integration here when OPENAI_API_KEY is available
      return j({ ok: true, insights: [], message: 'AI provider integration pending' })
    }

    return j({ ok: false, code: 'method_not_allowed', message: 'Method not allowed' }, 405)

  } catch (error) {
    console.error(`[get-ai-insights] ${requestId} error:`, error)
    return j({ ok: false, code: 'unhandled', message: error.message }, 500)
  } finally {
    console.log(`[get-ai-insights] ${requestId} end`)
  }
})