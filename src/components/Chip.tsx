import React from "react";
type ChipProps = { children: React.ReactNode };
export default function Chip({ children }: ChipProps) {
  return (
    <span
      style={{
        display:"inline-flex", alignItems:"center", gap:6,
        padding:"6px 10px", borderRadius:9999,
        background:"#F1F5F9", color:"#0D1321",
        fontSize:12, fontWeight:600, border:"1px solid #E5E7EB"
      }}
      role="status"
    >{children}</span>
  );
}