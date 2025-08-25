import { openBlankPopup, navigatePopup, waitForMessage, registerPopupRef } from '../../utils/popup';
import { supabase } from '../../lib/supabaseClient';

export async function connectGA4(clientId: string) {
  console.log('🔗 GA4 Connect: Starting connection...');

  // 1) Synchronously open a blank popup to avoid popup blockers
  const popup = openBlankPopup('ga4_connect');
  registerPopupRef(popup);

  try {
    // 2) Get the auth URL from ga4-auth function (original pattern)
    console.log('🔗 GA4 Connect: Requesting auth URL...');
    
    // Get current session for auth header
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session. Please sign in first.');
    }
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ga4-auth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}) // No clientId needed - resolved server-side
    });

    console.log('🔗 GA4 Connect: Auth URL response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('🔗 GA4 Connect: Auth URL request failed:', errorData);
      throw new Error(errorData.error || 'Failed to get auth URL');
    }

    const data = await response.json();
    console.log('🔗 GA4 Connect: Auth URL received:', !!data.authUrl);
    
    if (!data.success || !data.authUrl) {
      throw new Error('No auth URL received');
    }

    // 3) Navigate popup to the provider consent URL
    console.log('🔗 GA4 Connect: Navigating popup to auth URL...');
    navigatePopup(popup, data.authUrl);

    // 4) Wait for ga4-callback to post a success message
    console.log('🔗 GA4 Connect: Waiting for callback message...');
    const msg = await waitForMessage<{ type: string; data: any }>(
      (e) => e.origin === window.location.origin && e.data?.type === 'GA4_AUTH_SUCCESS'
    );

    console.log('🔗 GA4 Connect: Received callback message:', msg);

    if (!msg.data) {
      throw new Error('GA4 connect failed');
    }
    
    try { popup.close(); } catch {}
    console.log('🔗 GA4 Connect: Connection successful!');
    return true;
  } catch (err) {
    console.error('🔗 GA4 Connect: Connection failed:', err);
    try { popup.close(); } catch {}
    throw err;
  }
}

export async function connectGSC(clientId: string) {
  console.log('🔗 GSC Connect: Starting connection...');

  // 1) Synchronously open a blank popup to avoid popup blockers
  const popup = openBlankPopup('gsc_connect');
  registerPopupRef(popup);

  try {
    // Get current session for auth header
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session. Please sign in first.');
    }
    
    // 2) Get the auth URL from gsc-auth function (original pattern)
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gsc-auth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}) // No clientId needed - resolved server-side
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get auth URL');
    }

    const data = await response.json();
    if (!data.success || !data.authUrl) {
      throw new Error('No auth URL received');
    }

    // 3) Navigate popup to the provider consent URL
    navigatePopup(popup, data.authUrl);

    // 4) Wait for gsc-callback to post a success message
    const msg = await waitForMessage<{ type: string; data: any }>(
      (e) => e.origin === window.location.origin && e.data?.type === 'GSC_AUTH_SUCCESS'
    );

    if (!msg.data) {
      throw new Error('GSC connect failed');
    }
    
    try { popup.close(); } catch {}
    return true;
  } catch (err) {
    try { popup.close(); } catch {}
    throw err;
  }
}

export async function connectGBP(clientId: string) {
  console.log('🔗 GBP Connect: Starting connection...');

  // 1) Synchronously open a blank popup to avoid popup blockers
  const popup = openBlankPopup('gbp_connect');
  registerPopupRef(popup);

  try {
    // Get current session for auth header
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session. Please sign in first.');
    }
    
    // 2) Get the auth URL from gbp-auth function (original pattern)
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gbp-auth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}) // No clientId needed - resolved server-side
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get auth URL');
    }

    const data = await response.json();
    if (!data.success || !data.authUrl) {
      throw new Error('No auth URL received');
    }

    // 3) Navigate popup to the provider consent URL
    navigatePopup(popup, data.authUrl);

    // 4) Wait for gbp-callback to post a success message
    const msg = await waitForMessage<{ type: string; data: any }>(
      (e) => e.origin === window.location.origin && e.data?.type === 'GBP_AUTH_SUCCESS'
    );

    if (!msg.data) {
      throw new Error('GBP connect failed');
    }
    
    try { popup.close(); } catch {}
    return true;
  } catch (err) {
    try { popup.close(); } catch {}
    throw err;
  }
}