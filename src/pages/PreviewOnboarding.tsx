import React from "react";

/** Signals AI — Onboarding: Connect GBP (Apple/Tesla polish) — Single-file, self-contained */
type Status = "empty" | "loading" | "success" | "error";

const colors = {
  navy: "#0D1321",
  cobalt: "#244EE6",
  teal: "#06B6D4",
  muted: "#475569",
  slate: "#F1F5F9",
  card: "#FFFFFF",
  border: "#E5E7EB",
};

const page: React.CSSProperties = {
  minHeight: "100vh",
  padding: 24,
  color: colors.navy,
  fontFamily:
    "'Plus Jakarta Sans', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, sans-serif",
  background: `radial-gradient(1200px 600px at 20% -10%, rgba(36,78,230,.08), transparent 60%),
               radial-gradient(1200px 600px at 80% 10%, rgba(6,182,212,.08), transparent 60%),
               ${colors.slate}`,
};

const shell: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "3fr 1fr",
  gap: 24,
  alignItems: "start",
  maxWidth: 1200,
  margin: "0 auto",
};

const card: React.CSSProperties = {
  background: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: 20,
  padding: 20,
  boxShadow: "0 18px 48px rgba(2,8,23,.06)",
};

const h1: React.CSSProperties = {
  margin: 0,
  fontSize: 34,
  lineHeight: 1.2,
  fontWeight: 800,
  letterSpacing: "-0.02em",
};

const sub: React.CSSProperties = {
  margin: "10px 0 18px",
  color: colors.muted,
  maxWidth: 720,
  fontSize: 16,
};

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
  margin: "6px 0 6px",
};

const formRow: React.CSSProperties = { display: "flex", gap: 12, marginTop: 10 };
const input: React.CSSProperties = {
  flex: 1,
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #CBD5E1",
  fontSize: 14,
  outline: "none",
};
const cta: React.CSSProperties = {
  background: colors.teal,
  color: "#fff",
  border: "none",
  padding: "12px 18px",
  borderRadius: 12,
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(6,182,212,.35)",
  transition: "transform .15s ease, box-shadow .2s ease, opacity .2s ease",
};

const chipsRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 12,
  flexWrap: "wrap",
};
const chip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 9999,
  background: "#F8FAFC",
  border: `1px solid ${colors.border}`,
  color: colors.navy,
  fontSize: 12,
  fontWeight: 700,
};

const sidebarCard: React.CSSProperties = {
  ...card,
  position: "sticky",
  top: 16,
};

function GBP() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-label="Google Business Profile">
      <rect x="8" y="8" width="48" height="48" rx="12" fill="#4285F4" />
      <text x="32" y="38" textAnchor="middle" fontSize="16" fontWeight="700" fill="#FFFFFF">
        GBP
      </text>
    </svg>
  );
}

function SIG() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-label="Signals">
      <rect x="8" y="8" width="48" height="48" rx="12" fill={colors.teal} />
      <text x="32" y="38" textAnchor="middle" fontSize="14" fontWeight="700" fill={colors.navy}>
        Signals
      </text>
    </svg>
  );
}

function Pulse() {
  return (
    <svg width="80" height="28" viewBox="0 0 80 28" aria-hidden="true">
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stopColor="#94A3B8" stopOpacity=".3" />
          <stop offset="100%" stopColor={colors.cobalt} stopOpacity=".9" />
        </linearGradient>
      </defs>
      <path d="M4 14 H68" stroke="url(#g)" strokeWidth="2">
        <animate attributeName="stroke-opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </path>
      <path d="M68 8 L76 14 L68 20" fill="none" stroke={colors.cobalt} strokeWidth="2" />
    </svg>
  );
}

function State({ icon, text }: { icon: "empty" | "spinner" | "check" | "error"; text: string }) {
  const ico =
    icon === "spinner" ? (
      <div
        style={{
          width: 16,
          height: 16,
          marginRight: 8,
          border: "2px solid #CBD5E1",
          borderTopColor: colors.cobalt,
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
    ) : icon === "check" ? (
      <div style={{ width: 16, height: 16, marginRight: 8, background: "#10B981", borderRadius: 4 }} />
    ) : icon === "error" ? (
      <div style={{ width: 16, height: 16, marginRight: 8, background: "#EF4444", borderRadius: 4 }} />
    ) : (
      <div style={{ width: 16, height: 16, marginRight: 8, background: "#CBD5E1", borderRadius: 4 }} />
    );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 14px",
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        background: "#fff",
        marginBottom: 8,
      }}
    >
      {ico}
      <span style={{ color: colors.navy, fontSize: 14, fontWeight: 500 }}>{text}</span>
    </div>
  );
}

export default function OnboardingPreviewRoute() {
  const [status, setStatus] = React.useState<Status>("empty");

  return (
    <div style={page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Dev-only state toggles (keeps preview ribbon out of the equation) */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          margin: "0 auto 16px",
          display: "flex",
          gap: 8,
          alignItems: "center",
          justifyContent: "center",
          maxWidth: 1200,
          padding: "6px 12px",
          borderRadius: 9999,
          background: "rgba(13,19,33,.06)",
          backdropFilter: "saturate(140%) blur(6px)",
        }}
      >
        <small style={{ opacity: 0.75 }}>State:</small>
        {(["empty", "loading", "success", "error"] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            style={{
              border: `1px solid ${s === status ? colors.cobalt : "#334155"}`,
              background: s === status ? "rgba(36,78,230,.12)" : "transparent",
              color: colors.navy,
              borderRadius: 999,
              fontSize: 12,
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={shell}>
        {/* LEFT 3fr */}
        <div>
          <h1 style={h1}>Connect Your Google Business Profile</h1>
          <p style={sub}>See patient opportunities flow into your dashboard instantly.</p>

          <div style={card}>
            <div style={row}>
              <GBP />
              <Pulse />
              <SIG />
            </div>

            <form style={formRow} onSubmit={(e) => e.preventDefault()}>
              <input style={input} placeholder="Google Business Email" type="email" />
              <button
                style={cta as React.CSSProperties}
                type="button"
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)")}
              >
                Connect My GBP
              </button>
            </form>

            <div style={chipsRow}>
              <span style={chip}>🔒 Secure connection</span>
              <span style={chip}>🙈 Read-only access</span>
              <span style={chip}>⏱️ Updated in real time</span>
            </div>
          </div>

          {/* One state visible at a time */}
          <div style={{ marginTop: 16 }}>
            {status === "empty" && <State icon="empty" text="No GBP connected yet → Connect now to unlock patient journey insights." />}
            {status === "loading" && <State icon="spinner" text="Connecting your profile…" />}
            {status === "success" && <State icon="check" text="Connected! Pulling your first patient opportunities." />}
            {status === "error" && (
              <div style={{ ...card, marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 16, height: 16, background: "#EF4444", borderRadius: 4 }} />
                  <strong style={{ color: colors.navy, fontSize: 14 }}>
                    We couldn't connect — please check your email or try again.
                  </strong>
                </div>
                <input
                  placeholder="you@example.com"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid #EF4444", outline: "none" }}
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 1fr */}
        <div>
          <div style={sidebarCard}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: colors.navy }}>Why GBP?</h3>
            <p style={{ marginTop: 8, color: colors.muted, lineHeight: 1.55 }}>
              Most patients find practices on Google. By connecting, you'll see leads and consults tracked automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { OnboardingPreviewRoute as PreviewOnboarding };