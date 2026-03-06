import { useState, useMemo } from "react";

const MODELS = {
  "Qwen3-235B-A22B-Instruct": { label: "Qwen3-235B-A22B-Instruct", tp: 235, ap: 22, moe: true, vF8: 240, vBF: 470, tF8: 70, tBF: 45, gF8: 4, gBF: 8, ctx: 32768, ctxM: 131072, note: "MoE 128e/8a. Non-thinking. TP8 BF16 / TP4 FP8", tk: 0 },
  "Qwen3-235B-A22B-Thinking": { label: "Qwen3-235B-Thinking-2507", tp: 235, ap: 22, moe: true, vF8: 240, vBF: 470, tF8: 50, tBF: 30, gF8: 4, gBF: 8, ctx: 32768, ctxM: 262144, note: "Thinking-only. Reasoning chains 3-10x output", tk: 4 },
  "Qwen3-30B-A3B-Thinking": { label: "Qwen3-30B-A3B-Thinking", tp: 30, ap: 3, moe: true, vF8: 32, vBF: 60, tF8: 180, tBF: 120, gF8: 1, gBF: 1, ctx: 32768, ctxM: 131072, note: "MoE 1 GPU. Thinking для рутинных задач", tk: 3 },
  "Qwen3-Coder-30B": { label: "Qwen3-Coder-30B", tp: 30, ap: 30, moe: false, vF8: 32, vBF: 60, tF8: 130, tBF: 80, gF8: 1, gBF: 1, ctx: 32768, ctxM: 131072, note: "Dense 30B, оптимизирована под код", tk: 0 },
  "Qwen3-32B": { label: "Qwen3-32B (dense)", tp: 32, ap: 32, moe: false, vF8: 34, vBF: 64, tF8: 120, tBF: 70, gF8: 1, gBF: 1, ctx: 32768, ctxM: 131072, note: "Dense 32B, универсальная", tk: 0 },
  "Qwen3-14B": { label: "Qwen3-14B", tp: 14, ap: 14, moe: false, vF8: 15, vBF: 28, tF8: 250, tBF: 150, gF8: 1, gBF: 1, ctx: 32768, ctxM: 131072, note: "Dense 14B, быстрая для простых задач", tk: 0 },
  "Qwen3-8B": { label: "Qwen3-8B", tp: 8, ap: 8, moe: false, vF8: 9, vBF: 16, tF8: 350, tBF: 200, gF8: 1, gBF: 1, ctx: 32768, ctxM: 131072, note: "Dense 8B, минимальные ресурсы", tk: 0 },
  "Qwen2.5-72B-Instruct": { label: "Qwen2.5-72B-Instruct", tp: 72, ap: 72, moe: false, vF8: 75, vBF: 144, tF8: 40, tBF: 22, gF8: 1, gBF: 2, ctx: 32768, ctxM: 131072, note: "Dense 72B, предыдущее поколение", tk: 0 },
  "Qwen2.5-Coder-32B": { label: "Qwen2.5-Coder-32B", tp: 32, ap: 32, moe: false, vF8: 34, vBF: 64, tF8: 120, tBF: 70, gF8: 1, gBF: 1, ctx: 32768, ctxM: 131072, note: "Кодерская модель предыдущего поколения", tk: 0 },
  "DeepSeek-R1-671B": { label: "DeepSeek-R1 (671B MoE)", tp: 671, ap: 37, moe: true, vF8: 680, vBF: 1340, tF8: 30, tBF: 15, gF8: 8, gBF: 16, ctx: 65536, ctxM: 131072, note: "MoE 256e. Thinking. Очень большой VRAM", tk: 5 },
  "DeepSeek-V3-671B": { label: "DeepSeek-V3 (671B MoE)", tp: 671, ap: 37, moe: true, vF8: 680, vBF: 1340, tF8: 35, tBF: 18, gF8: 8, gBF: 16, ctx: 65536, ctxM: 131072, note: "MoE 256e. Non-thinking", tk: 0 },
  "Llama-3.1-70B": { label: "Llama 3.1 70B", tp: 70, ap: 70, moe: false, vF8: 72, vBF: 140, tF8: 40, tBF: 25, gF8: 1, gBF: 2, ctx: 131072, ctxM: 131072, note: "Meta dense 70B", tk: 0 },
  "Llama-3.1-8B": { label: "Llama 3.1 8B", tp: 8, ap: 8, moe: false, vF8: 9, vBF: 16, tF8: 350, tBF: 200, gF8: 1, gBF: 1, ctx: 131072, ctxM: 131072, note: "Meta dense 8B, быстрая", tk: 0 },
  "Mistral-Large-123B": { label: "Mistral Large 2 (123B)", tp: 123, ap: 123, moe: false, vF8: 125, vBF: 246, tF8: 22, tBF: 12, gF8: 2, gBF: 4, ctx: 32768, ctxM: 131072, note: "Dense 123B, многоязычная", tk: 0 },
  "Mixtral-8x22B": { label: "Mixtral 8x22B (MoE)", tp: 141, ap: 39, moe: true, vF8: 80, vBF: 150, tF8: 60, tBF: 35, gF8: 1, gBF: 2, ctx: 65536, ctxM: 65536, note: "MoE 8 experts", tk: 0 },
};

