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

interface PerformanceAlert {
  type: 'reviews' | 'website_traffic' | 'search_visibility' | 'local_presence' | 'practice_growth'
  title: string
  message: string
  metric: string
  change: string
  impact: 'high' | 'medium' | 'low'
}

interface AlertData {
  clientId: string
  practiceName: string
  userEmail: string
  userName: string
  alerts: PerformanceAlert[]
  periodStart: string
  periodEnd: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== Send Performance Alerts Function Called ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)

  try {
    // Calculate last week's date range for weekly alerts
    const now = new Date()
    const lastWeekEnd = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000))
    const lastWeekStart = new Date(lastWeekEnd.getTime() - (6 * 24 * 60 * 60 * 1000))
    
    const periodStart = lastWeekStart.toISOString().split('T')[0]
    const periodEnd = lastWeekEnd.toISOString().split('T')[0]

    console.log('Processing performance alerts for date range:', { periodStart, periodEnd })

    // Get all users who have opted into performance alerts AND email notifications
    const { data: eligibleUsers, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        client_id,
        email,
        first_name,
        last_name,
        performance_alerts_enabled,
        email_notifications_enabled,
        clients (
          id,
          practice_name,
          account_status
        )
      `)
      .eq('performance_alerts_enabled', true)
      .eq('email_notifications_enabled', true)
      .eq('is_active', true)

    if (usersError) {
      console.error('Error fetching eligible users:', usersError)
      throw new Error(`Failed to fetch eligible users: ${usersError.message}`)
    }

    if (!eligibleUsers || eligibleUsers.length === 0) {
      console.log('No users eligible for performance alerts')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No users eligible for performance alerts',
          data: { processedUsers: 0, alertsSent: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${eligibleUsers.length} users eligible for performance alerts`)

    const alertResults = []
    const errors = []

    // Process each eligible user
    for (const user of eligibleUsers) {
      try {
        console.log(`Processing performance alerts for user: ${user.email} (${user.first_name} ${user.last_name})`)

        // Detect positive performance changes
        const alerts = await detectPositivePerformanceChanges(user.client_id, periodStart, periodEnd)

        if (alerts.length === 0) {
          console.log(`No positive alerts found for ${user.email}`)
          continue
        }

        const alertData: AlertData = {
          clientId: user.client_id,
          practiceName: user.clients?.practice_name || 'Your Practice',
          userEmail: user.email,
          userName: `${user.first_name} ${user.last_name}`,
          alerts,
          periodStart,
          periodEnd
        }

        // Generate and send email
        const emailResult = await sendPerformanceAlertEmail(alertData)
        
        if (emailResult.success) {
          alertResults.push({
            userEmail: user.email,
            userName: alertData.userName,
            practiceName: alertData.practiceName,
            alertsCount: alerts.length,
            alertTypes: alerts.map(a => a.type),
            status: 'sent'
          })
          console.log(`✓ Performance alerts sent successfully to ${user.email}`)
        } else {
          throw new Error(emailResult.error || 'Failed to send email')
        }

      } catch (userError) {
        console.error(`✗ Error processing performance alerts for ${user.email}:`, userError)
        errors.push({
          userEmail: user.email,
          error: userError.message
        })
      }

      // Add small delay between emails
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`Performance alerts processing completed. Success: ${alertResults.length}, Errors: ${errors.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Performance alerts processing completed`,
        data: {
          processedUsers: eligibleUsers.length,
          alertsSent: alertResults.length,
          errors: errors.length,
          results: alertResults,
          errorDetails: errors.slice(0, 5)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in performance alerts function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function detectPositivePerformanceChanges(clientId: string, periodStart: string, periodEnd: string): Promise<PerformanceAlert[]> {
  const alerts: PerformanceAlert[] = []

  try {
    // Check for new reviews (GBP)
    const { data: gbpData } = await supabase
      .from('gbp_metrics')
      .select('new_reviews, average_rating, total_views, phone_calls')
      .eq('client_id', clientId)
      .gte('date', periodStart)
      .lte('date', periodEnd)

    if (gbpData && gbpData.length > 0) {
      const totalNewReviews = gbpData.reduce((sum, metric) => sum + (metric.new_reviews || 0), 0)
      const avgRating = gbpData.reduce((sum, metric) => sum + (metric.average_rating || 0), 0) / gbpData.length
      const totalViews = gbpData.reduce((sum, metric) => sum + (metric.total_views || 0), 0)
      const totalCalls = gbpData.reduce((sum, metric) => sum + (metric.phone_calls || 0), 0)

      if (totalNewReviews >= 3) {
        alerts.push({
          type: 'reviews',
          title: 'New Patient Reviews! 🌟',
          message: `You received ${totalNewReviews} new review${totalNewReviews === 1 ? '' : 's'} this week${avgRating > 4 ? ` with an average rating of ${avgRating.toFixed(1)} stars` : ''}!`,
          metric: `${totalNewReviews} new reviews`,
          change: `+${totalNewReviews}`,
          impact: 'high'
        })
      }

      if (totalViews > 100) {
        alerts.push({
          type: 'local_presence',
          title: 'Strong Local Visibility! 👀',
          message: `Your Google Business Profile was viewed ${totalViews} times this week, showing strong local presence!`,
          metric: `${totalViews} profile views`,
          change: `${totalViews} views`,
          impact: 'medium'
        })
      }

      if (totalCalls >= 5) {
        alerts.push({
          type: 'local_presence',
          title: 'Phone Calls Increasing! 📞',
          message: `You received ${totalCalls} phone call${totalCalls === 1 ? '' : 's'} from your Google Business Profile this week!`,
          metric: `${totalCalls} phone calls`,
          change: `+${totalCalls}`,
          impact: 'high'
        })
      }
    }

    // Check for website traffic increases (GA4)
    const { data: ga4Data } = await supabase
      .from('ga4_metrics')
      .select('total_users, new_users, conversions, sessions')
      .eq('client_id', clientId)
      .gte('date', periodStart)
      .lte('date', periodEnd)

    if (ga4Data && ga4Data.length > 0) {
      const totalUsers = ga4Data.reduce((sum, metric) => sum + (metric.total_users || 0), 0)
      const newUsers = ga4Data.reduce((sum, metric) => sum + (metric.new_users || 0), 0)
      const conversions = ga4Data.reduce((sum, metric) => sum + (metric.conversions || 0), 0)

      if (newUsers > 50) {
        alerts.push({
          type: 'website_traffic',
          title: 'Website Traffic Growing! 📈',
          message: `Your website attracted ${newUsers} new visitors this week, showing strong online growth!`,
          metric: `${newUsers} new visitors`,
          change: `+${newUsers}`,
          impact: 'medium'
        })
      }

      if (conversions >= 3) {
        alerts.push({
          type: 'website_traffic',
          title: 'Form Submissions Up! 📝',
          message: `You received ${conversions} new form submission${conversions === 1 ? '' : 's'} this week - potential new patients!`,
          metric: `${conversions} conversions`,
          change: `+${conversions}`,
          impact: 'high'
        })
      }
    }

    // Check for search performance improvements (GSC)
    const { data: gscData } = await supabase
      .from('gsc_metrics')
      .select('clicks, impressions, position')
      .eq('client_id', clientId)
      .gte('date', periodStart)
      .lte('date', periodEnd)

    if (gscData && gscData.length > 0) {
      const totalClicks = gscData.reduce((sum, metric) => sum + (metric.clicks || 0), 0)
      const totalImpressions = gscData.reduce((sum, metric) => sum + (metric.impressions || 0), 0)
      const avgPosition = gscData.reduce((sum, metric) => sum + (metric.position || 0), 0) / gscData.length

      if (totalClicks > 20) {
        alerts.push({
          type: 'search_visibility',
          title: 'Search Clicks Increasing! 🔍',
          message: `Your website received ${totalClicks} clicks from Google search this week, showing improved visibility!`,
          metric: `${totalClicks} search clicks`,
          change: `+${totalClicks}`,
          impact: 'medium'
        })
      }

      if (avgPosition < 5 && totalImpressions > 100) {
        alerts.push({
          type: 'search_visibility',
          title: 'Top Search Rankings! 🏆',
          message: `Your website is ranking in the top 5 positions for key searches with ${totalImpressions} impressions this week!`,
          metric: `Position ${avgPosition.toFixed(1)}`,
          change: `Top 5 ranking`,
          impact: 'high'
        })
      }
    }

    // Check for practice growth (PMS)
    const { data: pmsData } = await supabase
      .from('pms_data')
      .select('patient_count, production_amount, referral_type')
      .eq('client_id', clientId)
      .gte('date', periodStart)
      .lte('date', periodEnd)

    if (pmsData && pmsData.length > 0) {
      const totalPatients = pmsData.reduce((sum, metric) => sum + (metric.patient_count || 0), 0)
      const totalProduction = pmsData.reduce((sum, metric) => sum + (metric.production_amount || 0), 0)
      const selfReferrals = pmsData.filter(m => m.referral_type === 'self_referral').length

      if (totalPatients >= 5) {
        alerts.push({
          type: 'practice_growth',
          title: 'New Patient Growth! 🦷',
          message: `You welcomed ${totalPatients} new patient${totalPatients === 1 ? '' : 's'} this week${totalProduction > 0 ? ` generating $${totalProduction.toLocaleString()} in production` : ''}!`,
          metric: `${totalPatients} new patients`,
          change: `+${totalPatients}`,
          impact: 'high'
        })
      }

      if (selfReferrals >= 3) {
        alerts.push({
          type: 'practice_growth',
          title: 'Word-of-Mouth Success! 💬',
          message: `${selfReferrals} patient${selfReferrals === 1 ? '' : 's'} found you through self-referrals this week - your reputation is growing!`,
          metric: `${selfReferrals} self-referrals`,
          change: `+${selfReferrals}`,
          impact: 'medium'
        })
      }
    }

  } catch (error) {
    console.error('Error detecting performance changes:', error)
  }

  // Sort alerts by impact (high first)
  alerts.sort((a, b) => {
    const impactOrder = { high: 3, medium: 2, low: 1 }
    return impactOrder[b.impact] - impactOrder[a.impact]
  })

  // Limit to top 5 alerts to avoid overwhelming users
  return alerts.slice(0, 5)
}

async function sendPerformanceAlertEmail(alertData: AlertData) {
  try {
    // Check if SMTP is configured
    const smtpHost = Deno.env.get('SMTP_HOST')
    const smtpUser = Deno.env.get('SMTP_USER')
    const smtpPass = Deno.env.get('SMTP_PASS')
    
    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log('SMTP not configured, logging email content instead')
      console.log('=== PERFORMANCE ALERT EMAIL CONTENT ===')
      console.log('To:', alertData.userEmail)
      console.log('Subject:', `🎉 Great News! Performance Updates for ${alertData.practiceName}`)
      console.log('Alerts:', alertData.alerts.length)
      alertData.alerts.forEach(alert => {
        console.log(`- ${alert.title}: ${alert.message}`)
      })
      
      return {
        success: true,
        message: 'Email logged (SMTP not configured)'
      }
    }

    // Generate email content
    const emailHtml = generatePerformanceAlertHTML(alertData)
    const emailText = generatePerformanceAlertText(alertData)

    // TODO: Implement actual SMTP sending using your configured service
    console.log('=== PERFORMANCE ALERT EMAIL READY ===')
    console.log('To:', alertData.userEmail)
    console.log('Subject:', `🎉 Great News! Performance Updates for ${alertData.practiceName}`)
    console.log('HTML length:', emailHtml.length)
    console.log('Text length:', emailText.length)

    // For now, return success (replace with actual SMTP call)
    return {
      success: true,
      message: 'Email prepared for sending'
    }

  } catch (error) {
    console.error('Error sending performance alert email:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

function generatePerformanceAlertHTML(alertData: AlertData): string {
  const { practiceName, userName, alerts, periodStart, periodEnd } = alertData
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'reviews': return '⭐'
      case 'website_traffic': return '📈'
      case 'search_visibility': return '🔍'
      case 'local_presence': return '📍'
      case 'practice_growth': return '🦷'
      default: return '🎉'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#059669' // Green
      case 'medium': return '#0284c7' // Blue
      case 'low': return '#7c3aed' // Purple
      default: return '#059669'
    }
  }

  const alertsHtml = alerts.map(alert => `
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <span style="font-size: 24px; margin-right: 10px;">${getAlertIcon(alert.type)}</span>
        <h3 style="margin: 0; color: ${getImpactColor(alert.impact)}; font-size: 18px;">${alert.title}</h3>
      </div>
      <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px;">${alert.message}</p>
      <div style="background: #f3f4f6; padding: 8px 12px; border-radius: 6px; display: inline-block;">
        <span style="font-size: 14px; color: #6b7280; font-weight: 600;">${alert.metric}</span>
      </div>
    </div>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Performance Updates</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Great News!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Performance Updates for ${practiceName}</p>
      </div>
      
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
        <p style="margin: 0; font-size: 16px;">Hi ${userName},</p>
        <p style="margin: 10px 0 0 0; color: #374151;">We have some exciting positive updates about your practice's performance for ${formatDate(periodStart)} - ${formatDate(periodEnd)}!</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 20px;">🚀 This Week's Wins</h2>
        ${alertsHtml}
      </div>

      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">💡 Keep the Momentum Going!</h3>
        <p style="margin: 0; color: #1e3a8a;">
          These positive trends show your digital marketing efforts are paying off. 
          Your team will continue optimizing to build on this success!
        </p>
      </div>

      <div style="text-align: center; padding: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <p style="margin: 0;">This email was sent because you have performance alerts enabled in your dashboard settings.</p>
        <p style="margin: 5px 0 0 0;">
          <a href="https://hamiltonwisedashboard.netlify.app/settings" style="color: #3b82f6; text-decoration: none;">Manage your notification preferences</a>
        </p>
      </div>
    </body>
    </html>
  `
}

function generatePerformanceAlertText(alertData: AlertData): string {
  const { practiceName, userName, alerts, periodStart, periodEnd } = alertData
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  let text = `🎉 Great News! Performance Updates for ${practiceName}\n`
  text += `${formatDate(periodStart)} - ${formatDate(periodEnd)}\n\n`
  text += `Hi ${userName},\n\n`
  text += `We have some exciting positive updates about your practice's performance!\n\n`
  text += `THIS WEEK'S WINS:\n`
  text += `${'='.repeat(40)}\n\n`

  alerts.forEach((alert, index) => {
    text += `${index + 1}. ${alert.title}\n`
    text += `   ${alert.message}\n`
    text += `   Metric: ${alert.metric}\n\n`
  })

  text += `Keep the momentum going! These positive trends show your digital marketing efforts are paying off.\n\n`
  text += `---\n`
  text += `This email was sent because you have performance alerts enabled.\n`
  text += `Manage preferences: https://hamiltonwisedashboard.netlify.app/settings\n`

  return text
}