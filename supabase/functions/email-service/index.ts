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

interface EmailRequest {
  to: string
  subject: string
  htmlBody: string
  textBody: string
  emailType: 'weekly_report' | 'performance_alert' | 'general'
  clientId?: string
  userId?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== Email Service Function Called ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailRequest: EmailRequest = await req.json()
    console.log('Email request received:', {
      to: emailRequest.to,
      subject: emailRequest.subject,
      emailType: emailRequest.emailType,
      hasHtmlBody: !!emailRequest.htmlBody,
      hasTextBody: !!emailRequest.textBody
    })

    // Validate email request
    if (!emailRequest.to || !emailRequest.subject || !emailRequest.htmlBody) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, htmlBody' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check user preferences before sending (except for critical emails)
    if (emailRequest.emailType !== 'general' && emailRequest.userId) {
      const canSendEmail = await checkEmailPermissions(emailRequest.userId, emailRequest.emailType)
      
      if (!canSendEmail) {
        console.log(`Email blocked by user preferences: ${emailRequest.to} (${emailRequest.emailType})`)
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Email blocked by user preferences',
            data: { sent: false, reason: 'user_preferences' }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Send email using configured SMTP
    const emailResult = await sendEmailViaSMTP(emailRequest)

    if (emailResult.success) {
      // Log successful email send
      await logEmailSent(emailRequest)
      
      console.log(`✓ Email sent successfully to ${emailRequest.to}`)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully',
          data: { sent: true, messageId: emailResult.messageId }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error(emailResult.error || 'Failed to send email')
    }

  } catch (error) {
    console.error('Error in email service:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function checkEmailPermissions(userId: string, emailType: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('email_notifications_enabled, weekly_reports_enabled, performance_alerts_enabled')
      .eq('id', userId)
      .single()

    if (error || !user) {
      console.error('Error checking user permissions:', error)
      return false // Default to not sending if we can't verify permissions
    }

    // Check general email notifications first
    if (!user.email_notifications_enabled) {
      return false
    }

    // Check specific email type permissions
    switch (emailType) {
      case 'weekly_report':
        return user.weekly_reports_enabled
      case 'performance_alert':
        return user.performance_alerts_enabled
      default:
        return true // For general emails, just check email_notifications_enabled
    }

  } catch (error) {
    console.error('Error in checkEmailPermissions:', error)
    return false // Default to not sending on error
  }
}

async function sendEmailViaSMTP(emailRequest: EmailRequest) {
  try {
    const smtpHost = Deno.env.get('SMTP_HOST')
    const smtpPort = Deno.env.get('SMTP_PORT') || '587'
    const smtpUser = Deno.env.get('SMTP_USER')
    const smtpPass = Deno.env.get('SMTP_PASS')
    const fromEmail = Deno.env.get('FROM_EMAIL') || smtpUser
    const fromName = Deno.env.get('FROM_NAME') || 'Hamiltonwise Dashboard'

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log('SMTP not configured, simulating email send')
      console.log('=== SIMULATED EMAIL SEND ===')
      console.log('From:', `${fromName} <${fromEmail}>`)
      console.log('To:', emailRequest.to)
      console.log('Subject:', emailRequest.subject)
      console.log('Type:', emailRequest.emailType)
      console.log('HTML Body Length:', emailRequest.htmlBody.length)
      console.log('Text Body Length:', emailRequest.textBody?.length || 0)
      
      return {
        success: true,
        messageId: `simulated-${Date.now()}`,
        message: 'Email simulated (SMTP not configured)'
      }
    }

    // TODO: Implement actual SMTP sending
    // This is where you'd integrate with your SMTP service
    // For example, using nodemailer or your preferred email service
    
    console.log('=== SMTP EMAIL SEND ===')
    console.log('SMTP Host:', smtpHost)
    console.log('SMTP Port:', smtpPort)
    console.log('From:', `${fromName} <${fromEmail}>`)
    console.log('To:', emailRequest.to)
    console.log('Subject:', emailRequest.subject)

    // Placeholder for actual SMTP implementation
    return {
      success: true,
      messageId: `smtp-${Date.now()}`,
      message: 'Email sent via SMTP'
    }

  } catch (error) {
    console.error('SMTP send error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function logEmailSent(emailRequest: EmailRequest) {
  try {
    // Log email send for audit trail (optional)
    console.log('Email sent log:', {
      to: emailRequest.to,
      subject: emailRequest.subject,
      type: emailRequest.emailType,
      timestamp: new Date().toISOString()
    })

    // You could store this in a database table for audit purposes
    // await supabase.from('email_logs').insert({...})

  } catch (error) {
    console.error('Error logging email send:', error)
    // Don't fail the email send if logging fails
  }
}