import * as React from 'react';
import { supabase } from '../lib/supabaseClient';

function hasQueryParam(key: string): boolean {
  try {
    return new URLSearchParams(window.location.search).has(key);
  } catch {
    return false;
  }
}

export default function BootDiagnostics() {
  const [lines, setLines] = React.useState<string[]>([]);
  const [isVisible, setIsVisible] = React.useState(false);
  
  const log = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    setLines(prev => [...prev.slice(-49), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  React.useEffect(() => {
    // Only show if ?diag=1 is in URL
    if (!hasQueryParam('diag')) return;
    
    setIsVisible(true);
    
    // Environment diagnostics
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const hasAnonKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    const isDev = import.meta.env.DEV;
    const mode = import.meta.env.MODE;
    
    log('🔧 Environment Check');
    log('SUPABASE_URL:', supabaseUrl || 'MISSING');
    log('Has ANON_KEY:', hasAnonKey);
    log('Mode:', mode);
    log('Is Dev:', isDev);
    log('Origin:', window.location.origin);
    
    // Extract project ref from URL
    if (supabaseUrl) {
      try {
        const url = new URL(supabaseUrl);
        const projectRef = url.hostname.split('.')[0];
        log('Project Ref:', projectRef);
      } catch (e) {
        log('Invalid SUPABASE_URL format:', e.message);
      }
    }

    // Async diagnostics
    (async () => {
      try {
        log('🔐 Auth Check');
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          log('Session error:', error.message);
        } else {
          log('Session user:', data.session?.user?.id || 'none');
          log('Session expires:', data.session?.expires_at || 'none');
        }
      } catch (e: any) {
        log('Auth check failed:', e?.message || String(e));
      }

      // Test Edge Functions connectivity
      if (supabaseUrl && hasAnonKey) {
        try {
          log('🌐 Functions Check');
          
          // Test health check function
          const healthUrl = `${supabaseUrl}/functions/v1/health-check`;
          const healthResponse = await fetch(healthUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
            }
          });
          
          log('Health check status:', healthResponse.status);
          log('Health check headers:', Object.fromEntries(healthResponse.headers.entries()));
          
          if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            log('Health check data:', healthData);
          } else {
            const errorText = await healthResponse.text();
            log('Health check error:', errorText.substring(0, 200));
          }
          
        } catch (e: any) {
          log('Functions connectivity failed:', e?.message || String(e));
        }

        // Test OAuth start function
        try {
          log('🔗 OAuth Functions Check');
          
          const oauthUrl = `${supabaseUrl}/functions/v1/oauth-start`;
          const oauthResponse = await fetch(oauthUrl, {
            method: 'OPTIONS'
          });
          
          log('OAuth OPTIONS status:', oauthResponse.status);
          log('OAuth CORS headers:', {
            origin: oauthResponse.headers.get('Access-Control-Allow-Origin'),
            methods: oauthResponse.headers.get('Access-Control-Allow-Methods'),
            headers: oauthResponse.headers.get('Access-Control-Allow-Headers')
          });
          
        } catch (e: any) {
          log('OAuth functions check failed:', e?.message || String(e));
        }
      }

      // Storage diagnostics
      try {
        log('💾 Storage Check');
        const storageKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('auth') || key.includes('sb-'))) {
            storageKeys.push(key);
          }
        }
        log('Auth storage keys:', storageKeys);
      } catch (e: any) {
        log('Storage check failed:', e?.message || String(e));
      }
    })();
  }, []);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      zIndex: 2147483647,
      bottom: '12px',
      right: '12px',
      maxWidth: '480px',
      maxHeight: '320px',
      overflow: 'auto',
      background: '#111827',
      color: '#e5e7eb',
      padding: '12px',
      borderRadius: '8px',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '11px',
      lineHeight: '1.4',
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
      border: '1px solid #374151'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
        paddingBottom: '8px',
        borderBottom: '1px solid #374151'
      }}>
        <div style={{ fontWeight: '700', color: '#f59e0b' }}>
          🔍 Boot Diagnostics
        </div>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0',
            lineHeight: '1'
          }}
        >
          ×
        </button>
      </div>
      
      <div style={{ maxHeight: '240px', overflow: 'auto' }}>
        {lines.length === 0 ? (
          <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>
            Running diagnostics...
          </div>
        ) : (
          lines.map((line, index) => (
            <div key={index} style={{ 
              marginBottom: '2px',
              wordBreak: 'break-word'
            }}>
              {line}
            </div>
          ))
        )}
      </div>
      
      <div style={{
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #374151',
        fontSize: '10px',
        color: '#6b7280'
      }}>
        Add ?diag=1 to URL to show diagnostics
      </div>
    </div>
  );
}