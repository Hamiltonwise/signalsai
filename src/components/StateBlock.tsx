import React from "react";
type Props = { icon:"empty"|"spinner"|"check"|"error"; title:string };
const Icon = ({ type }:{ type:Props["icon"] }) => {
  const b={ width:16, height:16, marginRight:8 };
  if (type==="spinner") return <div style={{...b,border:"2px solid #CBD5E1",borderTopColor:"#244EE6",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>;
  if (type==="check")   return <div style={{...b,background:"#10B981",borderRadius:4}}/>;
  if (type==="error")   return <div style={{...b,background:"#EF4444",borderRadius:4}}/>;
  return <div style={{...b,background:"#CBD5E1",borderRadius:4}}/>;
};
export default function StateBlock({ icon, title }:Props){
  return (
    <div style={{display:"flex",alignItems:"center",padding:"12px 14px",border:"1px solid #E5E7EB",borderRadius:16,background:"#FFF",marginBottom:8}}>
      <Icon type={icon}/>
      <span style={{color:"#0D1321",fontSize:14,fontWeight:500}}>{title}</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}