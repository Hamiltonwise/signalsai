import React from "react";

/** Vital Signs Hero Card (Simplified) */
const colors = {
  navy: "#0D1321",
  cobalt: "#244EE6",
  teal: "#06B6D4",
  muted: "#475569",
  slate: "#F1F5F9",
  card: "#FFFFFF",
  border: "#E5E7EB",
};

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: 24,
  color: colors.navy,
  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, sans-serif",
  background: `radial-gradient(1200px 600px at 20% -10%, rgba(36,78,230,.08), transparent 60%),
               radial-gradient(1200px 600px at 80% 10%, rgba(6,182,212,.08), transparent 60%),
               ${colors.slate}`,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 16,
  maxWidth: 1200,
  margin: "0 auto",
};

const cardStyle: React.CSSProperties = {
  background: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: 20,
  padding: 20,
  boxShadow: "0 18px 48px rgba(2,8,23,.06)",
  transition: "transform .16s ease, box-shadow .2s ease, border-color .2s ease",
};

const cardHoverStyle: React.CSSProperties = {
  transform: "translateY(-2px)",
  boxShadow: "0 24px 64px rgba(2,8,23,.12)",
  borderColor: "rgba(36,78,230,.35)",
};

const metricValueStyle: React.CSSProperties = {
  fontSize: 40,
  lineHeight: 1.1,
  fontWeight: 900,
  letterSpacing: "-0.02em",
};

const metricLabelStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#64748B",
  fontWeight: 800,
};

function MetricCard({ value, label, accent }: { value: string; label: string; accent: "teal" | "cobalt" }) {
  return (
    <div style={cardStyle}>
      <div
        style={{
          height: 6,
          width: "100%",
          borderRadius: 9999,
          background:
            accent === "teal"
              ? `linear-gradient(90deg, ${colors.teal}, rgba(6,182,212,.25))`
              : `linear-gradient(90deg, ${colors.cobalt}, rgba(36,78,230,.25))`,
          marginBottom: 14,
        }}
      />
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <div style={metricValueStyle}>{value}</div>
      </div>
      <div style={metricLabelStyle}>{label}</div>
    </div>
  );
}

export default function VitalsHero() {
  return (
    <div style={pageStyle}>
      <div style={gridStyle}>
        <MetricCard value="22" label="New Patients" accent="teal" />
        <MetricCard value="1,340" label="Website Visitors" accent="cobalt" />
        <MetricCard value="4.2%" label="Conversion Rate" accent="teal" />
      </div>
    </div>
  );
}