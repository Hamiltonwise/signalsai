import React, { useState } from "react";

/**
 * Signals AI — Onboarding Reference (Apple/Tesla Polish)
 * This route isolates styles in an <iframe srcDoc> so nothing in the app shell can override polish.
 * Complete onboarding experience with dynamic states and smooth animations.
 */

export default function OnboardingReference() {
  const [currentState, setCurrentState] = useState<'empty' | 'loading' | 'success' | 'error'>('empty');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Signals — Onboarding Reference</title>
<style>
  :root{
    --navy:#0D1321; --cobalt:#244EE6; --teal:#06B6D4;
    --muted:#475569; --slate:#F1F5F9; --card:#FFFFFF; --border:#E5E7EB;
    --r:20px; --shadow:0 18px 48px rgba(2,8,23,.06);
  }
  *{box-sizing:border-box}
  body{
    margin:0; color:var(--navy);
    font-family:"Plus Jakarta Sans",system-ui,-apple-system,Segoe UI,Roboto,"Helvetica Neue",Arial,sans-serif;
    background:
      radial-gradient(1200px 600px at 20% -10%, rgba(36,78,230,.08), transparent 60%),
      radial-gradient(1200px 600px at 80%  10%, rgba(6,182,212,.08), transparent 60%),
      var(--slate);
    min-height:100vh; padding:24px;
  }
  .wrap{max-width:1200px;margin:0 auto}
  .shell{display:grid;grid-template-columns:3fr 1fr;gap:24px;align-items:start}
  @media (max-width:980px){ .shell{grid-template-columns:1fr;gap:16px} }
  
  h1{margin:0;font-size:34px;line-height:1.2;font-weight:800;letter-spacing:-.02em}
  .sub{margin:10px 0 18px;color:var(--muted);font-size:16px;max-width:720px}
  
  .card{
    background:var(--card); border:1px solid var(--border); border-radius:var(--r);
    padding:20px; box-shadow:var(--shadow);
    transition:transform .2s ease, box-shadow .3s ease;
  }
  .card:hover{transform:translateY(-1px);box-shadow:0 24px 64px rgba(2,8,23,.1)}
  
  .visual-row{display:flex;align-items:center;justify-content:center;gap:16px;margin:6px 0}
  
  .form-row{display:flex;gap:12px;margin-top:10px}
  .input{
    flex:1; padding:12px 14px; border-radius:12px; border:1px solid #CBD5E1;
    font-size:14px; outline:none; transition:border-color .2s ease, box-shadow .2s ease;
  }
  .input:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(6,182,212,.1)}
  
  .cta{
    background:var(--teal); color:#fff; border:none; padding:12px 18px;
    border-radius:12px; font-weight:800; font-size:14px; cursor:pointer;
    box-shadow:0 12px 24px rgba(6,182,212,.35);
    transition:transform .15s ease, box-shadow .2s ease, filter .2s ease;
  }
  .cta:hover{
    transform:translateY(-1px); 
    box-shadow:0 16px 32px rgba(6,182,212,.45);
    filter:brightness(1.05);
  }
  .cta:active{transform:translateY(0)}
  
  .chips{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
  .chip{
    display:inline-flex; align-items:center; gap:6px; padding:6px 10px;
    border-radius:9999px; background:#F8FAFC; border:1px solid var(--border);
    color:var(--navy); font-size:12px; font-weight:700;
    transition:background .2s ease, transform .15s ease;
  }
  .chip:hover{background:#F1F5F9;transform:scale(1.02)}
  
  .state-card{
    display:flex; align-items:center; padding:12px 14px;
    border:1px solid var(--border); border-radius:16px; background:#fff;
    margin-top:16px; transition:all .3s ease;
    opacity:0; transform:translateY(10px);
    animation:fadeInUp .4s ease forwards;
  }
  
  .state-icon{width:16px;height:16px;margin-right:8px;border-radius:4px}
  .state-icon.empty{background:#CBD5E1}
  .state-icon.check{background:#10B981}
  .state-icon.error{background:#EF4444}
  .state-icon.spinner{
    border:2px solid #CBD5E1; border-top-color:var(--cobalt);
    border-radius:50%; animation:spin 1s linear infinite;
  }
  
  .state-text{color:var(--navy);font-size:14px;font-weight:500}
  
  .error-input{
    width:100%; padding:10px 12px; border-radius:10px;
    border:2px solid #EF4444; outline:none; margin-top:8px;
    transition:border-color .2s ease;
  }
  .error-input:focus{border-color:#DC2626}
  
  .sidebar{position:sticky;top:16px}
  .sidebar h3{margin:0;font-size:16px;font-weight:800;color:var(--navy)}
  .sidebar p{margin-top:8px;color:var(--muted);line-height:1.55}
  
  .pulse-line{
    stroke:url(#pulseGrad); stroke-width:2;
    animation:pulse 2s ease-in-out infinite;
  }
  
  .controls{
    position:sticky; top:0; z-index:10; margin:0 auto 16px;
    display:flex; gap:8px; align-items:center; justify-content:center;
    max-width:1200px; padding:6px 12px; border-radius:9999px;
    background:rgba(13,19,33,.06); backdrop-filter:saturate(140%) blur(6px);
  }
  .control-btn{
    border:1px solid #334155; background:transparent; color:var(--navy);
    border-radius:999px; font-size:12px; padding:4px 8px; cursor:pointer;
    transition:all .2s ease;
  }
  .control-btn.active{border-color:var(--cobalt);background:rgba(36,78,230,.12)}
  .control-btn:hover{background:rgba(36,78,230,.08)}
  
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{stroke-opacity:.3} 50%{stroke-opacity:1}}
  @keyframes fadeInUp{to{opacity:1;transform:translateY(0)}}
</style>
</head>
<body>
  <div class="wrap">
    <!-- State Controls -->
    <div class="controls">
      <small style="opacity:.75">State:</small>
      <button class="control-btn ${currentState === 'empty' ? 'active' : ''}" onclick="setState('empty')">empty</button>
      <button class="control-btn ${currentState === 'loading' ? 'active' : ''}" onclick="setState('loading')">loading</button>
      <button class="control-btn ${currentState === 'success' ? 'active' : ''}" onclick="setState('success')">success</button>
      <button class="control-btn ${currentState === 'error' ? 'active' : ''}" onclick="setState('error')">error</button>
    </div>

    <div class="shell">
      <!-- Main Content (3fr) -->
      <div>
        <h1>Connect Your Google Business Profile</h1>
        <p class="sub">See patient opportunities flow into your dashboard instantly.</p>

        <div class="card">
          <!-- Visual Row -->
          <div class="visual-row">
            <svg width="64" height="64" viewBox="0 0 64 64" aria-label="Google Business Profile">
              <rect x="8" y="8" width="48" height="48" rx="12" fill="#4285F4"/>
              <text x="32" y="38" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">GBP</text>
            </svg>
            
            <svg width="80" height="28" viewBox="0 0 80 28" aria-hidden="true">
              <defs>
                <linearGradient id="pulseGrad" x1="0" x2="1">
                  <stop offset="0%" stop-color="#94A3B8" stop-opacity=".3"/>
                  <stop offset="100%" stop-color="#244EE6" stop-opacity=".9"/>
                </linearGradient>
              </defs>
              <path d="M4 14 H68" class="pulse-line"/>
              <path d="M68 8 L76 14 L68 20" fill="none" stroke="#244EE6" stroke-width="2"/>
            </svg>
            
            <svg width="64" height="64" viewBox="0 0 64 64" aria-label="Signals">
              <rect x="8" y="8" width="48" height="48" rx="12" fill="#06B6D4"/>
              <text x="32" y="38" text-anchor="middle" font-size="14" font-weight="700" fill="#0D1321">Signals</text>
            </svg>
          </div>

          <!-- Form -->
          <form class="form-row" onsubmit="handleSubmit(event)">
            <input class="input" type="email" placeholder="Google Business Email" required/>
            <button class="cta" type="submit">Connect My GBP</button>
          </form>

          <!-- Trust Chips -->
          <div class="chips">
            <span class="chip">🔒 Secure connection</span>
            <span class="chip">🙈 Read-only access</span>
            <span class="chip">⏱️ Updated in real time</span>
          </div>
        </div>

        <!-- Dynamic State Display -->
        <div id="stateContainer"></div>
      </div>

      <!-- Sidebar (1fr) -->
      <div class="sidebar">
        <div class="card">
          <h3>Why GBP?</h3>
          <p>Most patients find practices on Google. By connecting, you'll see leads and consults tracked automatically.</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    let currentState = '${currentState}';
    
    function setState(state) {
      currentState = state;
      updateStateDisplay();
      // Update active button
      document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
    }
    
    function updateStateDisplay() {
      const container = document.getElementById('stateContainer');
      container.innerHTML = '';
      
      let content = '';
      
      switch(currentState) {
        case 'empty':
          content = \`
            <div class="state-card">
              <div class="state-icon empty"></div>
              <span class="state-text">No GBP connected yet → Connect now to unlock patient journey insights.</span>
            </div>
          \`;
          break;
        case 'loading':
          content = \`
            <div class="state-card">
              <div class="state-icon spinner"></div>
              <span class="state-text">Connecting your profile…</span>
            </div>
          \`;
          break;
        case 'success':
          content = \`
            <div class="state-card">
              <div class="state-icon check"></div>
              <span class="state-text">Connected! Pulling your first patient opportunities.</span>
            </div>
          \`;
          break;
        case 'error':
          content = \`
            <div class="state-card">
              <div class="state-icon error"></div>
              <div>
                <div class="state-text" style="font-weight:600">We couldn't connect — please check your email or try again.</div>
                <input class="error-input" placeholder="you@example.com" type="email"/>
              </div>
            </div>
          \`;
          break;
      }
      
      container.innerHTML = content;
    }
    
    function handleSubmit(event) {
      event.preventDefault();
      setState('loading');
      
      // Simulate connection process
      setTimeout(() => {
        const success = Math.random() > 0.3;
        setState(success ? 'success' : 'error');
      }, 2000);
    }
    
    // Initialize
    updateStateDisplay();
  </script>
</body>
</html>`;

  return (
    <div style={{padding: 0, margin: 0}}>
      <iframe
        title="Onboarding Reference"
        srcDoc={html}
        style={{border: "0", width: "100%", height: "100vh"}}
      />
    </div>
  );
}