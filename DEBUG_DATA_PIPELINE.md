# Data Pipeline Debugging Guide

## Phase 1: Data Source Verification

### Step 1.1: Check Raw Data Input
```bash
# If using CSV uploads, verify file content
head -5 your_data_file.csv
# Look for:
# - Correct headers (appointment_type, treatment_category, etc.)
# - Non-empty data cells
# - Proper encoding (UTF-8)
```

### Step 1.2: Frontend Data Capture
```javascript
// Add to your upload component
console.log('Raw CSV data parsed:', csvData);
console.log('Sample record:', csvData[0]);
console.log('Fields present:', Object.keys(csvData[0] || {}));
```

### Step 1.3: Network Request Verification
```javascript
// In browser DevTools Network tab, check:
// 1. Request payload size (should not be 0)
// 2. Request headers (Content-Type: application/json)
// 3. Response status (200 OK)
// 4. Response body (success: true)
```

## Phase 2: API/Edge Function Analysis

### Step 2.1: Edge Function Logs
```bash
# In Supabase Dashboard → Edge Functions → Logs
# Look for:
# - Function execution logs
# - Error messages
# - Data validation failures
# - Database connection issues
```

### Step 2.2: Request Body Validation
```javascript
// Add to your Edge Function
console.log('Received request body:', JSON.stringify(body, null, 2));
console.log('Client ID:', clientId);
console.log('Data array length:', csvData?.length);
console.log('Sample data item:', csvData?.[0]);
```

## Phase 3: Database Layer Investigation

### Step 3.1: Direct Database Query
```sql
-- Check if ANY data exists for your client
SELECT COUNT(*) as total_records 
FROM pms_data 
WHERE client_id = 'your-client-id';

-- Check recent insertions
SELECT * 
FROM pms_data 
WHERE client_id = 'your-client-id' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for NULL values in specific fields
SELECT 
  COUNT(*) as total,
  COUNT(appointment_type) as has_appointment_type,
  COUNT(treatment_category) as has_treatment_category,
  COUNT(referral_source) as has_referral_source
FROM pms_data 
WHERE client_id = 'your-client-id';
```

### Step 3.2: Table Schema Verification
```sql
-- Check table structure
\d pms_data;

-- Or in Supabase Dashboard:
-- Go to Table Editor → pms_data → View table structure
-- Verify column names, types, and constraints
```

## Phase 4: Permission and Security Analysis

### Step 4.1: Row Level Security (RLS)
```sql
-- Check if RLS is blocking inserts
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'pms_data';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'pms_data';
```

### Step 4.2: API Key Permissions
```javascript
// Verify you're using the correct key
console.log('Using service role key:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
console.log('Using anon key:', !!Deno.env.get('SUPABASE_ANON_KEY'));
```

## Common Root Causes and Solutions

### Cause 1: RLS Policy Blocking Inserts
**Symptoms:** No error, but no data appears
**Check:** 
```sql
-- Temporarily disable RLS for testing
ALTER TABLE pms_data DISABLE ROW LEVEL SECURITY;
-- Try insert again, then re-enable
ALTER TABLE pms_data ENABLE ROW LEVEL SECURITY;
```

### Cause 2: Wrong API Key or Environment
**Symptoms:** 401/403 errors or silent failures
**Solution:** Verify environment variables in Supabase Edge Functions

### Cause 3: Data Type Mismatches
**Symptoms:** Insert fails silently or with type errors
**Check:** Ensure CSV data types match database column types

### Cause 4: Client ID Mismatch
**Symptoms:** Data inserted but not visible in dashboard
**Check:** Verify client_id consistency across upload and retrieval

## Debugging Tools and Commands

### Browser DevTools
```javascript
// Network tab: Check request/response
// Console: Look for JavaScript errors
// Application tab: Check localStorage for client_id
```

### Supabase Dashboard
```
1. Go to Table Editor → pms_data
2. Check for recent data
3. Go to Logs → Edge Functions
4. Check for function execution logs
5. Go to Authentication → Users (if using auth)
```

### Database Direct Access
```sql
-- Connect via psql or Supabase SQL Editor
-- Run diagnostic queries above
```

## Verification Checklist

- [ ] CSV file contains expected data
- [ ] Frontend parsing extracts all fields
- [ ] Network request contains full payload
- [ ] Edge Function receives complete data
- [ ] Database insert succeeds without errors
- [ ] Data appears in Supabase table editor
- [ ] Dashboard queries return data
- [ ] Client ID matches between upload and retrieval

## Emergency Debugging Script

```javascript
// Add this to your Edge Function for comprehensive logging
const debugDataFlow = (stage, data) => {
  console.log(`=== DEBUG ${stage} ===`);
  console.log('Data type:', typeof data);
  console.log('Data length:', Array.isArray(data) ? data.length : 'Not array');
  console.log('Sample item:', Array.isArray(data) ? data[0] : data);
  console.log('Keys:', typeof data === 'object' ? Object.keys(data) : 'Not object');
  console.log('=== END DEBUG ===');
};

// Use throughout your pipeline:
debugDataFlow('RECEIVED_FROM_FRONTEND', body);
debugDataFlow('AFTER_VALIDATION', validatedData);
debugDataFlow('BEFORE_DATABASE_INSERT', processedData);
```