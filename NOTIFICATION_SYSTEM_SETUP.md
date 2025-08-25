# Notification System Implementation Guide

## 🎯 **Overview**

This guide outlines the complete notification system implementation that respects user preferences while maintaining all existing dashboard functionality.

## 📧 **Email Functions Created**

### 1. **send-weekly-report** Edge Function
- **Purpose:** Sends weekly task completion summaries
- **Trigger:** Weekly (every Monday morning)
- **Recipients:** Users with `weekly_reports_enabled` AND `email_notifications_enabled` = true
- **Content:** Completed tasks from the previous week

### 2. **send-performance-alerts** Edge Function
- **Purpose:** Sends positive performance notifications
- **Trigger:** Weekly or monthly (configurable)
- **Recipients:** Users with `performance_alerts_enabled` AND `email_notifications_enabled` = true
- **Content:** Only positive metrics (new reviews, increased traffic, etc.)

### 3. **email-service** Edge Function
- **Purpose:** Centralized email sending service
- **Features:** 
  - Checks user preferences before sending
  - Handles SMTP configuration
  - Provides audit logging
  - Supports multiple email types

### 4. **check-data-sharing-permissions** Edge Function
- **Purpose:** Validates data usage permissions for secondary purposes
- **Features:**
  - Checks `data_sharing_enabled` and `usage_analytics_enabled` flags
  - Filters client lists based on permissions
  - Does NOT affect individual client dashboard functionality

## 🔧 **Next Steps for Implementation**

### **Step 1: Configure SMTP Environment Variables**

Add these to your Supabase Edge Functions environment variables:

```env
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
FROM_EMAIL=noreply@hamiltonwise.com
FROM_NAME=Hamiltonwise Dashboard
```

### **Step 2: Set Up Scheduled Jobs**

You have several options for triggering these functions:

#### **Option A: Supabase Cron (Recommended)**
```sql
-- Add to your Supabase SQL editor
SELECT cron.schedule(
  'weekly-reports',
  '0 9 * * 1', -- Every Monday at 9 AM
  $$
  SELECT net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/send-weekly-report',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'performance-alerts',
  '0 10 * * 1', -- Every Monday at 10 AM
  $$
  SELECT net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/send-performance-alerts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

#### **Option B: GitHub Actions**
Create `.github/workflows/weekly-notifications.yml`:

```yaml
name: Weekly Notifications
on:
  schedule:
    - cron: '0 9 * * 1' # Every Monday at 9 AM UTC

jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Send Weekly Reports
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            https://your-project-ref.supabase.co/functions/v1/send-weekly-report
      
      - name: Send Performance Alerts
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            https://your-project-ref.supabase.co/functions/v1/send-performance-alerts
```

### **Step 3: Test the System**

#### **Manual Testing:**
```bash
# Test weekly reports
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  https://your-project-ref.supabase.co/functions/v1/send-weekly-report

# Test performance alerts
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  https://your-project-ref.supabase.co/functions/v1/send-performance-alerts
```

#### **Test Data Sharing Permissions:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"clientIds":["test-client-id"],"purpose":"aggregated_reporting","dataTypes":["ga4","gsc"]}' \
  https://your-project-ref.supabase.co/functions/v1/check-data-sharing-permissions
```

## 🛡️ **Data Privacy Implementation**

### **When to Use Data Sharing Checks:**

✅ **Use permission checks for:**
- Aggregated reporting across multiple clients
- Internal product improvement analysis
- Usage analytics for dashboard optimization
- Sharing anonymized data with third parties

❌ **Do NOT use permission checks for:**
- Displaying a client's own data on their dashboard
- Core dashboard functionality
- Individual client API credentials
- Client-specific task management

### **Example Implementation:**

```typescript
// Example: Internal reporting function
async function generateInternalReport() {
  const allClientIds = await getAllClientIds()
  
  // Check permissions before processing data
  const allowedClients = await filterDataByPermissions(
    allClientIds,
    'aggregated_reporting',
    ['ga4', 'gsc', 'gbp']
  )
  
  // Only process data for clients who have opted in
  const reportData = await processMetricsForClients(allowedClients)
  
  return reportData
}
```

## 🔄 **Integration with Existing Systems**

### **No Changes Required To:**
- ✅ Dashboard loading and display functionality
- ✅ Individual client data fetching
- ✅ Authentication and authorization
- ✅ API integrations (GA4, GSC, GBP, Clarity)
- ✅ Task management system
- ✅ Settings page autosave functionality

### **Future Integration Points:**
- 🔄 Any new internal analytics tools
- 🔄 Aggregated reporting systems
- 🔄 Product improvement data collection
- 🔄 Third-party data sharing (if implemented)

## 📊 **Monitoring and Logs**

All functions include comprehensive logging:
- Email send success/failure rates
- User preference compliance
- Data sharing permission checks
- Performance alert detection

Check Supabase Edge Function logs to monitor system health and email delivery.

## 🚀 **Deployment Status**

- ✅ **send-weekly-report** - Ready for scheduling
- ✅ **send-performance-alerts** - Ready for scheduling  
- ✅ **email-service** - Ready for SMTP configuration
- ✅ **check-data-sharing-permissions** - Ready for integration
- 🔄 **SMTP Configuration** - Needs your email service details
- 🔄 **Cron Jobs** - Needs scheduling setup