import React from "react";
import OnboardingModal from "./OnboardingModal";

export default function DevPreviewRibbon(){
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <div
        id="dev-preview-ribbon"
        data-preview-ribbon="true"
        style={{
          position:"sticky", top:0, zIndex:60, width:"100%",
          background:"#0D1321", color:"#E2E8F0", padding:"6px 12px",
          display:"flex", gap:12, alignItems:"center", fontSize:12
        }}>
        <span style={{opacity:0.8}}>Preview:</span>
        <button onClick={()=>setOpen(true)} style={{border:"1px solid #334155", background:"transparent", color:"#E2E8F0", borderRadius:8, padding:"4px 8px", cursor:"pointer"}}>Onboarding (modal)</button>
        <a href="/preview/onboarding" style={{border:"1px solid #334155", borderRadius:8, padding:"4px 8px", color:"#E2E8F0", textDecoration:"none"}}>Onboarding (full page)</a>
      </div>
      <style>{`[data-preview-ribbon="true"] ~ [data-preview-ribbon="true"]{display:none!important}`}</style>
      {open ? <OnboardingModal onClose={()=>setOpen(false)}/> : null}
    </>
  );
}