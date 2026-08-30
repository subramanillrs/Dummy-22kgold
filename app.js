(() => {
  const $ = id => document.getElementById(id);
  const fmt = n => Number.isFinite(n) ? "₹" + n.toLocaleString("en-IN",{maximumFractionDigits:2}) : "₹—";
  let all = [];

  function normalize(rows){
    return rows.map(r => {
      const date = r.date || r.Date;
      const am = Number(r.am ?? r.gold_916_am ?? r.gold916_am ?? r.gold_916_AM);
      const pm = Number(r.pm ?? r.gold_916_pm ?? r.gold916_pm ?? r.gold_916_PM);
      const value = Number.isFinite(pm) && pm > 0 ? pm : am;
      return {date, am, pm, value};
    }).filter(r => r.date && Number.isFinite(r.value) && r.value > 0)
      .sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  }

  function latest(rows){
    return rows.length ? rows[rows.length-1] : null;
  }

  function draw(rows){
    const svg=$("chart"); svg.innerHTML="";
    if(!rows.length){$("rangeSummary").textContent="No chart data";return;}
    const W=720,H=300,p={l:54,r:18,t:20,b:38};
    const vals=rows.map(r=>r.value), min=Math.min(...vals), max=Math.max(...vals);
    const span=max-min || Math.max(max*.01,1);
    const x=i=>p.l+(i/(Math.max(rows.length-1,1)))*(W-p.l-p.r);
    const y=v=>p.t+(1-(v-min)/span)*(H-p.t-p.b);
    [0,.5,1].forEach(t=>{
      const yy=p.t+t*(H-p.t-p.b);
      svg.insertAdjacentHTML("beforeend",`<line class="gridline" x1="${p.l}" x2="${W-p.r}" y1="${yy}" y2="${yy}"/>`);
    });
    const pts=rows.map((r,i)=>`${x(i)},${y(r.value)}`).join(" ");
    svg.insertAdjacentHTML("beforeend",`<polyline class="line" points="${pts}"/>`);
    [0,Math.floor((rows.length-1)/2),rows.length-1].forEach(i=>{
      svg.insertAdjacentHTML("beforeend",`<text class="axis" x="${x(i)}" y="${H-12}" text-anchor="${i===0?"start":i===rows.length-1?"end":"middle"}">${String(rows[i].date).slice(0,10)}</text>`);
    });
    svg.insertAdjacentHTML("beforeend",`<text class="axis" x="${p.l-8}" y="${p.t+5}" text-anchor="end">${fmt(max/10)}</text><text class="axis" x="${p.l-8}" y="${H-p.b+5}" text-anchor="end">${fmt(min/10)}</text>`);
  }

  function render(){
    const days=$("range").value;
    const rows=days==="all"?all:all.slice(-Number(days));
    const r=latest(rows); if(!r)return;
    $("price1").textContent=fmt(r.value/10);
    $("price8").textContent=fmt(r.value*.8);
    $("price10").textContent=fmt(r.value);
    $("am").textContent=fmt(r.am);
    $("pm").textContent=fmt(r.pm);
    const prev=rows.length>1?rows[rows.length-2].value:null;
    if(Number.isFinite(prev)){
      const d=r.value-prev,pct=d/prev*100;
      $("change").textContent=`${d>=0?"▲":"▼"} ${fmt(Math.abs(d/10))} / gram (${pct>=0?"+":""}${pct.toFixed(2)}%)`;
    } else $("change").textContent="No previous record";
    $("updated").textContent=`Latest source date: ${r.date}`;
    const vals=rows.map(x=>x.value/10);
    $("high").textContent=fmt(Math.max(...vals));
    $("low").textContent=fmt(Math.min(...vals));
    $("avg").textContent=fmt(vals.reduce((a,b)=>a+b,0)/vals.length);
    $("records").textContent=String(rows.length);
    $("rangeSummary").textContent=`${rows[0].date} → ${r.date}`;
    draw(rows);
  }

  async function load(){
    $("status").textContent="Loading historical data…";
    try{
      const res=await fetch("data/gold-history.json",{cache:"no-store"});
      if(!res.ok)throw new Error("HTTP "+res.status);
      const data=await res.json();
      all=normalize(Array.isArray(data)?data:(data.records||[]));
      render();
      $("status").textContent=`Loaded ${all.length} verified records.`;
    }catch(e){
      $("status").textContent="Unable to load the local historical dataset.";
    }
  }
  $("range").addEventListener("change",render);
  $("refreshBtn").addEventListener("click",load);
  load();
})();