const TIERS = {
  agents: { label: "Агенты (Codex, Cline, OpenCode...)", icon: "\u{1F916}", color: "#2563eb",
    defs: { people: 100, skill: "intermediate", sessionsPerDay: 3, inputPerSession: 12000, outputPerSession: 6000, concurrency: 0.20, chain: 8, model: "Qwen3-235B-A22B-Instruct" },
    desc: "Автономные кодинг-агенты: многошаговые цепочки, tool-calling, длинные сессии" },
  complex: { label: "Чат: сложные задачи", icon: "\u{1F9E0}", color: "#7c3aed",
    defs: { people: 300, skill: "intermediate", sessionsPerDay: 4, inputPerSession: 4000, outputPerSession: 2500, concurrency: 0.10, chain: 1, model: "Qwen3-235B-A22B-Instruct" },
    desc: "Аналитика, рефакторинг, длинные документы, итеративные диалоги" },
  simple: { label: "Чат: простые задачи", icon: "\u{1F4AC}", color: "#059669",
    defs: { people: 3500, skill: "intermediate", sessionsPerDay: 20, inputPerSession: 1500, outputPerSession: 800, concurrency: 0.06, chain: 1, model: "Qwen3-Coder-30B" },
    desc: "Q&A, переводы, саммари, письма" },
};

const SKILLS = {
  beginner: { label: "Новички", m: 1.6, d: "Неточные промпты, повторные запросы, не используют шаблоны/память" },
  intermediate: { label: "Средний", m: 1.2, d: "Умеют формулировать, используют контекст, но не оптимально" },
  advanced: { label: "Продвинутые", m: 1.0, d: "Эффективные промпты, память, минимум повторов" },
};

const GPUS = {
  "H100 80GB": { vram: 80, price: 32000, label: "H100 80GB" },
  "H200 141GB": { vram: 141, price: 38000, label: "H200 141GB" },
  "A100 80GB": { vram: 80, price: 15000, label: "A100 80GB" },
  "L40S 48GB": { vram: 48, price: 7000, label: "L40S 48GB" },
};

const ADOPT = [{ m: 0, f: 0.12 },{ m: 3, f: 0.30 },{ m: 6, f: 0.52 },{ m: 9, f: 0.72 },{ m: 12, f: 0.88 },{ m: 18, f: 1.0 }];
const adoptAt = mo => { if(mo<=0) return .12; if(mo>=18) return 1; for(let i=0;i<ADOPT.length-1;i++){const a=ADOPT[i],b=ADOPT[i+1]; if(mo>=a.m&&mo<=b.m){const t=(mo-a.m)/(b.m-a.m); return a.f+t*(b.f-a.f);}} return 1; };

const CHAIN_REF = [
  { tool: "OpenCode", chain: 8, note: "LSP + bash + edit loop, средняя автономность" },
  { tool: "Cline", chain: 6, note: "Human-in-the-loop, approve каждый шаг" },
  { tool: "Claude Code", chain: 12, note: "Высокая автономность, длинные цепочки" },
  { tool: "Codex CLI", chain: 10, note: "Cloud tasks, параллельные подзадачи" },
  { tool: "Aider", chain: 4, note: "Git-native, короткие циклы edit-commit" },
  { tool: "Cursor Agent", chain: 5, note: "IDE-integrated, subagent-система" },
];

