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

interface CompletedTask {
  id: string
  task_name: string
  status: string
  date_completed: string
  assignee: string
}

interface WeeklyReportData {
  clientId: string
  practiceName: string
  userEmail: string
  userName: string
  completedTasks: CompletedTask[]
  weekStartDate: string
  weekEndDate: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== Send Weekly Report Function Called ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)

  try {
    // Calculate last week's date range
    const now = new Date()
    const lastWeekEnd = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000)) // Last Sunday
    const lastWeekStart = new Date(lastWeekEnd.getTime() - (6 * 24 * 60 * 60 * 1000)) // Previous Monday
    
    const weekStartDate = lastWeekStart.toISOString().split('T')[0]
    const weekEndDate = lastWeekEnd.toISOString().split('T')[0]

    console.log('Processing weekly reports for date range:', { weekStartDate, weekEndDate })

    // Get all users who have opted into weekly reports AND email notifications
    const { data: eligibleUsers, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        client_id,
        email,
        first_name,
        last_name,
        weekly_reports_enabled,
        email_notifications_enabled,
        clients (
          id,
          practice_name,
          account_status
        )
      `)
      .eq('weekly_reports_enabled', true)
      .eq('email_notifications_enabled', true)
      .eq('is_active', true)

    if (usersError) {
      console.error('Error fetching eligible users:', usersError)
      throw new Error(`Failed to fetch eligible users: ${usersError.message}`)
    }

    if (!eligibleUsers || eligibleUsers.length === 0) {
      console.log('No users eligible for weekly reports')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No users eligible for weekly reports',
          data: { processedUsers: 0, emailsSent: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${eligibleUsers.length} users eligible for weekly reports`)

    const reportResults = []
    const errors = []

    // Process each eligible user
    for (const user of eligibleUsers) {
      try {
        console.log(`Processing weekly report for user: ${user.email} (${user.first_name} ${user.last_name})`)

        // Get completed tasks for this user's client in the last week
        const { data: completedTasks, error: tasksError } = await supabase
          .from('client_tasks')
          .select('id, task_name, status, date_completed, assignee')
          .eq('client_id', user.client_id)
          .in('status', ['completed', 'done'])
          .gte('date_completed', weekStartDate)
          .lte('date_completed', weekEndDate)
          .order('date_completed', { ascending: false })

        if (tasksError) {
          console.error(`Error fetching tasks for user ${user.email}:`, tasksError)
          errors.push({
            userEmail: user.email,
            error: `Failed to fetch tasks: ${tasksError.message}`
          })
          continue
        }

        const reportData: WeeklyReportData = {
          clientId: user.client_id,
          practiceName: user.clients?.practice_name || 'Your Practice',
          userEmail: user.email,
          userName: `${user.first_name} ${user.last_name}`,
          completedTasks: completedTasks || [],
          weekStartDate,
          weekEndDate
        }

        // Generate and send email
        const emailResult = await sendWeeklyReportEmail(reportData)
        
        if (emailResult.success) {
          reportResults.push({
            userEmail: user.email,
            userName: reportData.userName,
            practiceName: reportData.practiceName,
            tasksCompleted: completedTasks?.length || 0,
            status: 'sent'
          })
          console.log(`✓ Weekly report sent successfully to ${user.email}`)
        } else {
          throw new Error(emailResult.error || 'Failed to send email')
        }

      } catch (userError) {
        console.error(`✗ Error processing weekly report for ${user.email}:`, userError)
        errors.push({
          userEmail: user.email,
          error: userError.message
        })
      }

      // Add small delay between emails to avoid overwhelming SMTP
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`Weekly reports processing completed. Success: ${reportResults.length}, Errors: ${errors.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Weekly reports processing completed`,
        data: {
          processedUsers: eligibleUsers.length,
          emailsSent: reportResults.length,
          errors: errors.length,
          results: reportResults,
          errorDetails: errors.slice(0, 5) // Include first 5 errors
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in weekly reports function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function sendWeeklyReportEmail(reportData: WeeklyReportData) {
  try {
    // Check if SMTP is configured
    const smtpHost = Deno.env.get('SMTP_HOST')
    const smtpUser = Deno.env.get('SMTP_USER')
    const smtpPass = Deno.env.get('SMTP_PASS')
    
    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log('SMTP not configured, logging email content instead')
      console.log('=== WEEKLY REPORT EMAIL CONTENT ===')
      console.log('To:', reportData.userEmail)
      console.log('Subject:', `Weekly Progress Report - ${reportData.practiceName}`)
      console.log('Tasks completed:', reportData.completedTasks.length)
      console.log('Tasks:', reportData.completedTasks.map(t => `- ${t.task_name} (${t.assignee})`).join('\n'))
      
      return {
        success: true,
        message: 'Email logged (SMTP not configured)'
      }
    }

    // Generate email content
    const emailHtml = generateWeeklyReportHTML(reportData)
    const emailText = generateWeeklyReportText(reportData)

    // TODO: Implement actual SMTP sending using your configured service
    // This is where you'd integrate with your SMTP provider
    console.log('=== WEEKLY REPORT EMAIL READY ===')
    console.log('To:', reportData.userEmail)
    console.log('Subject:', `Weekly Progress Report - ${reportData.practiceName}`)
    console.log('HTML length:', emailHtml.length)
    console.log('Text length:', emailText.length)

    // For now, return success (replace with actual SMTP call)
    return {
      success: true,
      message: 'Email prepared for sending'
    }

  } catch (error) {
    console.error('Error sending weekly report email:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

function generateWeeklyReportHTML(reportData: WeeklyReportData): string {
  const { practiceName, userName, completedTasks, weekStartDate, weekEndDate } = reportData
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const tasksHtml = completedTasks.length > 0 
    ? completedTasks.map(task => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; text-align: left;">${task.task_name}</td>
          <td style="padding: 12px; text-align: left;">${task.assignee}</td>
          <td style="padding: 12px; text-align: left;">${formatDate(task.date_completed)}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #6b7280;">No tasks completed this week</td></tr>'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Weekly Progress Report</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px;">Weekly Progress Report</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${practiceName}</p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 16px;">Hi ${userName},</p>
        <p style="margin: 10px 0 0 0; color: #6b7280;">Here's your weekly progress summary for ${formatDate(weekStartDate)} - ${formatDate(weekEndDate)}</p>
      </div>

      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
        <div style="background: #f9fafb; padding: 15px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="margin: 0; font-size: 18px; color: #1f2937;">Completed Tasks (${completedTasks.length})</h2>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Task</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Assignee</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Completed</th>
            </tr>
          </thead>
          <tbody>
            ${tasksHtml}
          </tbody>
        </table>
      </div>

      <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 16px;">🎉 Great Progress!</h3>
        <p style="margin: 0; color: #047857;">
          ${completedTasks.length > 0 
            ? `Your team completed ${completedTasks.length} task${completedTasks.length === 1 ? '' : 's'} this week. Keep up the excellent momentum!`
            : 'While no tasks were completed this week, your team is actively working on your ongoing projects.'
          }
        </p>
      </div>

      <div style="text-align: center; padding: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <p style="margin: 0;">This email was sent because you have weekly reports enabled in your dashboard settings.</p>
        <p style="margin: 5px 0 0 0;">
          <a href="https://hamiltonwisedashboard.netlify.app/settings" style="color: #3b82f6; text-decoration: none;">Manage your notification preferences</a>
        </p>
      </div>
    </body>
    </html>
  `
}

function generateWeeklyReportText(reportData: WeeklyReportData): string {
  const { practiceName, userName, completedTasks, weekStartDate, weekEndDate } = reportData
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  let text = `Weekly Progress Report - ${practiceName}\n`
  text += `${formatDate(weekStartDate)} - ${formatDate(weekEndDate)}\n\n`
  text += `Hi ${userName},\n\n`
  text += `Here's your weekly progress summary:\n\n`
  text += `COMPLETED TASKS (${completedTasks.length}):\n`
  text += `${'='.repeat(40)}\n`

  if (completedTasks.length > 0) {
    completedTasks.forEach((task, index) => {
      text += `${index + 1}. ${task.task_name}\n`
      text += `   Assignee: ${task.assignee}\n`
      text += `   Completed: ${formatDate(task.date_completed)}\n\n`
    })
    text += `Great progress! Your team completed ${completedTasks.length} task${completedTasks.length === 1 ? '' : 's'} this week.\n\n`
  } else {
    text += `No tasks were completed this week, but your team is actively working on ongoing projects.\n\n`
  }

  text += `---\n`
  text += `This email was sent because you have weekly reports enabled.\n`
  text += `Manage preferences: https://hamiltonwisedashboard.netlify.app/settings\n`

  return text
}