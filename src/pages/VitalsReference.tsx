import React from "react";

/**
 * Signals AI — Vital Signs (Reference, Apple/Tesla Polish)
 * This route isolates styles in an <iframe srcDoc> so nothing in the app shell can override polish.
 * Step 1 (prove design): Use this reference iframe. 
 * Step 2 (port): After approval, we transplant the same CSS/markup into native TSX components.
 */

export default function VitalsReference() {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Signals — Vital Signs Reference</title>
<style>
  :root{
    --navy:#0D1321; --cobalt:#244EE6; --teal:#06B6D4;
    --muted:#475569; --slate:#F1F5F9; --card:#FFFFFF; --border:#E5E7EB;
    --r:20px;
  }
  *{box-sizing:border-box}
  body{
    margin:0; color:var(--navy);
    font-family:"Plus Jakarta Sans",system-ui,-apple-system,Segoe UI,Roboto,"Helvetica Neue",Arial,sans-serif;
    background:
      radial-gradient(1200px 600px at 15% -10%, rgba(36,78,230,.08), transparent 60%),
      radial-gradient(1200px 600px at 85%  10%, rgba(6,182,212,.08), transparent 60%),
      var(--slate);
    min-height:100vh; padding:24px;
  }
  .wrap{max-width:1200px;margin:0 auto}
  h1{margin:0;font-size:34px;line-height:1.2;font-weight:800;letter-spacing:-.02em}
  .sub{margin:8px 0 20px;color:var(--muted);font-size:16px;max-width:720px}
  .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
  @media (max-width:980px){ .grid{grid-template-columns:1fr} }
  .card{
    background:var(--card); border:1px solid var(--border); border-radius:var(--r);
    padding:20px; box-shadow:0 18px 48px rgba(2,8,23,.06);
    transition:transform .16s ease, box-shadow .2s ease, border-color .2s ease;
  }
  .card:hover{ transform:translateY(-2px); box-shadow:0 24px 64px rgba(2,8,23,.12); border-color:rgba(36,78,230,.35) }
  .bar{height:6px;width:100%;border-radius:9999px;margin-bottom:14px}
  .bar.teal{background:linear-gradient(90deg, var(--teal), rgba(6,182,212,.25))}
  .bar.cobalt{background:linear-gradient(90deg, var(--cobalt), rgba(36,78,230,.25))}
  .value{font-size:40px;line-height:1.1;font-weight:900;letter-spacing:-.02em}
  .label{margin-top:8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748B;font-weight:800}
  .note{margin-top:18px;font-size:12px;color:#64748B}
</style>
</head>
<body>
  <div class="wrap">
    <header style="margin-bottom:16px">
      <h1>Vital Signs</h1>
      <p class="sub">Your practice at a glance.</p>
    </header>

    <section class="grid">
      <div class="card">
        <div class="bar teal"></div>
        <div class="value">22</div>
        <div class="label">New Patients</div>
      </div>
      <div class="card">
        <div class="bar cobalt"></div>
        <div class="value">1,340</div>
        <div class="label">Website Visitors</div>
      </div>
      <div class="card">
        <div class="bar teal"></div>
        <div class="value">4.2%</div>
        <div class="label">Conversion Rate</div>
      </div>
    </section>

    <div class="note">Reference preview — single screen. Rounded 20px, soft shadows, accent bar, hover lift. Brand palette locked.</div>
  </div>
</body>
</html>`;

  return (
    <div style={{padding: 0, margin: 0}}>
      <iframe
        title="Vital Signs Reference"
        srcDoc={html}
        style={{border: "0", width: "100%", height: "100vh"}}
        // sandbox is optional here; leave relaxed to allow fonts/animations
      />
    </div>
  );
}