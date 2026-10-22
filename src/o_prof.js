/* ===== Performance profiler: F3 (or ?fps) toggles. Panel has [Copy log] / [Reset]. ===== */
const PF={on:false,secs:{},ev:[],spikes:[],tl:[],gaps:[],lt:[],orig:{},t0:0,last:0,tickAcc:{},gpu:null,gq:[],gpuAcc:0,gpuN:0,gpuMax:0,info0:null,heap0:0,heapPrev:0,drag:0,el:null,raf:0,secT:0,secN:0,secMax:0,secGpu:0,secGpuN:0,secCpu:0,frames:0,cpuSum:0,lastFps:0};
const PF_WRAP=['render','aiPick','aiStep','after','sync3d','rigIdle','v3EnvUpd','v3Cam','v3Frame'];
function pfGet(n){return eval(n);}                       // read binding (same-scope function declarations)
function pfSet(n,f){eval(n+'=f');}
function pfAdd(n,ms){
  const s=PF.secs[n]||(PF.secs[n]={t:0,n:0,max:0});s.t+=ms;s.n++;if(ms>s.max)s.max=ms;
  const a=PF.tickAcc[n]||(PF.tickAcc[n]={t:0,n:0});a.t+=ms;a.n++;
  if(ms>=4&&n!=='v3Frame'&&n!=='rigIdle'){PF.ev.push({t:performance.now(),n,ms});if(PF.ev.length>80)PF.ev.shift();}
}
function pfWrap(n){
  const f=pfGet(n);if(PF.orig[n]||typeof f!=='function')return;PF.orig[n]=f;
  pfSet(n,function(){const t=performance.now();try{return f.apply(this,arguments);}finally{pfAdd(n,performance.now()-t);}});
}
function pfHookRender(){
  const R=V3R;if(!R||R._pfR)return;R._pfR=R.renderer.render;const gl=R.renderer.getContext();
  let ext=null;try{ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');}catch(e){}
  PF.gpu=ext?{gl,ext}:null;
  R.renderer.render=function(sc,cam){
    const t=performance.now();let q=null;
    if(PF.gpu&&PF.gq.length<6){try{q=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,q);}catch(e){q=null;}}
    R._pfR.call(this,sc,cam);
    if(q){try{gl.endQuery(ext.TIME_ELAPSED_EXT);PF.gq.push(q);}catch(e){}}
    pfAdd('gl.render(cpu submit)',performance.now()-t);
  };
}
function pfPollGpu(){
  if(!PF.gpu)return;const{gl,ext}=PF.gpu;
  while(PF.gq.length){const q=PF.gq[0];let ok=false;try{ok=gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE);}catch(e){}
    if(!ok)break;
    let ms=0;try{if(!gl.getParameter(ext.GPU_DISJOINT_EXT))ms=gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6;}catch(e){}
    gl.deleteQuery(q);PF.gq.shift();
    if(ms>0){PF.gpuAcc+=ms;PF.gpuN++;PF.secGpu+=ms;PF.secGpuN++;if(ms>PF.gpuMax)PF.gpuMax=ms;}}
}
const pfPct=(a,p)=>a.length?a[Math.min(a.length-1,Math.floor(a.length*p))]:0;
const pfMB=()=>performance.memory?+(performance.memory.usedJSHeapSize/1048576).toFixed(1):0;
function pfCtx(){
  const R=V3R;return{mode:V3.menu?'MENU':'GAME/'+opts.mode,env:G&&G.env||'-',ply:G?G.ply:0,pcs:R?R.pcs.size:0,anims:R?R.anims.length:0,parts:R?R.parts.length:0,q:R?R.q:-1,
    drag:PF.drag?1:0,paused:G&&G.paused?1:0,bg:G&&G.bg?1:0};
}
function pfTick(ts){
  if(!PF.on)return;PF.raf=requestAnimationFrame(pfTick);
  const R=V3R;pfPollGpu();
  if(PF.last){
    const gap=ts-PF.last;PF.gaps.push(gap);PF.frames++;PF.secN++;PF.secT+=gap;if(gap>PF.secMax)PF.secMax=gap;
    const top=Object.entries(PF.tickAcc).filter(e=>e[0]!=='v3Frame').sort((a,b)=>b[1].t-a[1].t).slice(0,4).map(e=>e[0]+' '+e[1].t.toFixed(1)+'ms'+(e[1].n>1?'×'+e[1].n:''));
    const work=(PF.tickAcc.v3Frame?PF.tickAcc.v3Frame.t:0)+(PF.tickAcc.aiStep?PF.tickAcc.aiStep.t:0)+(PF.tickAcc.render?PF.tickAcc.render.t:0);
    const hp=pfMB();
    const menuCap=V3.menu&&gap<40;
    if(gap>50&&!menuCap){
      const ev=PF.ev.filter(e=>ts-e.t<250&&ts-e.t>-50).map(e=>e.n+' '+e.ms.toFixed(1)+'ms');
      const lt=PF.lt.filter(l=>ts-l.t<400).map(l=>'longtask '+l.d.toFixed(0)+'ms');
      PF.spikes.push({at:((ts-PF.t0)/1000).toFixed(1)+'s',gap:gap.toFixed(0)+'ms',work:work.toFixed(1)+'ms',top:top.join(', ')||'(none ran)',ev:ev.join('; '),lt:lt.join('; '),gc:(PF.heapPrev&&hp&&PF.heapPrev-hp>3)?('heap -'+(PF.heapPrev-hp).toFixed(0)+'MB (GC)'):'',ctx:pfCtx(),
        guess:work<gap*.35?(lt.length?'main thread busy outside tracked code (DOM/CSS/GC/other JS)':'GPU-bound or compositor/browser (little JS ran)'):'JS: '+(top[0]||'')});
      if(PF.spikes.length>60)PF.spikes.shift();
    }
    PF.heapPrev=hp;PF.tickAcc={};
    if(ts-PF.secStart>=1000){
      const i=R?R.renderer.info:null;
      PF.tl.push({t:((ts-PF.t0)/1000).toFixed(0),fps:(PF.secN*1000/PF.secT).toFixed(0),max:PF.secMax.toFixed(0),gpu:PF.secGpuN?(PF.secGpu/PF.secGpuN).toFixed(1):'-',calls:i?i.render.calls:0,tris:i?i.render.triangles:0,heap:hp,...pfCtx()});
      if(PF.tl.length>300)PF.tl.shift();
      PF.lastFps=PF.secN*1000/PF.secT;PF.secN=0;PF.secT=0;PF.secMax=0;PF.secGpu=0;PF.secGpuN=0;PF.secStart=ts;pfPanel();
    }
  }else PF.secStart=ts;
  PF.last=ts;
}
function pfInfo(){const R=V3R;if(!R)return null;const i=R.renderer.info;return{geo:i.memory.geometries,tex:i.memory.textures,prog:i.programs?i.programs.length:0,calls:i.render.calls,tris:i.render.triangles};}
function pfReport(){
  const R=V3R,dur=(performance.now()-PF.t0)/1000,g=PF.gaps.slice().sort((a,b)=>a-b),avg=g.length?g.reduce((a,b)=>a+b,0)/g.length:0;
  let gpuName='?';try{const gl=R.renderer.getContext(),x=gl.getExtension('WEBGL_debug_renderer_info');gpuName=x?gl.getParameter(x.UNMASKED_RENDERER_WEBGL):'(hidden)';}catch(e){}
  const L=[];const P=(...a)=>L.push(a.join(' '));
  P('=== SURGE CHESS PERF LOG ===');
  P('duration',dur.toFixed(0)+'s','frames',PF.frames,'build',(document.querySelector('.mver')||{}).textContent||'');
  P('GPU:',gpuName,'| GPU timer:',PF.gpu?'yes':'NO (browser blocks it)');
  P('UA:',navigator.userAgent);
  P('screen',screen.width+'x'+screen.height,'dpr',devicePixelRatio,'| canvas',R.renderer.domElement.width+'x'+R.renderer.domElement.height,'| pixelRatio',R.renderer.getPixelRatio().toFixed(2),'| quality q'+R.q,R.qForce!=null?'(forced)':'(auto)','| FX',FX.on?'on':'off');
  P('cores',navigator.hardwareConcurrency,'| mem',navigator.deviceMemory||'?','GB | visible',document.visibilityState);
  P('');P('--- FRAME TIMES (rAF gap) ---');
  P('avg fps',(1000/avg).toFixed(1),'| p50',pfPct(g,.5).toFixed(1)+'ms','p95',pfPct(g,.95).toFixed(1)+'ms','p99',pfPct(g,.99).toFixed(1)+'ms','max',(g[g.length-1]||0).toFixed(0)+'ms');
  P('frames >33ms:',g.filter(x=>x>33.4).length,'| >50ms:',g.filter(x=>x>50).length,'| >100ms:',g.filter(x=>x>100).length,'(menu is capped at 30fps by design)');
  P('');P('--- WHO EATS TIME (avg ms per rAF frame, sorted) ---');
  const fr=Math.max(1,PF.frames),rows=Object.entries(PF.secs).sort((a,b)=>b[1].t-a[1].t);
  for(const[n,s]of rows)P(n.padEnd(26),'avg',(s.t/fr).toFixed(2).padStart(6)+'ms','| per call',(s.t/s.n).toFixed(2).padStart(6)+'ms','| max',s.max.toFixed(1).padStart(6)+'ms','| calls',s.n);
  P('GPU render time:',PF.gpuN?'avg '+(PF.gpuAcc/PF.gpuN).toFixed(2)+'ms, max '+PF.gpuMax.toFixed(1)+'ms ('+PF.gpuN+' samples)':'unavailable');
  const lt=PF.lt.slice(-500);P('long tasks (>50ms main thread):',lt.length,lt.length?'| total '+lt.reduce((a,b)=>a+b.d,0).toFixed(0)+'ms':'');
  P('');P('--- MEMORY / LEAK CHECK ---');
  const i0=PF.info0,i1=pfInfo();P('geometries',i0&&i0.geo,'->',i1&&i1.geo,'| textures',i0&&i0.tex,'->',i1&&i1.tex,'| programs',i0&&i0.prog,'->',i1&&i1.prog,'| JS heap MB',PF.heap0,'->',pfMB());
  P('');P('--- WORST SPIKES (rAF gap >50ms) ---');
  if(!PF.spikes.length)P('none');
  for(const s of PF.spikes.slice(-25))P('@'+s.at,'gap',s.gap,'| js work',s.work,'| '+s.guess,'| top:',s.top,s.ev?'| calls: '+s.ev:'',s.lt?'| '+s.lt:'',s.gc?'| '+s.gc:'','| ctx',JSON.stringify(s.ctx));
  P('');P('--- TIMELINE (1s rows: t fps worstFrame gpuMs calls tris heapMB ctx) ---');
  for(const r of PF.tl.slice(-90))P(r.t+'s',r.fps+'fps','worst',r.max+'ms','gpu',r.gpu,'calls',r.calls,'tris',r.tris,'heap',r.heap,r.mode,r.env,'ply'+r.ply,'pcs'+r.pcs,'an'+r.anims,'pt'+r.parts,'q'+r.q,r.drag?'DRAG':'');
  return L.join('\n');
}
function pfPanel(){
  if(!PF.el){
    const e=PF.el=document.createElement('div');e.id='pfHud';
    e.style.cssText='position:fixed;left:6px;top:6px;z-index:999;font:12px monospace;color:#7dff9a;background:rgba(0,0,0,.82);padding:6px 8px;border-radius:8px;display:grid;gap:4px;max-width:360px';
    e.innerHTML='<div id="pfTxt" style="white-space:pre"></div><div style="display:flex;gap:6px"><button type="button" id="pfCopy" style="font:12px monospace;padding:3px 8px;cursor:pointer">Copy log</button><button type="button" id="pfReset" style="font:12px monospace;padding:3px 8px;cursor:pointer">Reset</button><button type="button" id="pfClose" style="font:12px monospace;padding:3px 8px;cursor:pointer">Close</button></div><textarea id="pfTa" hidden style="width:340px;height:120px;font:10px monospace"></textarea>';
    document.body.appendChild(e);
    $('pfCopy').onclick=()=>{const t=pfReport(),b=$('pfCopy');
      const ok=()=>{b.textContent='Copied!';setTimeout(()=>b.textContent='Copy log',1500);},fb=()=>{const ta=$('pfTa');ta.hidden=false;ta.value=t;ta.select();try{document.execCommand('copy');ok();}catch(_){b.textContent='Ctrl+C the box';}};
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,fb);else fb();};
    $('pfReset').onclick=()=>pfReset();$('pfClose').onclick=()=>pfStop();
  }
  const R=V3R,s=pfCtx();
  $('pfTxt').textContent=PF.lastFps.toFixed(0)+' fps  q'+s.q+'  dpr '+(R?R.renderer.getPixelRatio().toFixed(2):'-')+'  '+s.mode+'\nGPU '+(PF.secGpuN?'':(PF.gpuN?(PF.gpuAcc/PF.gpuN).toFixed(1)+'ms avg':'n/a'))+'  spikes '+PF.spikes.length+'  heap '+pfMB()+'MB';
}
function pfReset(){PF.secs={};PF.spikes=[];PF.tl=[];PF.gaps=[];PF.lt=[];PF.ev=[];PF.frames=0;PF.t0=performance.now();PF.gpuAcc=PF.gpuN=PF.gpuMax=0;PF.info0=pfInfo();PF.heap0=pfMB();PF.tickAcc={};}
function pfStart(){
  if(PF.on||!V3R)return;PF.on=true;pfReset();PF.last=0;
  PF_WRAP.forEach(pfWrap);pfHookRender();
  try{if(!PF.po){PF.po=new PerformanceObserver(l=>{for(const e of l.getEntries())PF.lt.push({t:e.startTime,d:e.duration});if(PF.lt.length>500)PF.lt.splice(0,100);});PF.po.observe({entryTypes:['longtask']});}}catch(e){}
  PF.raf=requestAnimationFrame(pfTick);pfPanel();
}
function pfStop(){
  PF.on=false;cancelAnimationFrame(PF.raf);
  for(const n in PF.orig){pfSet(n,PF.orig[n]);}PF.orig={};
  const R=V3R;if(R&&R._pfR){R.renderer.render=R._pfR;R._pfR=null;}
  if(PF.el){PF.el.remove();PF.el=null;}
}
addEventListener('keydown',e=>{if(e.code==='F3'){e.preventDefault();PF.on?pfStop():pfStart();}});
(()=>{const cv=$('gl3');if(cv){cv.addEventListener('pointerdown',()=>PF.drag=1);addEventListener('pointerup',()=>PF.drag=0);}})();
if(/[?&]fps/.test(location.search))setTimeout(pfStart,1500);