const RUB = 78;
const s = {
  card: { background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:18, marginBottom:14, boxShadow:"0 1px 3px rgba(0,0,0,.04)" },
  lbl: { fontSize:12, color:"#64748b", fontWeight:600, marginBottom:3, display:"block" },
  inp: { padding:"6px 10px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:6, color:"#1e293b", fontSize:14, fontFamily:"'JetBrains Mono',monospace", outline:"none" },
  sel: { padding:"6px 10px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:6, color:"#1e293b", fontSize:13 },
  h3: { fontSize:16, fontWeight:800, color:"#0f172a", margin:"0 0 4px" },
  sub: { fontSize:12, color:"#94a3b8", margin:"0 0 12px" },
  hint: { fontSize:10, color:"#94a3b8", lineHeight:1.4, marginTop:2 },
  mb: c=>({ background:`${c}08`, border:`1.5px solid ${c}30`, borderRadius:10, padding:"12px 16px", flex:"1 1 140px", minWidth:140 }),
  mv: c=>({ fontSize:24, fontWeight:800, color:c, fontFamily:"'JetBrains Mono',monospace" }),
  ml: { fontSize:10, color:"#64748b", fontWeight:600, textTransform:"uppercase", letterSpacing:".04em", marginBottom:2 },
  tag: c=>({ display:"inline-block", padding:"2px 7px", borderRadius:4, fontSize:11, fontWeight:600, background:`${c}18`, color:c, marginLeft:4 }),
  tip: { fontSize:11, color:"#475569", background:"#f1f5f9", borderRadius:6, padding:"8px 10px", marginTop:6, lineHeight:1.6 },
};

function NI({label,value,onChange,suffix,hint,w=100,min=0,step=1}){
  return <div style={{display:"flex",flexDirection:"column",gap:2}}>
    {label&&<span style={s.lbl}>{label}</span>}
    <div style={{display:"flex",alignItems:"center",gap:4}}>
      <input type="number" value={value} min={min} step={step} onChange={e=>onChange(+e.target.value||0)} style={{...s.inp,width:w}}/>
      {suffix&&<span style={{fontSize:11,color:"#94a3b8"}}>{suffix}</span>}
    </div>
    {hint&&<span style={s.hint}>{hint}</span>}
  </div>;
}
function Tog({label,checked,onChange}){
  return <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:"#475569",fontWeight:500}}>
    <div onClick={()=>onChange(!checked)} style={{width:38,height:20,borderRadius:10,background:checked?"#2563eb":"#cbd5e1",position:"relative",transition:".2s",cursor:"pointer",flexShrink:0}}>
      <div style={{width:16,height:16,borderRadius:8,background:"#fff",position:"absolute",top:2,left:checked?20:2,transition:".2s",boxShadow:"0 1px 2px rgba(0,0,0,.2)"}}/>
    </div>{label}
  </label>;
}

