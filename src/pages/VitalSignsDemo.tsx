import React from "react";

/** Signals AI — Dashboard: Vital Signs (Apple/Tesla polish) — Single-file, self-contained
 *  Three premium metric cards: New Patients, Website Visitors, Conversion Rate.
 *  No external assets. Inline styles. Responsive. Subtle motion. Exact brand palette.
 */

const color = {
  navy:  "#0D1321",
  cobalt:"#244EE6",
  teal:  "#06B6D4",
  muted: "#475569",
  slate: "#F1F5F9",
  card:  "#FFFFFF",
  border:"#E5E7EB",
};

const page: React.CSSProperties = {
  minHeight:"100vh",
  padding:24,
  color:color.navy,
  fontFamily:"'Plus Jakarta Sans', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, sans-serif",
  background: `
    radial-gradient(1200px 600px at 15% -10%, rgba(36,78,230,.08), transparent 60%),
    radial-gradient(1200px 600px at 85%  10%, rgba(6,182,212,.08), transparent 60%),
    ${color.slate}
  `,
};

const wrap: React.CSSProperties = { maxWidth:1200, margin:"0 auto" };

const h1: React.CSSProperties = {
  margin:0, fontSize:34, lineHeight:1.2, fontWeight:800, letterSpacing:"-0.02em"
};
const sub: React.CSSProperties = {
  margin:"8px 0 20px", color:color.muted, fontSize:16, maxWidth:720
};

const grid: React.CSSProperties = {
  display:"grid",
  gridTemplateColumns:"repeat(3, minmax(0,1fr))",
  gap:16,
};
const gridMobile: React.CSSProperties = { display:"grid", gridTemplateColumns:"1fr", gap:16 };

const card: React.CSSProperties = {
  background:color.card,
  border:`1px solid ${color.border}`,
  borderRadius:20,
  padding:"20px 20px",
  boxShadow:"0 18px 48px rgba(2,8,23,.06)",
  transition:"transform .16s ease, box-shadow .2s ease, border-color .2s ease",
};
const cardHover: React.CSSProperties = {
  transform:"translateY(-2px)",
  boxShadow:"0 24px 64px rgba(2,8,23,.12)",
  borderColor:"rgba(36,78,230,.35)"
};

const metricValue: React.CSSProperties = {
  fontSize:40, lineHeight:1.1, fontWeight:900, letterSpacing:"-0.02em"
};
const metricLabel: React.CSSProperties = {
  marginTop:8,
  fontSize:12,
  letterSpacing:"0.08em",
  textTransform:"uppercase",
  color:"#64748B",
  fontWeight:800
};

function MetricCard({value, label, accent}:{value:string; label:string; accent:"teal"|"cobalt"}) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{ ...card, ...(hover ? cardHover : null) }}
    >
      {/* Accent bar */}
      <div style={{
        height:6,
        width:"100%",
        borderRadius:9999,
        background: accent==="teal"
          ? `linear-gradient(90deg, ${color.teal}, rgba(6,182,212,.25))`
          : `linear-gradient(90deg, ${color.cobalt}, rgba(36,78,230,.25))`,
        marginBottom:14
      }}/>
      <div style={{display:"flex", alignItems:"baseline", gap:10}}>
        <div style={{...metricValue, color: accent==="teal" ? color.navy : color.navy}}>
          {value}
        </div>
      </div>
      <div style={metricLabel}>{label}</div>
    </div>
  );
}

export default function VitalsPreviewRoute(){
  // simple mobile detection for reference preview only
  const isMobile = typeof window !== "undefined" && window.innerWidth < 980;

  return (
    <div style={page}>
      <style>{`
        @media (max-width: 980px) {
          .vital-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={wrap}>
        <header style={{marginBottom:16}}>
          <h1 style={h1}>Vital Signs</h1>
          <p style={sub}>Your practice at a glance.</p>
        </header>

        <section className="vital-grid" style={isMobile ? gridMobile : grid}>
          <MetricCard value="22"    label="New Patients"     accent="teal"   />
          <MetricCard value="1,340" label="Website Visitors" accent="cobalt" />
          <MetricCard value="4.2%"  label="Conversion Rate"  accent="teal"   />
        </section>

        {/* Guidance note for the reference (not client-facing) */}
        <div style={{marginTop:18, fontSize:12, color:"#64748B"}}>
          Reference preview — single screen. No data wiring. Apple/Tesla polish: rounded 20px, soft shadows, accent bar, hover lift.
        </div>
      </div>
    </div>
  );
}