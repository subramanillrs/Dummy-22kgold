// GitHub Actions updater.
// The repository intentionally does not fabricate historical values.
// Fetch the IBJA API, validate 916 AM/PM, then append only a new valid record.
const fs=require("fs");
const API="https://ibja-api.vercel.app/latest";
async function main(){
  const res=await fetch(API,{headers:{"user-agent":"gold-price-22k/1.0"}});
  if(!res.ok) throw new Error(`IBJA API HTTP ${res.status}`);
  const d=await res.json();
  const am=Number(d.lblGold916_AM), pm=Number(d.lblGold916_PM);
  if(!Number.isFinite(am)||am<=0) throw new Error("Invalid 916 AM rate");
  if(pm!==0 && (!Number.isFinite(pm)||pm<0)) throw new Error("Invalid 916 PM rate");
  const file="data/gold-history.json";
  const db=JSON.parse(fs.readFileSync(file,"utf8"));
  const records=Array.isArray(db.records)?db.records:[];
  const date=d.date;
  const existing=records.find(x=>x.date===date);
  if(existing){existing.am=am;if(pm>0)existing.pm=pm;}
  else records.push({date,am,pm:pm>0?pm:null});
  records.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  db.records=records;
  db.lastUpdated=new Date().toISOString();
  fs.writeFileSync(file,JSON.stringify(db,null,2)+"\n");
}
main().catch(e=>{console.error(e);process.exit(1)});