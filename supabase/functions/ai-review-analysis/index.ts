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

interface ReviewAnalysisRequest {
  clientId: string
  reviewText: string
  rating: number
  analysisType: 'effectiveness' | 'response_suggestion' | 'marketing_value'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== AI Review Analysis Function Called ===')

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { clientId, reviewText, rating, analysisType }: ReviewAnalysisRequest = await req.json()

    if (!clientId || !reviewText || !rating) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: clientId, reviewText, rating' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured',
          fallback: generateFallbackAnalysis(reviewText, rating)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let prompt = ''
    
    switch (analysisType) {
      case 'effectiveness':
        prompt = `Analyze this dental practice review for marketing effectiveness:

Review: "${reviewText}"
Rating: ${rating}/5 stars

Provide analysis in this exact JSON format:
{
  "score": 85,
  "keywords": ["gentle care", "professional staff", "modern facility"],
  "effectiveness": "high",
  "sentiment": "positive",
  "reason": "Specific explanation of why this review is effective",
  "marketingValue": "What makes this review valuable for attracting new patients"
}

Score 0-100 based on marketing impact, specific details, emotional appeal, and influence potential.`
        break

      case 'response_suggestion':
        prompt = `Generate a professional response to this dental practice review:

Review: "${reviewText}"
Rating: ${rating}/5 stars

Provide response in this exact JSON format:
{
  "suggestedResponse": "Professional, personalized response text",
  "tone": "grateful|professional|empathetic",
  "keyPoints": ["Thank for specific mention", "Reinforce practice values"],
  "callToAction": "Subtle invitation for future visits or referrals"
}

Keep response warm, professional, and under 150 words.`
        break

      case 'marketing_value':
        prompt = `Evaluate this review's marketing potential for a dental practice:

Review: "${reviewText}"
Rating: ${rating}/5 stars

Provide analysis in this exact JSON format:
{
  "marketingScore": 85,
  "bestUseCase": "website testimonial|social media|newsletter|referral material",
  "targetAudience": "new patients|existing patients|referring doctors",
  "keySellingPoints": ["specific service mentioned", "emotional benefit"],
  "improvementSuggestions": ["how to make this review even more effective"]
}

Focus on practical marketing applications.`
        break
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a dental practice marketing expert. Provide analysis in valid JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 600
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    const analysis = JSON.parse(aiResponse)

    return new Response(
      JSON.stringify({
        success: true,
        data: analysis,
        analysisType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('AI review analysis error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallback: generateFallbackAnalysis('', 5)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateFallbackAnalysis(reviewText: string, rating: number) {
  return {
    score: rating * 20,
    keywords: ['professional care', 'satisfied patient'],
    effectiveness: rating >= 5 ? 'high' : rating >= 4 ? 'medium' : 'low',
    sentiment: rating >= 4 ? 'positive' : 'neutral',
    reason: 'Fallback analysis - AI not available',
    marketingValue: 'Standard positive review value'
  }
}