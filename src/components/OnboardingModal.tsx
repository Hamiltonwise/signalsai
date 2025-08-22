import React from "react";
import Onboarding from "./Onboarding";
export default function OnboardingModal({ onClose }:{ onClose: ()=>void }){
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(13,19,33,0.35)",
      display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"48px 24px", zIndex:50
    }}>
      <div style={{width:"min(1100px, 96vw)", background:"#F8FAFC", borderRadius:24, padding:24, boxShadow:"0 12px 28px rgba(2,8,23,0.25)"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
          <div style={{fontWeight:800, color:"#0D1321"}}>Onboarding Preview</div>
          <button onClick={onClose} style={{border:"1px solid #E5E7EB", background:"#FFFFFF", borderRadius:10, padding:"6px 10px", cursor:"pointer"}}>Close</button>
        </div>
        <Onboarding/>
      </div>
    </div>
  );
}

export { OnboardingModal }