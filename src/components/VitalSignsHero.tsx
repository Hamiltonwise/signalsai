import React from "react";

/**
 * Signals AI — Vital Signs Hero Section (Apple/Tesla polish)
 * Three metric cards with premium styling and hover animations
 */

const colors = {
  navy: "#0D1321",
  cobalt: "#244EE6",
  teal: "#06B6D4",
  muted: "#6B7280",
  card: "#FFFFFF",
  border: "#E5E7EB",
};

const containerStyle: React.CSSProperties = {
  padding: "32px 0",
  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, sans-serif",
  color: colors.navy,
};

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: 32,
};

const h1Style: React.CSSProperties = {
  margin: 0,
  fontSize: 36,
  fontWeight: 800,
  color: colors.navy,
  letterSpacing: "-0.02em",
  marginBottom: 8,
};

const subheadStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  color: colors.muted,
  fontWeight: 500,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 24,
  maxWidth: 1200,
  margin: "0 auto",
  padding: "0 24px",
};

const cardStyle: React.CSSProperties = {
  background: colors.card,
  borderRadius: 16,
  padding: 32,
  boxShadow: "0 4px 24px rgba(2, 8, 23, 0.08)",
  border: `1px solid ${colors.border}`,
  textAlign: "center",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  cursor: "default",
};

const headlineStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 48,
  fontWeight: 800,
  color: colors.navy,
  lineHeight: 1,
  marginBottom: 12,
  letterSpacing: "-0.02em",
};

const labelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: colors.muted,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

interface MetricCardProps {
  headline: string;
  label: string;
  accentColor?: string;
}

function MetricCard({ headline, label, accentColor = colors.cobalt }: MetricCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const cardHoverStyle: React.CSSProperties = {
    ...cardStyle,
    transform: isHovered ? "translateY(-8px)" : "translateY(0)",
    boxShadow: isHovered 
      ? "0 20px 40px rgba(2, 8, 23, 0.15)" 
      : "0 4px 24px rgba(2, 8, 23, 0.08)",
  };

  const headlineHoverStyle: React.CSSProperties = {
    ...headlineStyle,
    color: isHovered ? accentColor : colors.navy,
  };

  return (
    <div
      style={cardHoverStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={headlineHoverStyle}>{headline}</div>
      <div style={labelStyle}>{label}</div>
    </div>
  );
}

export default function VitalSignsHero() {
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={h1Style}>Vital Signs</h1>
        <p style={subheadStyle}>Your practice at a glance</p>
      </div>
      
      <div style={gridStyle}>
        <MetricCard 
          headline="22" 
          label="New Patients" 
          accentColor={colors.teal}
        />
        <MetricCard 
          headline="1,340" 
          label="Website Visitors" 
          accentColor={colors.cobalt}
        />
        <MetricCard 
          headline="4.2%" 
          label="Conversion Rate" 
          accentColor={colors.teal}
        />
      </div>
    </div>
  );
}