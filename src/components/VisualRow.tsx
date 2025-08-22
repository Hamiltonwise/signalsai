import React from "react";
const GBP=()=>(
  <svg width="64" height="64" viewBox="0 0 64 64" aria-label="GBP logo">
    <rect x="8" y="8" width="48" height="48" rx="12" fill="#4285F4"/>
    <text x="32" y="38" textAnchor="middle" fontSize="16" fontWeight="700" fill="#FFF">GBP</text>
  </svg>
);
const Signals=()=>(
  <svg width="64" height="64" viewBox="0 0 64 64" aria-label="Signals logo">
    <rect x="8" y="8" width="48" height="48" rx="12" fill="#06B6D4"/>
    <text x="32" y="38" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0D1321">Signals</text>
  </svg>
);
const Pulse=()=>(
  <svg width="64" height="24" viewBox="0 0 64 24" aria-hidden="true">
    <defs>
      <linearGradient id="g" x1="0" x2="1">
        <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.4"/>
        <stop offset="100%" stopColor="#244EE6" stopOpacity="0.9"/>
      </linearGradient>
    </defs>
    <path d="M2 12 H58" stroke="url(#g)" strokeWidth="2">
      <animate attributeName="stroke-opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite"/>
    </path>
    <path d="M58 6 L62 12 L58 18" fill="none" stroke="#244EE6" strokeWidth="2"/>
  </svg>
);
export default function VisualRow(){
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,margin:"12px 0 8px"}}>
      <GBP/><Pulse/><Signals/>
    </div>
  );
}