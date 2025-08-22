import React from "react";
import Chip from "./Chip";
import StateBlock from "./StateBlock";
import HelperSidebar from "./HelperSidebar";
import VisualRow from "./VisualRow";

export default function Onboarding(){
  return (
    <div style={{display:"grid",gridTemplateColumns:"3fr 1fr",gap:24,alignItems:"start"}}>
      {/* LEFT 3fr */}
      <div>
        <h1 style={{margin:0,fontSize:32,fontWeight:800,color:"#0D1321"}}>Connect Your Google Business Profile</h1>
        <p style={{margin:"8px 0 16px",color:"#475569",maxWidth:700,fontSize:16}}>
          See patient opportunities flow into your dashboard instantly.
        </p>

        <div style={{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:16,padding:16,boxShadow:"0 10px 24px rgba(2,8,23,0.06)"}}>
          <VisualRow/>

          <form style={{display:"flex",gap:12,marginTop:8}}>
            <input type="email" placeholder="Google Business Email" style={{
              flex:1,padding:"12px 14px",borderRadius:12,border:"1px solid #CBD5E1",fontSize:14
            }}/>
            <button type="button" style={{
              background:"#06B6D4",color:"#FFFFFF",border:"none",
              padding:"12px 18px",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",
              boxShadow:"0 6px 16px rgba(6,182,212,0.35)"
            }}>Connect My GBP</button>
          </form>

          <div style={{display:"flex",gap:8,marginTop:10}}>
            <Chip>🔒 Secure connection</Chip>
            <Chip>🙈 Read-only access</Chip>
            <Chip>⏱️ Updated in real time</Chip>
          </div>
        </div>

        {/* STATES (stacked) */}
        <section style={{marginTop:16}}>
          <StateBlock icon="empty"   title="No GBP connected yet → Connect now to unlock patient journey insights." />
          <StateBlock icon="spinner" title="Connecting your profile…" />
          <StateBlock icon="check"   title="Connected! Pulling your first patient opportunities." />
          <div style={{border:"1px solid #E5E7EB",borderRadius:16,padding:12,background:"#FFF",marginTop:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{width:16,height:16,background:"#EF4444",borderRadius:4}}/>
              <strong style={{color:"#0D1321", fontSize:14}}>We couldn't connect — please check your email or try again.</strong>
            </div>
            <input style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"2px solid #EF4444"}} placeholder="you@example.com"/>
          </div>
        </section>
      </div>

      {/* RIGHT 1fr */}
      <div>
        <HelperSidebar title="Why GBP?">
          Most patients find practices on Google. By connecting, you'll see leads and consults tracked automatically.
        </HelperSidebar>
      </div>
    </div>
  );
}