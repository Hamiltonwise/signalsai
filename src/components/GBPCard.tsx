import React from "react";

/** Google Business Profile (GBP) Card — Onboarding */
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

const labelStyle: React.CSSProperties = {
  fontSize: 16,
  color: colors.muted,
  fontWeight: 600,
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: colors.teal,
  color: colors.card,
  borderRadius: 9999,
  padding: "12px 24px",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all .2s ease-in-out",
  border: "none",
  textAlign: "center",
};

const buttonHoverStyle: React.CSSProperties = {
  transform: "scale(1.05)",
  boxShadow: "0 4px 12px rgba(6, 182, 212, 0.3)",
};

const HelperSidebar: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 24,
      right: 24,
      padding: 20,
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 12px 24px rgba(2,8,23,.1)",
      width: "300px",
    }}
  >
    <h3 style={{ fontSize: 18, fontWeight: 700 }}>Why GBP?</h3>
    <p style={{ fontSize: 14, color: colors.muted }}>
      Most patients find practices on Google. By connecting, you'll see leads and consults tracked automatically.
    </p>
  </div>
);

export default function GBPCard() {
  const [hover, setHover] = React.useState(false);

  return (
    <div style={pageStyle}>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
      >
        {/* Helper Sidebar */}
        <HelperSidebar />

        {/* GBP Card */}
        <div
          style={{ ...cardStyle, ...(hover ? cardHoverStyle : null) }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>Connect Your Google Business Profile</h2>
          <p style={{ fontSize: 16, color: colors.muted }}>See patient opportunities flow into your dashboard instantly.</p>
          
          {/* Connect Button */}
          <button style={{ ...buttonStyle, ...(hover ? buttonHoverStyle : null) }}>
            Connect My GBP
          </button>
        </div>
      </div>
    </div>
  );
}