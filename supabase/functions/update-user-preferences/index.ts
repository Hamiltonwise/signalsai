import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const url = Deno.env.get('SUPABASE_URL')!;
const anon = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept, accept-language, content-language',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  console.log('=== Update User Preferences Function Called ===');
  console.log('Method:', req.method);
  console.log('Origin:', req.headers.get('origin'));
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    console.log('No authorization token provided');
    return new Response(JSON.stringify({ 
      error: 'Authorization header required',
      success: false 
    }), { 
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const sb = createClient(url, anon, { 
    global: { 
      headers: { 
        Authorization: `Bearer ${token}` 
      } 
    } 
  });

  const { data: { user }, error } = await sb.auth.getUser();
  
  if (import.meta.env?.DEV) {
    console.log('Auth validation result:', { 
      hasUser: !!user, 
      userId: user?.id
    });
  }

  if (error || !user) {
    return new Response(JSON.stringify({ 
      error: 'Unauthorized - invalid or expired token',
      success: false 
    }), { 
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    if (req.method === 'GET') {
      // Fetch user preferences
      const { data: userData, error } = await sb
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          email_notifications_enabled,
          weekly_reports_enabled,
          performance_alerts_enabled,
          data_sharing_enabled,
          usage_analytics_enabled,
          last_login,
          created_at
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(JSON.stringify({ 
            error: 'User profile not found. Please contact support.',
            success: false,
            details: 'User exists in auth but not in users table'
          }), { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        data: userData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'PATCH') {
      // Update user preferences
      const body = await req.json().catch(() => ({}));
      
      console.log('=== PATCH Request Debug ===');
      console.log('User ID:', user.id);
      console.log('Request body:', body);
      
      const {
        email_notifications_enabled,
        weekly_reports_enabled,
        performance_alerts_enabled,
        data_sharing_enabled,
        usage_analytics_enabled
      } = body;

      // Build update object with only provided fields
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Only update fields that are explicitly provided
      if (typeof email_notifications_enabled === 'boolean') {
        updateData.email_notifications_enabled = email_notifications_enabled;
      }
      if (typeof weekly_reports_enabled === 'boolean') {
        updateData.weekly_reports_enabled = weekly_reports_enabled;
      }
      if (typeof performance_alerts_enabled === 'boolean') {
        updateData.performance_alerts_enabled = performance_alerts_enabled;
      }
      if (typeof data_sharing_enabled === 'boolean') {
        updateData.data_sharing_enabled = data_sharing_enabled;
      }
      if (typeof usage_analytics_enabled === 'boolean') {
        updateData.usage_analytics_enabled = usage_analytics_enabled;
      }

      // Validate that at least one preference field is being updated
      const preferenceFields = [
        'email_notifications_enabled',
        'weekly_reports_enabled', 
        'performance_alerts_enabled',
        'data_sharing_enabled',
        'usage_analytics_enabled'
      ];
      
      const hasPreferenceUpdate = preferenceFields.some(field => field in updateData);
      
      if (!hasPreferenceUpdate) {
        return new Response(JSON.stringify({
          error: 'At least one preference field must be provided',
          success: false,
          validFields: preferenceFields
        }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Verify user exists before attempting update
      const { data: existingUser, error: checkError } = await sb
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (checkError || !existingUser) {
        console.error('User verification failed:', checkError?.message);
        return new Response(JSON.stringify({
          error: 'User not found in database',
          success: false,
          details: checkError?.message
        }), { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('=== Performing Update ===');
      console.log('Update data:', updateData);

      const { data: updatedUser, error } = await sb
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select(`
          id,
          email,
          first_name,
          last_name,
          email_notifications_enabled,
          weekly_reports_enabled,
          performance_alerts_enabled,
          data_sharing_enabled,
          usage_analytics_enabled,
          updated_at
        `)
        .single();

      console.log('=== Update Result ===');
      console.log('Has data:', !!updatedUser);
      console.log('Error:', error?.message);
      console.log('Updated user:', updatedUser);

      if (error) {
        console.error('=== Database Update Error ===');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        throw new Error(`Database update error: ${error.message}`);
      }

      if (!updatedUser) {
        console.error('=== No Data Returned ===');
        console.error('This indicates RLS policy may be blocking the update');
        return new Response(JSON.stringify({
          error: 'Update failed - no data returned. This may be a permissions issue.',
          success: false,
          details: 'Row Level Security policy may be blocking the update'
        }), { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: updatedUser,
        message: 'User preferences updated successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Method not allowed',
      success: false 
    }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in update-user-preferences function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});