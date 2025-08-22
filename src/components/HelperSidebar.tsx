import React from "react";
export default function HelperSidebar({ title, children }:{ title:string; children:React.ReactNode; }){
  return (
    <aside style={{
      width:"100%", background:"#FFFFFF", border:"1px solid #E5E7EB",
      borderRadius:16, padding:16, position:"sticky", top:16,
      boxShadow:"0 10px 24px rgba(2,8,23,0.08)"
    }}>
      <h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#0D1321"}}>{title}</h3>
      <p style={{marginTop:8,color:"#475569",lineHeight:1.5}}>{children}</p>
    </aside>
  );
}