export default function Calc(){
  const [gpuKey,setGpuKey]=useState("H100 80GB");
  const [fp8,setFp8]=useState(false);
  const [ctx,setCtx]=useState(65536);
  const [ragOn,setRagOn]=useState(false);
  const [ragCh,setRagCh]=useState(4000);
  const [ragK,setRagK]=useState(5);
  const [burst,setBurst]=useState(2.5);
  const [ha,setHa]=useState(1.5);
  const [adM,setAdM]=useState(6);
  const [wH,setWH]=useState(8);
  const [pF,setPF]=useState(0.25);
  const [showM,setShowM]=useState(false);
  const [showChain,setShowChain]=useState(false);

  const [tiers,setTiers]=useState(()=>{const t={};for(const k of Object.keys(TIERS))t[k]={...TIERS[k].defs};return t;});
  const sT=(k,p)=>setTiers(prev=>({...prev,[k]:{...prev[k],...p}}));

  const gpu=GPUS[gpuKey];
  const ad=adoptAt(adM);

  const R=useMemo(()=>{
    let pTPS=0,dAll=0,conc=0;
    const bd={};
    const gpuSets={};

    for(const[k,t]of Object.entries(tiers)){
      if(t.people<=0){bd[k]={au:0,dT:0,dO:0,pT:0,cc:0,modelKey:t.model};continue;}
      const mo=MODELS[t.model];
      const sk=SKILLS[t.skill].m;
      const th=mo.tk||1;
      const ch=t.chain;
      const ragAdd=ragOn?ragCh*ragK:0;
      // DAU is already the real active user count — no adoption multiplier
      const au=t.people;
      const eI=(t.inputPerSession+ragAdd)*sk;
      const eO=t.outputPerSession*sk*(th>0?th:1);
      const eS=t.sessionsPerDay*sk;
      // chain multiplies daily token volume (sequential calls), NOT concurrency
      const dO=au*eS*eO*ch;
      const dI=au*eS*eI*ch;
      const dT=dO+dI;
      const pO=dT>0?dO*pF:0;
      const bT=pO/3600;
      const pT=bT*burst;
      // concurrency: chain does NOT multiply concurrent requests — agent calls are sequential
      const cc=Math.max(1,Math.ceil(au*t.concurrency*burst));
      bd[k]={au:Math.round(au),dT,dO,pT,cc,modelKey:t.model};
      pTPS+=pT;dAll+=dT;conc+=cc;

      const mk=t.model;
      if(!gpuSets[mk])gpuSets[mk]={pTPS:0,conc:0};
      gpuSets[mk].pTPS+=pT;
      gpuSets[mk].conc+=cc;
    }

    let totalGpus=0;
    const perModel={};
    for(const[mk,gs]of Object.entries(gpuSets)){
      const mo=MODELS[mk];
      const tps=fp8?mo.tF8:mo.tBF;
      const minG=fp8?mo.gF8:mo.gBF;
      const gThr=Math.max(minG,Math.ceil(gs.pTPS/tps)*minG);
      const kvB=mo.ap>50?.0015:mo.ap>10?.0006:.0002;
      const kvT=gs.conc*(ctx/1000)*kvB;
      const vM=fp8?mo.vF8:mo.vBF;
      const vF=Math.max(1,minG*gpu.vram-vM);
      const gMem=Math.max(minG,Math.ceil(kvT/vF)*minG);
      const gRaw=Math.max(gThr,gMem,minG);
      const gFin=Math.ceil(gRaw*ha);
      perModel[mk]={gFin,gRaw,gThr,gMem,kvT,tps,minG};
      totalGpus+=gFin;
    }

    const pBuy=totalGpus*gpu.price;
    const pBuyRub=pBuy*RUB;
    const totP=Object.values(tiers).reduce((a,t)=>a+t.people,0);
    const totA=totP; // DAU is already the active count
    const tl=ADOPT.map(a=>({...a,gpus:Math.max(1,Math.ceil(totalGpus*(a.f/Math.max(ad,.01))))}));
    const maxG=Math.ceil(totalGpus/ad);
    for(const t of tl)t.gpus=Math.min(t.gpus,maxG);

    return{pTPS,dAll,conc,totalGpus,bd,perModel,pBuy,pBuyRub,totP,totA,tl:[]};
  },[tiers,gpuKey,fp8,ctx,ragOn,ragCh,ragK,burst,ha,adM,pF,gpu,ad]);

  const fmt=n=>n>=1e9?(n/1e9).toFixed(1)+"B":n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(1)+"K":String(Math.round(n));
  const fmr=n=>{const v=Math.round(n);if(v>=1e9)return(v/1e9).toFixed(2)+" mlrd";if(v>=1e6)return(v/1e6).toFixed(1)+" mln";if(v>=1e3)return(v/1e3).toFixed(0)+"K";return String(v);};

  return <div style={{minHeight:"100vh",background:"#f1f5f9",color:"#1e293b",fontFamily:"'Inter',system-ui,sans-serif"}}>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
    <div style={{maxWidth:840,margin:"0 auto",padding:"20px 14px"}}>

    {/* HEADER */}
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
      <div style={{width:36,height:36,borderRadius:9,background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff"}}>{"⚡"}</div>
      <div><h1 style={{margin:0,fontSize:19,fontWeight:800,color:"#0f172a"}}>LLM Inference Capacity Planner</h1>
      <p style={{margin:0,fontSize:11,color:"#94a3b8"}}>On-prem GPU · Qwen3 + OSS · adoption · RAG · agents · skill levels · ₽</p></div>
    </div>

    {/* FORMULA */}
    <div style={s.card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h3 style={s.h3}>Формула пиковой нагрузки</h3>
        <button onClick={()=>setShowM(!showM)} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:6,padding:"3px 10px",fontSize:11,color:"#64748b",cursor:"pointer"}}>{showM?"Скрыть":"Методология"}</button>
      </div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"#475569",lineHeight:2.2,background:"#f8fafc",borderRadius:8,padding:12,marginTop:8}}>
        <div><b style={{color:"#dc2626"}}>Peak_TPS</b> = Σ<sub>tier</sub>( N × A(t) × S × O × Chain × Skill × Think ) / 3600 × P<sub>burst</sub></div>
        <div><b style={{color:"#dc2626"}}>GPU</b> = max( ⌈Peak_TPS / TPS<sub>replica</sub>⌉, ⌈KV_VRAM / VRAM<sub>free</sub>⌉ ) × R<sub>HA</sub></div>
      </div>
      <div style={{marginTop:10,fontSize:12,color:"#64748b",lineHeight:1.8}}>
        <div><b style={{color:"#334155"}}>N</b> — кол-во людей в роли (DAU)</div>
        <div><b style={{color:"#334155"}}>A(t)</b> — adoption curve: % людей, реально использующих AI на месяце t</div>
        <div><b style={{color:"#334155"}}>S</b> — сессий/день на человека</div>
        <div><b style={{color:"#334155"}}>O</b> — output-токенов на сессию (именно output, т.к. decode = основная нагрузка на GPU)</div>
        <div><b style={{color:"#334155"}}>Chain</b> — множитель агентных цепочек: 1 запрос юзера = N вызовов модели</div>
        <div><b style={{color:"#334155"}}>Skill</b> — множитель навыка (новички ×1.6, продвинутые ×1.0)</div>
        <div><b style={{color:"#334155"}}>Think</b> — множитель thinking-модели (reasoning в {"<think>"} блоках)</div>
        <div><b style={{color:"#334155"}}>P<sub>burst</sub></b> — пиковый множитель (запас на всплески внутри часа), обычно 2-3×</div>
        <div><b style={{color:"#334155"}}>R<sub>HA</sub></b> — запас на HA/отказоустойчивость (обычно 1.5× = N+1 redundancy)</div>
        <div><b style={{color:"#334155"}}>TPS<sub>replica</sub></b> — пропускная способность модели на 1 реплику (из бенчмарков SGLang/vLLM)</div>
      </div>
      {showM&&<div style={{marginTop:12,fontSize:12,color:"#64748b",lineHeight:1.8,borderTop:"1px solid #e2e8f0",paddingTop:12}}>
        <p style={{margin:"0 0 6px"}}><b style={{color:"#334155"}}>Почему output-токены?</b> — Decode-фаза (генерация) sequential, memory-bandwidth-bound. Prefill (input) параллелится. Именно скорость генерации output определяет GPU-потребности.</p>
        <p style={{margin:"0 0 6px"}}><b style={{color:"#334155"}}>Почему burst?</b> — Трафик пуассоновский: в пиковый час внутри 5-минутных окон нагрузка 2-3× от среднечасовой (после обеда, после митингов).</p>
        <p style={{margin:"0 0 6px"}}><b style={{color:"#334155"}}>KV-кэш</b> — при длинном контексте и высокой конкурентности KV-кэш (а не веса) становится узким местом по VRAM.</p>
        <p style={{margin:0}}><b style={{color:"#334155"}}>MoE</b> — Qwen3-235B: все 235B весов в VRAM, но активны 22B/токен. TPS выше dense-аналогов.</p>
      </div>}
    </div>

    {/* GPU */}
    <div style={s.card}>
      <h3 style={s.h3}>Железо и параметры</h3>
      <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:12,alignItems:"flex-end"}}>
        <div><span style={s.lbl}>GPU</span><select value={gpuKey} onChange={e=>setGpuKey(e.target.value)} style={{...s.sel,minWidth:150}}>{Object.entries(GPUS).map(([k,g])=><option key={k} value={k}>{g.label} — ${g.price.toLocaleString()} ({fmr(g.price*RUB)} ₽)</option>)}</select></div>
        <Tog label="FP8 квантизация" checked={fp8} onChange={setFp8}/>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
        <NI label="Целевой контекст" value={ctx} onChange={setCtx} w={100} suffix="tok" hint="Текущий лимит 65536, планы на 131072"/>
        <NI label="Burst" value={burst} onChange={setBurst} step={0.5} min={1} w={60} hint="Пиковый множитель внутри часа"/>
        <NI label="HA" value={ha} onChange={setHa} step={0.1} min={1} w={60} hint="N+1 отказоустойчивость"/>
        <NI label="Раб.часов" value={wH} onChange={setWH} min={1} max={24} w={60} hint="Часов работы GPU/день"/>
        <NI label="Доля пика" value={Math.round(pF*100)} onChange={v=>setPF(v/100)} suffix="%" w={60} hint="% дневного трафика в пиковый час"/>
      </div>
    </div>

    {/* RAG */}
    <div style={s.card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <h3 style={{...s.h3,margin:0}}>RAG (Retrieval-Augmented Generation)</h3>
        <Tog label="" checked={ragOn} onChange={setRagOn}/>
      </div>
      {ragOn?<div>
        <p style={{...s.sub,margin:"0 0 10px"}}>RAG добавляет чанки документов к каждому input — увеличивает prefill, KV-кэш и общую нагрузку на контекст</p>
        <div style={{display:"flex",gap:12}}>
          <NI label="Размер чанка" value={ragCh} onChange={setRagCh} suffix="tok" w={100}/>
          <NI label="top-K чанков" value={ragK} onChange={setRagK} w={60} hint="Кол-во чанков из retriever"/>
        </div>
        <div style={{marginTop:8,padding:8,background:"#eff6ff",borderRadius:6,fontSize:12,color:"#2563eb"}}>
          +{(ragCh*ragK).toLocaleString()} input-токенов к каждой сессии (≈{Math.round(ragCh*ragK/1000)}K). Это увеличивает KV-кэш и может потребовать дополнительных GPU для VRAM.
        </div>
      </div>:<p style={{...s.sub,margin:0}}>RAG выключен. Включите, чтобы учесть нагрузку от retrieval-augmented запросов.</p>}
    </div>

    {/* USERS */}
    <div style={s.card}>
      <h3 style={s.h3}>Пользователи по уровням</h3>
      <p style={s.sub}>Задайте DAU, модель, навык AI и параметры нагрузки для каждого уровня</p>
      {Object.entries(TIERS).map(([k,def])=>{
        const t=tiers[k];
        const mo=MODELS[t.model];
        return <div key={k} style={{borderLeft:`3px solid ${def.color}`,paddingLeft:12,marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
            <span style={{fontSize:16}}>{def.icon}</span>
            <span style={{fontWeight:700,fontSize:13,color:"#0f172a"}}>{def.label}</span>
          </div>
          <p style={{margin:"0 0 8px",fontSize:11,color:"#94a3b8"}}>{def.desc}</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,alignItems:"flex-end"}}>
            <NI label="DAU (чел.)" value={t.people} onChange={v=>sT(k,{people:v})} w={100} hint="Daily Active Users — уникальных пользователей в день"/>
            <div><span style={s.lbl}>Модель</span><select value={t.model} onChange={e=>sT(k,{model:e.target.value})} style={{...s.sel,minWidth:200}}>{Object.entries(MODELS).map(([mk,m])=><option key={mk} value={mk}>{m.label}</option>)}</select></div>
            <div><span style={s.lbl}>Навык AI</span><select value={t.skill} onChange={e=>sT(k,{skill:e.target.value})} style={{...s.sel,minWidth:130}}>{Object.entries(SKILLS).map(([sk,sv])=><option key={sk} value={sk}>{sv.label} (×{sv.m})</option>)}</select></div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:8,alignItems:"flex-end"}}>
            <NI label="Сессий/день" value={t.sessionsPerDay} onChange={v=>sT(k,{sessionsPerDay:v})} w={80} hint="Сколько раз в день человек обращается к модели (диалог = 1 сессия)"/>
            <NI label="Input/сессию" value={t.inputPerSession} onChange={v=>sT(k,{inputPerSession:v})} w={100} suffix="tok" hint="Средний объём входных токенов: промпт + контекст + системный промпт"/>
            <NI label="Output/сессию" value={t.outputPerSession} onChange={v=>sT(k,{outputPerSession:v})} w={100} suffix="tok" hint="Средний объём ответа модели (именно output определяет GPU-нагрузку)"/>
            <NI label="Concurrency" value={Math.round(t.concurrency*100)} onChange={v=>sT(k,{concurrency:v/100})} suffix="%" w={70} hint="% активных юзеров, чей запрос обрабатывается GPU прямо сейчас"/>
            {k==="agents"&&<NI label="Chain ×" value={t.chain} onChange={v=>sT(k,{chain:v})} w={70} hint="Вызовов модели на 1 запрос пользователя"/>}
          </div>
          <div style={{marginTop:4,fontSize:10,color:"#94a3b8"}}>Skill: {SKILLS[t.skill].d}. Модель: {mo.note}</div>
          {k==="agents"&&<div>
            <button onClick={()=>setShowChain(!showChain)} style={{background:"none",border:"none",color:"#2563eb",fontSize:11,cursor:"pointer",padding:"4px 0",fontWeight:600}}>
              {showChain?"Скрыть":"Показать"} Chain × по инструментам
            </button>
            {showChain&&<div style={{...s.tip,marginTop:4}}>
              <div style={{marginBottom:6}}><b>Chain ×</b> — сколько раз модель вызывается на 1 запрос пользователя. Агент делает цикл: plan → read files → code → test → fix → commit.</div>
              <table style={{width:"100%",fontSize:11,borderCollapse:"collapse"}}>
                <thead><tr style={{borderBottom:"1px solid #e2e8f0"}}><th style={{textAlign:"left",padding:"3px 6px"}}>Инструмент</th><th style={{textAlign:"center",padding:"3px 6px"}}>Chain ×</th><th style={{textAlign:"left",padding:"3px 6px"}}>Особенность</th></tr></thead>
                <tbody>{CHAIN_REF.map(c=><tr key={c.tool} style={{borderBottom:"1px solid #f1f5f9"}}><td style={{padding:"3px 6px",fontWeight:600}}>{c.tool}</td><td style={{textAlign:"center",padding:"3px 6px",fontFamily:"monospace"}}>{c.chain}</td><td style={{padding:"3px 6px",color:"#94a3b8"}}>{c.note}</td></tr>)}</tbody>
              </table>
              <div style={{marginTop:6,color:"#94a3b8"}}>По умолчанию стоит значение для OpenCode (×8). Измените под ваш основной инструмент.</div>
            </div>}
          </div>}
        </div>;
      })}
    </div>

    {/* ADOPTION — migration between tiers */}
    <div style={s.card}>
      <h3 style={s.h3}>Adoption Curve (миграция между уровнями)</h3>
      <p style={s.sub}>DAU уже указан выше — это реальные активные пользователи. Adoption Curve показывает другое: как со временем пользователи мигрируют с простых задач к сложным и к агентам по мере обучения. Используйте это для планирования наращивания GPU: сегодня большинство на простых задачах, через 6–12 месяцев часть перейдёт на сложный чат, а часть — на агенты.</p>
      <div style={{background:"#f8fafc",borderRadius:8,padding:12,fontSize:12,color:"#475569",lineHeight:1.8}}>
        <div><b>Месяц 0 (старт):</b> ~80% на простых задачах, ~15% на сложных, ~5% на агентах</div>
        <div><b>Месяц 6:</b> ~50% простые, ~35% сложные, ~15% агенты</div>
        <div><b>Месяц 12:</b> ~30% простые, ~40% сложные, ~30% агенты</div>
        <div><b>Месяц 18:</b> ~20% простые, ~40% сложные, ~40% агенты</div>
        <div style={{marginTop:6,color:"#94a3b8"}}>Перераспределите DAU между уровнями вручную, чтобы смоделировать будущую нагрузку. Кривая выше — ориентир.</div>
      </div>
    </div>

    {/* ═══ RESULTS ═══ */}
    <div style={{...s.card,border:"2px solid #2563eb30",background:"#fafbff"}}>
      <h3 style={{...s.h3,color:"#2563eb",marginBottom:12}}>Результат</h3>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
        <div style={s.mb("#2563eb")}>
          <div style={s.ml}>GPU итого</div>
          <div style={s.mv("#2563eb")}>{R.totalGpus}<span style={{fontSize:13,color:"#94a3b8"}}> × {gpu.label}</span></div>
          <div style={{fontSize:10,color:"#94a3b8"}}>Суммарно по всем моделям с учётом HA ×{ha}</div>
        </div>
        <div style={s.mb("#7c3aed")}>
          <div style={s.ml}>Peak TPS</div>
          <div style={s.mv("#7c3aed")}>{R.pTPS.toFixed(1)}<span style={{fontSize:11,color:"#94a3b8"}}> tok/s</span></div>
          <div style={{fontSize:10,color:"#94a3b8"}}>Макс. output-токенов/сек в пиковый момент</div>
        </div>
        <div style={s.mb("#059669")}>
          <div style={s.ml}>Concurrent</div>
          <div style={s.mv("#059669")}>{R.conc}</div>
          <div style={{fontSize:10,color:"#94a3b8"}}>Параллельных запросов к GPU в пиковую секунду</div>
        </div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
        <div style={s.mb("#dc2626")}>
          <div style={s.ml}>Стоимость GPU (покупка)</div>
          <div style={s.mv("#dc2626")}>{fmr(R.pBuyRub)} ₽</div>
          <div style={{fontSize:10,color:"#94a3b8"}}>${(R.pBuy/1000).toFixed(0)}K · {R.totalGpus} × ${gpu.price.toLocaleString()} · курс {RUB} ₽/$</div>
        </div>
        <div style={s.mb("#475569")}>
          <div style={s.ml}>Активных DAU</div>
          <div style={s.mv("#475569")}>{R.totA}</div>
          <div style={{fontSize:10,color:"#94a3b8"}}>Суммарный DAU по всем уровням</div>
        </div>
        <div style={s.mb("#475569")}>
          <div style={s.ml}>Токенов / день</div>
          <div style={s.mv("#475569")}>{fmt(R.dAll)}</div>
          <div style={{fontSize:10,color:"#94a3b8"}}>Input + output по всем уровням</div>
        </div>
      </div>

      {/* Per-model breakdown */}
      <div style={{background:"#fff",borderRadius:8,padding:12,border:"1px solid #e2e8f0",marginBottom:12}}>
        <div style={s.ml}>GPU по моделям</div>
        {Object.entries(R.perModel).map(([mk,pm])=>{
          const mo=MODELS[mk];
          return <div key={mk} style={{display:"flex",alignItems:"center",gap:8,marginTop:8,flexWrap:"wrap"}}>
            <span style={{fontSize:12,fontWeight:600,color:"#1e293b",minWidth:200}}>{mo.label}</span>
            <span style={{fontFamily:"monospace",fontSize:13,fontWeight:800,color:"#2563eb"}}>{pm.gFin} GPU</span>
            <span style={{fontSize:10,color:"#94a3b8"}}>({pm.gRaw} баз. × HA) · throughput: {pm.gThr} · memory: {pm.gMem} · KV: {pm.kvT.toFixed(1)}GB · {pm.tps} tps/replica</span>
          </div>;
        })}
      </div>

      {/* Tier breakdown */}
      <div style={{background:"#fff",borderRadius:8,padding:12,border:"1px solid #e2e8f0",marginBottom:12}}>
        <div style={s.ml}>Нагрузка по уровням</div>
        {Object.entries(R.bd).map(([k,r])=>{
          const d=TIERS[k];
          const sh=R.pTPS>0?r.pT/R.pTPS*100:0;
          return <div key={k} style={{display:"flex",alignItems:"center",gap:8,marginTop:7}}>
            <span style={{fontSize:13}}>{d.icon}</span>
            <span style={{fontSize:11,color:"#475569",minWidth:200}}>{d.label}</span>
            <div style={{flex:1,height:7,background:"#f1f5f9",borderRadius:4,overflow:"hidden"}}>
              <div style={{width:`${Math.min(sh,100)}%`,height:"100%",background:d.color,borderRadius:4}}/>
            </div>
            <span style={{fontSize:11,color:"#64748b",minWidth:90,textAlign:"right",fontFamily:"monospace"}}>{r.pT.toFixed(1)} tps ({Math.round(sh)}%)</span>
          </div>;
        })}
      </div>

      {/* Migration hint */}
      <div style={{background:"#fff",borderRadius:8,padding:12,border:"1px solid #e2e8f0"}}>
        <div style={s.ml}>Планирование роста</div>
        <div style={{fontSize:12,color:"#475569",lineHeight:1.7,marginTop:6}}>
          Чтобы смоделировать рост нагрузки через 6–12 месяцев, перераспределите DAU между уровнями:
          увеличьте число пользователей агентов и сложного чата за счёт простого чата.
          Калькулятор пересчитает GPU автоматически. Ориентиры миграции — в секции Adoption Curve выше.
        </div>
      </div>
    </div>

    </div></div>;
}
