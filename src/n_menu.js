/* ===== Menu, live backdrop match, settings, help, hotkeys, HUD panels, transitions ===== */
const UIF={busy:0,ret:null,cap:null};
const LV_NAME=['','Beginner','Novice','Casual','Learner','Club player','Strong','Expert','Master','Grandmaster','Relentless'];
const store=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){}return null;};

/* ---------- pixel-art logo (5x7 font drawn at 2x, outlined, shaded, with a drop shadow and twinkles) ---------- */
const PXF={
  S:['.####','#....','#....','.###.','....#','....#','####.'],U:['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],
  R:['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],G:['.####','#....','#....','#.###','#...#','#...#','.###.'],
  E:['#####','#....','#....','####.','#....','#....','#####'],C:['.####','#....','#....','#....','#....','#....','.####'],
  H:['#...#','#...#','#...#','#####','#...#','#...#','#...#']
};
let logoMask=null;
const LG={W:112,H:62,sc:3,y1:6,y2:31};
function drawLogo(tw){
  const cv=$('logo');if(!cv)return;const W=LG.W,H=LG.H,cx=cv.getContext('2d');
  if(!logoMask){
    const m=new Uint8Array(W*H),put=(word,y0)=>{const sc=LG.sc,adv=5*sc+3,w=word.length*adv-3,x0=(W-w)>>1;
      for(let li=0;li<word.length;li++){const g=PXF[word[li]];for(let r=0;r<7;r++)for(let c=0;c<5;c++)if(g[r][c]==='#')for(let dy=0;dy<sc;dy++)for(let dx=0;dx<sc;dx++)m[(y0+r*sc+dy)*W+x0+li*adv+c*sc+dx]=1;}};
    put('SURGE',LG.y1);put('CHESS',LG.y2);logoMask=m;
  }
  const m=logoMask,at=(x,y)=>x>=0&&y>=0&&x<W&&y<H?m[y*W+x]:0,img=cx.createImageData(W,H),d=img.data;
  const px=(x,y,r,g,b)=>{if(x<0||y<0||x>=W||y>=H)return;const i=(y*W+x)*4;d[i]=r|0;d[i+1]=g|0;d[i+2]=b|0;d[i+3]=255;};
  const lerp=(a,b,t)=>a+(b-a)*t,ext=21;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    if(at(x,y)){
      const t=Math.max(0,Math.min(1,(y<LG.y2-2?(y-LG.y1)/ext:(y-LG.y2)/ext)));
      let r,g,b;
      if(t<.5){const k=t*2;r=255;g=lerp(244,200,k);b=lerp(150,30,k);}else{const k=(t-.5)*2;r=lerp(255,236,k);g=lerp(200,120,k);b=lerp(30,0,k);}
      if(!at(x,y-1)||!at(x-1,y)){r=255;g=252;b=226;}
      else if(!at(x,y+1)||!at(x+1,y)){r*=.66;g*=.5;b*=.4;}
      px(x,y,r,g,b);continue;
    }
    let ol=false;for(let dy=-1;dy<=1&&!ol;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&at(x+dx,y+dy)){ol=true;break;}
    if(ol){px(x,y,28,14,54);continue;}
    if(at(x-3,y-3)||at(x-2,y-3)||at(x-3,y-2)||at(x-2,y-2))px(x,y,74,36,118);
  }
  const sp=[[7,8],[104,12],[56,3],[100,52],[10,50]];
  sp.forEach(([sx,sy],i)=>{const ph=(tw+i*9)%30;if(ph<6){px(sx,sy,255,255,255);if(ph<5){px(sx-1,sy,255,255,255);px(sx+1,sy,255,255,255);px(sx,sy-1,255,255,255);px(sx,sy+1,255,255,255);}if(ph>=1&&ph<=3){px(sx-2,sy,255,240,160);px(sx+2,sy,255,240,160);px(sx,sy-2,255,240,160);px(sx,sy+2,255,240,160);}}});
  cx.putImageData(img,0,0);
}
let logoT=0;setInterval(()=>{if(document.hidden||$('menu').hidden)return;drawLogo(logoT++);},110);

/* ---------- bouncy slider: thumb springs up while dragging, stretches with speed, and "zips" as it moves ---------- */
function makeSlider(el,o){
  const min=o.min,max=o.max,step=o.step||1;let val=o.value;
  el.classList.add('sld');el.setAttribute('role','slider');el.tabIndex=0;if(o.wide)el.setAttribute('data-wide','1');
  el.setAttribute('aria-valuemin',min);el.setAttribute('aria-valuemax',max);
  let h='<div class="sld-track"><div class="sld-fill"></div></div>';
  const n=(max-min)/step;if(n<=20)for(let i=0;i<=n;i++)h+='<i class="sld-tick" style="left:'+(i/n*100)+'%"></i>';
  el.innerHTML=h+'<div class="sld-thumb"></div><div class="sld-bub"></div>';
  const fill=el.querySelector('.sld-fill'),th=el.querySelector('.sld-thumb'),bub=el.querySelector('.sld-bub');
  let drag=false,s=1,sv=0,tgt=1,vx=0,raf=0,lastZip=0;
  const pct=v=>(v-min)/(max-min);
  const place=()=>{const p=pct(val)*100;fill.style.width=p+'%';th.style.left=p+'%';bub.style.left=p+'%';bub.textContent=o.fmt?o.fmt(val):val;el.setAttribute('aria-valuenow',val);};
  const frame=()=>{
    const dt=.016;sv+=((tgt-s)*190-sv*11)*dt;s+=sv*dt;
    const st=Math.min(.45,Math.abs(vx)*.014);th.style.transform='scale('+(s*(1+st)).toFixed(3)+','+(s*(1-st*.6)).toFixed(3)+')';vx*=.84;
    if(drag||Math.abs(tgt-s)>.003||Math.abs(sv)>.003||Math.abs(vx)>.1)raf=requestAnimationFrame(frame);else{raf=0;th.style.transform='scale('+tgt+')';}
  };
  const kick=()=>{if(!raf)raf=requestAnimationFrame(frame);};
  const zip=dir=>{const t=performance.now();if(t-lastZip<30)return;lastZip=t;sfxZip(o.bus||'ui',pct(val)*100,dir);};
  const setVal=(v,fromUser)=>{v=Math.round(v/step)*step;v=Math.max(min,Math.min(max,v));if(v===val)return;const dir=v>val?1:-1;val=v;place();if(o.onInput)o.onInput(v,dir);if(fromUser)zip(dir);};
  const fromX=cx=>{const r=el.getBoundingClientRect();const p=Math.max(0,Math.min(1,(cx-r.left)/r.width));setVal(min+p*(max-min),true);};
  el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId);drag=true;el.classList.add('drag');tgt=1.6;sv+=2;fromX(e.clientX);kick();e.preventDefault();});
  el.addEventListener('pointermove',e=>{if(!drag)return;vx=e.movementX||0;fromX(e.clientX);kick();});
  const up=()=>{if(!drag)return;drag=false;el.classList.remove('drag');tgt=1;sv-=1.5;kick();};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  el.addEventListener('keydown',e=>{
    const big=(max-min)/step>30?5:1,k={ArrowLeft:-1,ArrowDown:-1,ArrowRight:1,ArrowUp:1,PageDown:-big*2,PageUp:big*2}[e.key];
    if(e.key==='Home'){setVal(min,true);}else if(e.key==='End'){setVal(max,true);}else if(k){setVal(val+k*step*(Math.abs(k)>1?1:big),true);}else return;
    e.preventDefault();sv+=2.2;kick();
  });
  th.style.transform='scale(1)';place();
  return{get:()=>val,set:v=>{val=Math.max(min,Math.min(max,v));place();}};
}

/* ---------- transitions ---------- */
function uiFade(fn){
  if(UIF.busy)return;UIF.busy=1;sfx('uistart');const f=$('fade');f.classList.add('on');
  setTimeout(()=>{try{fn();}finally{requestAnimationFrame(()=>setTimeout(()=>{f.classList.remove('on');UIF.busy=0;},140));}},540);
}
function uiGo(fn){bgStop();closeAllMods();uiFade(fn);}
function uiGameStart(){
  for(const id of['shopPanel','augPanel'])$(id).hidden=true;
  $('dkShop').classList.remove('on');$('dkAug').classList.remove('on');
  closeAllMods();if(G)G.paused=false;
}
function uiToMenu(){
  if(opts.mode==='mp')mpLeave();
  uiFade(()=>{
    closeAllMods();clearTimeout(aiTimer);clearTimeout(vsTimer);$('vsOv').hidden=true;
    opts.mode='sim';show('menu');mview('mvMain');bgStart();
  });
}

/* ---------- menu views ---------- */
function mview(id){for(const v of document.querySelectorAll('.mview'))v.hidden=v.id!==id;}
const menuCfg={side:'0',lv:5,w:5,b:5,spd:1.0};
function mnuNote(msg){
  let n=$('mnuNote');if(!n){n=document.createElement('p');n.id='mnuNote';n.style.cssText='margin:0;color:#ffd45e;font-weight:700;font-size:13px;text-align:center;transition:opacity .4s;text-shadow:0 2px 8px #000;min-height:18px';$('mvPlay').insertBefore(n,$('mvPlay').querySelector('.back'));}
  n.textContent=msg;n.style.opacity=1;clearTimeout(mnuNote.t);mnuNote.t=setTimeout(()=>{n.style.opacity=0;},2800);
}
const MMR={get:()=>parseInt(store('surgeMMR')||'1000',10)||1000,tier(v){return v<900?'Iron':v<1100?'Bronze':v<1300?'Silver':v<1500?'Gold':v<1700?'Platinum':'Diamond';},
  update(win,oppMmr){const r=MMR.get(),e=1/(1+Math.pow(10,((oppMmr||r)-r)/400)),n=Math.round(r+32*((win?1:0)-e));store('surgeMMR',String(n));return n;}};
function refreshMmr(){const v=MMR.get();$('mmrTag').textContent='Online · soon · '+MMR.tier(v)+' '+v;}
function wireMenu(){
  refreshMmr();
  $('menu').addEventListener('click',e=>{
    const go=e.target.closest('[data-go]');
    if(go){const to=go.dataset.go;mview(to==='main'?'mvMain':to==='play'?'mvPlay':to==='pvai'?'mvPvai':to==='custom'?'mvCustom':'mvAivai');if(go.classList.contains('back'))sfx('uiback');return;}
    const m=e.target.closest('[data-mode]');
    if(m){
      const k=m.dataset.mode;
      if(m.classList.contains('off')){sfx('uideny');m.classList.remove('shake');void m.offsetWidth;m.classList.add('shake');mnuNote(k==='ranked'?'Ranked needs the online server. Your MMR will live here once it is deployed.':'Online queue needs the deployed server. Coming soon.');return;}
      if(k==='local')uiGo(()=>{opts.human=0;start('pvp');});
    }
  });
  $('mHelp').addEventListener('click',()=>openMod('helpM'));
  $('mSet').addEventListener('click',()=>openMod('setM'));
  $('mSim').addEventListener('click',()=>openMod('simM'));
  const segs=(id,fn)=>$(id).addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;fn(b.dataset.v);for(const x of $(id).children)x.setAttribute('aria-pressed',x===b?'true':'false');});
  segs('segSide',v=>{menuCfg.side=v;});segs('segSpd',v=>{menuCfg.spd=Number(v);});
  makeSlider($('sldLv'),{min:1,max:10,step:1,value:5,bus:'ui',onInput:v=>{menuCfg.lv=v;$('lvName').textContent=v+' · '+LV_NAME[v];}});
  makeSlider($('sldW'),{min:1,max:10,step:1,value:5,bus:'ui',onInput:v=>{menuCfg.w=v;$('lvWName').textContent=v+' · '+LV_NAME[v];}});
  makeSlider($('sldB'),{min:1,max:10,step:1,value:5,bus:'ui',onInput:v=>{menuCfg.b=v;$('lvBName').textContent=v+' · '+LV_NAME[v];}});
  $('lvName').textContent='5 · '+LV_NAME[5];$('lvWName').textContent='5 · '+LV_NAME[5];$('lvBName').textContent='5 · '+LV_NAME[5];
  $('goPvai').addEventListener('click',()=>uiGo(()=>{opts.level=menuCfg.lv;opts.human=menuCfg.side==='r'?rnd(2):Number(menuCfg.side);start('ai');}));
  $('goAivai').addEventListener('click',()=>uiGo(()=>{opts.lv=[menuCfg.w,menuCfg.b];opts.spd=menuCfg.spd;start('sim');}));
}

/* ---------- live backdrop: two AIs fight with a random troop count, then the arena changes ---------- */
const BG={on:false,t0:0,limit:0,env:null,endAt:0};
function bgThin(){
  for(const c of[0,1]){
    const idx=[];for(let i=0;i<N*N;i++){const p=G.b[i];if(p&&p.c===c&&p.t!=='K')idx.push(i);}
    for(let i=idx.length-1;i>0;i--){const j=rnd(i+1);[idx[i],idx[j]]=[idx[j],idx[i]];}
    const keep=3+rnd(11);for(const i of idx.slice(keep))G.b[i]=null;
  }
  refreshLegal();
}
function bgStart(){
  BG.on=true;BG.endAt=0;clearTimeout(aiTimer);
  BG.env=(/[?&]env=(\w+)/.exec(location.search)||[])[1]||pick(ENVS.filter(e=>e!==BG.env));opts.mode='sim';opts.env=BG.env;newGame();opts.env=null;
  G.bg=true;G.bgLv=[1+rnd(3),1+rnd(3)];G.killcam=false;bgThin();
  v3Reset();render();after();
  BG.t0=performance.now();BG.limit=28000+rnd(16000);
}
function bgStop(){BG.on=false;clearTimeout(aiTimer);}
function bgFadeEl(){let f=$('bgFade');if(!f){f=document.createElement('div');f.id='bgFade';f.style.cssText='position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .7s ease;z-index:5';$('boardwrap').appendChild(f);}return f;}
function bgNext(){
  const f=bgFadeEl();BG.endAt=-1;f.style.opacity=1;
  setTimeout(()=>{if(!BG.on||$('menu').hidden){f.style.opacity=0;return;}bgStart();setTimeout(()=>{f.style.opacity=0;},350);},760);
}
setInterval(()=>{
  if(!BG.on||$('menu').hidden||document.hidden||BG.endAt<0)return;
  if(!G||!G.bg){bgStart();return;}
  const now=performance.now();
  if(G.over&&!BG.endAt)BG.endAt=now+2600;
  if((BG.endAt&&now>BG.endAt)||now-BG.t0>BG.limit||G.ply>150)bgNext();
},1000);

/* ---------- modals ---------- */
const MODS=['helpM','setM','simM','pauseM','leaveM'];
const modalOpen=()=>MODS.some(i=>!$(i).hidden);
function syncPause(){if(G&&!$('game').hidden)G.paused=modalOpen();}
function closeAllMods(){for(const i of MODS)$(i).hidden=true;UIF.ret=null;UIF.cap=null;syncPause();}
function openMod(id,ret){
  for(const i of MODS)if(i!==id)$(i).hidden=true;
  UIF.ret=ret||null;$(id).hidden=false;sfx('uiopen');syncPause();
  if(id==='simM')bgStop();
  if(id==='helpM')buildHelp();if(id==='setM')buildSettings();
}
function closeMod(id){
  $(id).hidden=true;sfx('uiback');
  if(UIF.ret==='pause'){UIF.ret=null;$('pauseM').hidden=false;}
  syncPause();
}
function openPause(){if($('game').hidden||(G&&G.over))return;openMod('pauseM');}
function wireModals(){
  for(const b of document.querySelectorAll('[data-close]')){
    b.addEventListener('click',()=>{const k=b.dataset.close;if(k==='help')closeMod('helpM');else if(k==='set')closeMod('setM');else if(k==='sim'){closeMod('simM');if(!$('menu').hidden&&!simRun)bgStart();}else if(k==='shop')togglePanel('shop',false);else if(k==='aug')togglePanel('aug',false);});
  }
  for(const id of MODS)$(id).addEventListener('pointerdown',e=>{if(e.target===$(id)&&id!=='pauseM'&&id!=='leaveM'){if(id==='helpM')closeMod('helpM');else if(id==='setM')closeMod('setM');else if(id==='simM'){closeMod('simM');if(!$('menu').hidden&&!simRun)bgStart();}}});
  $('hbBtn').addEventListener('click',()=>{if($('pauseM').hidden)openPause();else{closeMod('pauseM');}});
  $('pmResume').addEventListener('click',()=>closeMod('pauseM'));
  $('pmOpt').addEventListener('click',()=>{$('pauseM').hidden=true;openMod('setM','pause');});
  $('pmHelp').addEventListener('click',()=>{$('pauseM').hidden=true;openMod('helpM','pause');});
  $('pmLeave').addEventListener('click',()=>{$('pauseM').hidden=true;openMod('leaveM');});
  $('lvNo').addEventListener('click',()=>{$('leaveM').hidden=true;$('pauseM').hidden=false;sfx('uiback');});
  $('lvYes').addEventListener('click',()=>{$('leaveM').hidden=true;adminShow(false);adminBadge(false);uiToMenu();});
}

/* ---------- help ---------- */
const HELP_TABS=[['basics','Basics'],['units','Units'],['orbs','Powerups'],['shop','Shop'],['aug','Augments'],['keys','Controls']];
let helpTab='basics';
function unitsHelp(){
  const U=[['K','King','One step in any direction. Lose it and you lose the game. Castles with an unmoved rook.'],['Q','Queen','Rook and bishop combined, unlimited range. Walks over orbs without triggering them.'],['R','Rook','Slides up to 8 tiles in straight lines.'],['B','Bishop','Slides up to 7 tiles on diagonals.'],['N','Knight','Jumps in an L. The path must be clear of blockers.'],['P','Pawn','Steps forward, captures diagonally, promotes on the far rank.'],
    ['M','Commander','Two per side, beside the queen and king. Leaps to any square on the outer ring of its 5×5 box, but needs an empty route through the inner 3×3.'],['H','Champion','Shop unit. Moves anywhere in a 5×5 box, never captures a king.']];
  return'<div class="helpgrid"><ul class="legend" style="grid-column:1/-1;display:contents">'+U.map(u=>'<li><span class="uprev">'+portraitImg(u[0],0)+'</span><div><strong>'+u[1]+'</strong><span class="d">'+u[2]+'</span></div></li>').join('')+'</ul></div>';
}
function basicsHelp(){
  return'<p>Chess on a <b>10×10</b> board with two extra units, a gold shop, an augment draft every 20 turns (10 each), bosses from turn 80, and an arena hazard. Win by checkmating the enemy king.</p>'
   +'<h3>Round flow</h3><p>Everyone earns <b>5 gold</b> at the start of each of their turns. Captures pay gold by piece value. Orbs drop every 5–10 turns; land any non-king, non-queen piece on one to trigger it. Both players pick 1 of 3 augments every 20 plies.</p>'
   +'<h3>Boss</h3><p>From turn 80 a random 2×2 boss appears, and a new one spawns 200 turns after each is slain. Each side keeps its own hit counter: land the last hit to win. <b>Vanguard</b> (5 hits): attackers get hurled away and it stomps; reward 3 free augments. <b>Dragon</b> (7 hits): every hit makes it breathe fire that leaves burning tiles for 10 turns; it flies around every 10-20 turns; slayer gets a baby dragon that marches and scorches enemies. <b>Kraken</b> (6 hits, always in the centre): every 10-20 turns it shoves units off the board with a water jet or slams 2-4 nearby tiles; slayer wins 1500 gold.</p>'
   +'<h3>Arenas</h3><ul class="legend">'+Object.keys(ENV_INFO).map(k=>'<li><span class="gcost" style="font-size:24px">'+ENV_INFO[k].i+'</span><div><strong>'+ENV_INFO[k].n+'</strong><span class="d">'+ENV_INFO[k].d+'</span></div></li>').join('')+'</ul>'
   +'<h3>Range</h3><p>Rooks reach 8 tiles, bishops 7, the queen is unlimited, so the big board has no cross-map sniping. Safe-zone rules and the edge fire arrive later in the game.</p>';
}
function keysHelp(){return'<div class="kbgrid">'+KEYDEF.map(k=>'<div class="kbrow"><span>'+k[1]+'</span><span class="kbd">'+keyLabel(KEYS[k[0]])+'</span></div>').join('')+'</div><p class="fine" style="margin-top:12px">Change any of these in Settings → Controls.</p>';}
function buildHelp(){
  $('helpTabs').innerHTML=HELP_TABS.map(t=>'<button type="button" class="tab" role="tab" data-t="'+t[0]+'" aria-selected="'+(t[0]===helpTab)+'">'+t[1]+'</button>').join('');
  const body=()=>{const b=$('helpBody'),t=helpTab;
    b.innerHTML=t==='basics'?basicsHelp():t==='units'?unitsHelp():t==='orbs'?'<ul class="legend">'+legendHtml()+'</ul><p class="fine">Kings and queens walk over orbs without effect. At most 4 orbs exist; a new one replaces the oldest.</p>':t==='shop'?'<ul class="legend">'+shopLegend()+'</ul><p class="fine">Capture pay: pawn 10, knight/bishop 25, rook 40, cardinal 45, marshal 50, queen 80.</p>':t==='aug'?'<ul class="legend">'+Object.keys(AUG).map(k=>'<li><span class="gcost" style="font-size:22px">'+AUG[k].i+'</span><div><strong>'+AUG[k].n+' <small style="color:var(--muted);font-weight:600">'+TIER[AUG[k].t]+'</small></strong><span class="d">'+AUG[k].d+'</span></div></li>').join('')+'</ul>':keysHelp();
    b.scrollTop=0;};
  $('helpTabs').onclick=e=>{const t=e.target.closest('.tab');if(!t)return;helpTab=t.dataset.t;for(const x of $('helpTabs').children)x.setAttribute('aria-selected',x===t?'true':'false');body();};
  body();
}

/* ---------- hotkeys ---------- */
const KEYDEF=[['shop','Open / close shop','KeyP'],['aug','Augments panel','KeyA'],['help','Help','KeyH'],['menu','Menu / close','Escape'],['log','Toggle move log','KeyL'],['cam','Reset camera','KeyR'],['skip','Skip bonus move','Space'],
  ['ab1','Ability 1','Digit1'],['ab2','Ability 2','Digit2'],['ab3','Ability 3','Digit3'],['ab4','Ability 4','Digit4']];
const KEYS={};for(const k of KEYDEF)KEYS[k[0]]=k[2];
try{const s=JSON.parse(store('surgeKeys')||'null');if(s)for(const k in s)if(k in KEYS)KEYS[k]=s[k];}catch(e){}
function keyLabel(c){if(!c)return'—';return c.replace(/^Key/,'').replace(/^Digit/,'').replace('Escape','Esc').replace('ArrowUp','↑').replace('ArrowDown','↓').replace('ArrowLeft','←').replace('ArrowRight','→').replace('Backquote','`');}
function updKeyHints(){for(const e of document.querySelectorAll('kbd[data-act]'))e.textContent=keyLabel(KEYS[e.dataset.act]);}
function saveKeys(){store('surgeKeys',JSON.stringify(KEYS));updKeyHints();}
function togglePanel(which,force){
  const p=which==='shop'?$('shopPanel'):$('augPanel'),b=which==='shop'?$('dkShop'):$('dkAug');
  const on=force==null?p.hidden:force;if(on===!p.hidden)return;
  p.hidden=!on;b.classList.toggle('on',on);sfx(on?'uiopen':'uiback');
  if(on&&innerWidth<900){const o=which==='shop'?$('augPanel'):$('shopPanel');o.hidden=true;(which==='shop'?$('dkAug'):$('dkShop')).classList.remove('on');}
}
function onKey(e){
  if(UIF.cap){return;}
  const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'))return;
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const act=Object.keys(KEYS).find(k=>KEYS[k]===e.code);if(!act)return;
  const inGame=!$('game').hidden;
  if(act==='menu'){
    e.preventDefault();
    if(!$('leaveM').hidden){$('lvNo').click();return;}
    if(!$('setM').hidden){closeMod('setM');return;}
    if(!$('helpM').hidden){closeMod('helpM');return;}
    if(!$('simM').hidden){closeMod('simM');if(!$('menu').hidden&&!simRun)bgStart();return;}
    if(adminOpen()){adminShow(false);return;}
    if(!$('pauseM').hidden){closeMod('pauseM');return;}
    if(inGame){if(!$('shopPanel').hidden||!$('augPanel').hidden){togglePanel('shop',false);togglePanel('aug',false);return;}openPause();return;}
    if(!$('menu').hidden&&$('mvMain').hidden){const bk=$('menu').querySelector('.mview:not([hidden]) .back');if(bk)bk.click();}
    return;
  }
  if(act==='help'){e.preventDefault();if(!$('helpM').hidden)closeMod('helpM');else if(!modalOpen())openMod('helpM');return;}
  if(!inGame||modalOpen())return;
  e.preventDefault();
  if(act==='shop')togglePanel('shop');
  else if(act==='aug'){if(!adminKeyAug())togglePanel('aug');}
  else if(act==='log')$('hudLog').classList.toggle('off');
  else if(act==='cam')v3ResetCam();
  else if(act==='skip'){if(!$('skipBtn').hidden)$('skipBtn').click();}
  else if(/^ab\d$/.test(act)){const b=[...$('abilList').querySelectorAll('button:not(:disabled)')][+act[2]-1];if(b)b.click();}
}

/* ---------- settings ---------- */
const SET_TABS=[['audio','Audio'],['keys','Controls'],['video','Video'],['game','Game']];
let setTab='audio';
function toggleBtn(id,on,onTxt,offTxt){return'<button type="button" class="toggle" id="'+id+'" aria-pressed="'+on+'">'+(on?onTxt:offTxt)+'</button>';}
function buildSettings(){
  $('setTabs').innerHTML=SET_TABS.map(t=>'<button type="button" class="tab" role="tab" data-t="'+t[0]+'" aria-selected="'+(t[0]===setTab)+'">'+t[1]+'</button>').join('');
  $('setTabs').onclick=e=>{const t=e.target.closest('.tab');if(!t)return;UIF.cap=null;setTab=t.dataset.t;for(const x of $('setTabs').children)x.setAttribute('aria-selected',x===t?'true':'false');body();};
  const body=()=>{
    const b=$('setBody');
    if(setTab==='audio'){
      const rows=[['m','Master','Everything'],['fx','Effects','Combat, orbs, shop, environment'],['vo','Voices','Battle cries and kiai'],['ui','Interface','Menus, hovers, transitions']];
      b.innerHTML='<p>Drag a slider: it zips as you move it, and you hear the level change.</p>'+rows.map(r=>'<div class="setrow"><label>'+r[1]+'</label><div class="sld" id="sl_'+r[0]+'"></div><output id="ov_'+r[0]+'">'+SFX.vol[r[0]]+'</output><small>'+r[2]+'</small></div>').join('')
        +'<div class="setrow" style="margin-top:16px"><label>Sound</label><div>'+toggleBtn('tgSnd',SFX.on,'On','Muted')+'</div></div>';
      for(const r of rows)makeSlider($('sl_'+r[0]),{min:0,max:100,step:1,value:SFX.vol[r[0]],bus:r[0],wide:1,onInput:v=>{sfxSetVol(r[0],v);$('ov_'+r[0]).textContent=v;}});
      $('tgSnd').onclick=e=>{SFX.on=!SFX.on;store('surgeSnd',SFX.on?'1':'0');e.currentTarget.setAttribute('aria-pressed',SFX.on);e.currentTarget.textContent=SFX.on?'On':'Muted';if(SFX.on){sfxInit();sfx('uiclick');}};
    }else if(setTab==='keys'){
      b.innerHTML='<p>Click a key, then press the new one. Esc cancels, Backspace clears. A key already in use is swapped.</p><div class="kbgrid">'+KEYDEF.map(k=>'<div class="kbrow"><span>'+k[1]+'</span><button type="button" class="keybtn" data-a="'+k[0]+'">'+keyLabel(KEYS[k[0]])+'</button></div>').join('')+'</div><p style="margin-top:14px"><button type="button" class="toggle" id="kbReset" aria-pressed="false">Reset to defaults</button></p>';
      b.onclick=e=>{
        const kb=e.target.closest('.keybtn');
        if(kb){for(const x of b.querySelectorAll('.keybtn'))x.classList.remove('cap');UIF.cap=kb.dataset.a;kb.classList.add('cap');kb.textContent='Press a key…';return;}
        if(e.target.closest('#kbReset')){for(const k of KEYDEF)KEYS[k[0]]=k[2];saveKeys();body();}
      };
    }else if(setTab==='video'){
      const q=store('surgeQ')||'auto';
      b.innerHTML='<div class="setrow"><label>Effects</label><div>'+toggleBtn('tgFx',FX.on,'On','Off')+'</div><span></span><small>Particles, shakes, kill animations. Turn off for old machines.</small></div>'
        +'<div class="setrow"><label>Quality</label><div class="seg" id="segQ"><button type="button" data-v="auto" aria-pressed="'+(q==='auto')+'">Auto</button><button type="button" data-v="3" aria-pressed="'+(q==='3')+'">High</button><button type="button" data-v="2" aria-pressed="'+(q==='2')+'">Medium</button><button type="button" data-v="1" aria-pressed="'+(q==='1')+'">Low</button><button type="button" data-v="0" aria-pressed="'+(q==='0')+'">Minimum</button></div><span></span><small>Auto lowers detail when the frame rate drops. Low removes shadows.</small></div>'
        +'<div class="setrow"><label>Camera</label><div><button type="button" class="toggle" id="tgCam" aria-pressed="false">Reset view</button></div></div>';
      $('tgFx').onclick=e=>{FX.on=!FX.on;store('surgeFx',FX.on?'1':'0');e.currentTarget.setAttribute('aria-pressed',FX.on);e.currentTarget.textContent=FX.on?'On':'Off';};
      $('segQ').onclick=e=>{const x=e.target.closest('button');if(!x)return;store('surgeQ',x.dataset.v);for(const y of $('segQ').children)y.setAttribute('aria-pressed',y===x?'true':'false');v3Quality(x.dataset.v);};
      $('tgCam').onclick=()=>v3ResetCam();
    }else{
      b.innerHTML='<div class="setrow"><label>Kill cams</label><div>'+toggleBtn('tgKc',opts.killcam!==false,'On','Off')+'</div><span></span><small>Slow-motion cinematics on big upsets, like a pawn taking a queen.</small></div>'
        +'<div class="setrow"><label>Move log</label><div>'+toggleBtn('tgLog',!$('hudLog').classList.contains('off'),'Shown','Hidden')+'</div></div>';
      $('tgKc').onclick=e=>{opts.killcam=!(opts.killcam!==false);store('surgeKc',opts.killcam?'1':'0');if(G&&!G.bg)G.killcam=opts.killcam;e.currentTarget.setAttribute('aria-pressed',opts.killcam);e.currentTarget.textContent=opts.killcam?'On':'Off';};
      $('tgLog').onclick=e=>{$('hudLog').classList.toggle('off');const on=!$('hudLog').classList.contains('off');e.currentTarget.setAttribute('aria-pressed',on);e.currentTarget.textContent=on?'Shown':'Hidden';};
    }
    b.scrollTop=0;
  };
  $('setBody').onclick=null;body();
}
/* key capture runs in the capture phase so the settings UI sees it before the hotkey handler */
document.addEventListener('keydown',e=>{
  if(!UIF.cap)return;e.preventDefault();e.stopPropagation();
  const a=UIF.cap;UIF.cap=null;
  if(e.code==='Escape'){}else if(e.code==='Backspace'||e.code==='Delete')KEYS[a]='';
  else{const other=Object.keys(KEYS).find(k=>k!==a&&KEYS[k]===e.code);if(other)KEYS[other]=KEYS[a];KEYS[a]=e.code;}
  saveKeys();if(!$('setM').hidden&&setTab==='keys')buildSettings();
},true);

/* ---------- hover / click sounds for UI chrome ---------- */
const UI_SEL='.ybtn,.mode,.tab,.dk,.hbtn,.toggle,.keybtn,.px,.mx,.back,.mlink,.seg button,.btn';
document.addEventListener('mouseover',e=>{const t=e.target.closest&&e.target.closest(UI_SEL);if(t&&!t.disabled&&!(e.relatedTarget&&t.contains(e.relatedTarget)))sfx('uihover');});
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest(UI_SEL);if(t&&!t.disabled&&!t.classList.contains('back')&&!t.classList.contains('off')&&t.id!=='goPvai'&&t.id!=='goAivai')sfx('uiclick');});

/* ---------- boot ---------- */
(function(){
  try{const f=store('surgeFx');if(f==='0')FX.on=false;opts.killcam=store('surgeKc')!=='0';}catch(e){}
  wireMenu();wireModals();updKeyHints();
  $('dkShop').addEventListener('click',()=>togglePanel('shop'));
  $('dkAug').addEventListener('click',()=>{if(!adminKeyAug())togglePanel('aug');});
  document.addEventListener('keydown',onKey);
  try{const q=store('surgeQ');if(q&&q!=='auto')setTimeout(()=>v3Quality(q),0);}catch(e){}
  drawLogo(0);
  show('menu');mview('mvMain');bgStart();
})();

/* ===== Low-FPS / software-rendering helper ===== */
const LOWFPS={shown:0,bad:0,n:0,t:0,last:0};
function lowfpsInfo(){
  const ua=navigator.userAgent;
  if(/Edg\//.test(ua))return{b:'Edge',url:'edge://settings/system',path:'Settings > System and performance > "Use graphics acceleration when available"',gpu:'edge://gpu'};
  if(/OPR\//.test(ua))return{b:'Opera',url:'opera://settings/?search=hardware+acceleration',path:'Settings > Browser > System > "Use hardware acceleration when available"',gpu:'opera://gpu'};
  if(/Firefox\//.test(ua))return{b:'Firefox',url:'about:preferences#general',path:'Settings > General > Performance > untick "Use recommended performance settings" > tick "Use hardware acceleration when available"',gpu:'about:support'};
  if(/Safari\//.test(ua)&&!/Chrome\//.test(ua))return{b:'Safari',url:'',path:'Safari uses the GPU by default. Close heavy tabs/apps, and make sure Low Power Mode is off.',gpu:''};
  return{b:'Chrome',url:'chrome://settings/system',path:'Settings > System > "Use graphics acceleration when available" (then Relaunch)',gpu:'chrome://gpu'};
}
function lowfpsShow(why,fps){
  if(LOWFPS.shown)return;try{if(localStorage.getItem('surgeNoLowFps')==='1')return;}catch(e){}
  LOWFPS.shown=1;const I=lowfpsInfo(),e=document.createElement('div');e.id='lowFps';
  e.style.cssText='position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:250;width:min(520px,94vw);padding:16px 18px;border-radius:16px;background:rgba(12,18,32,.96);border:1px solid rgba(255,190,40,.55);box-shadow:0 16px 48px rgba(0,0,0,.6);color:#eef3fb;font:14px/1.45 system-ui,sans-serif';
  const sw=why==='soft';
  e.innerHTML='<div style="font-weight:700;font-size:16px;margin-bottom:6px;color:#ffcf33">'+(sw?'Your browser is not using your graphics card':'Low FPS detected'+(fps?' (~'+fps+' fps)':''))+'</div>'
   +'<div style="opacity:.9">'+(sw?'The game is being drawn by the CPU, which is very slow.':'This is most often caused by hardware acceleration being turned off.')+' <b>If your FPS is low, make sure graphics acceleration is turned on in '+I.b+':</b></div>'
   +'<div style="margin:8px 0;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.07);font-size:13px">'+I.path+'</div>'
   +(I.url?'<div style="font-size:12px;opacity:.75;margin-bottom:8px">Browsers block websites from opening this page for you. Copy the address, paste it into a new tab, and press Enter.</div>':'')
   +'<div style="display:flex;gap:8px;flex-wrap:wrap">'+(I.url?'<button type="button" id="lfCopy" class="ybtn" style="font-size:14px;padding:8px 14px">Copy settings address</button>':'')
   +'<button type="button" id="lfOk" style="padding:8px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:transparent;color:inherit;cursor:pointer">Dismiss</button>'
   +'<button type="button" id="lfNo" style="padding:8px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:transparent;color:inherit;opacity:.7;cursor:pointer">Don\'t show again</button></div>'
   +(I.gpu?'<div style="font-size:11.5px;opacity:.6;margin-top:8px">Check the result at '+I.gpu+' (WebGL should say "Hardware accelerated"). Still slow? Update your graphics driver and set '+I.b+' to High performance in Windows Settings > Display > Graphics.</div>':'');
  document.body.appendChild(e);
  const c=$('lfCopy');if(c)c.onclick=()=>{const done=()=>{c.textContent='Copied! Paste in a new tab';};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(I.url).then(done,()=>{c.textContent=I.url;});else c.textContent=I.url;};
  $('lfOk').onclick=()=>e.remove();$('lfNo').onclick=()=>{try{localStorage.setItem('surgeNoLowFps','1');}catch(_){}e.remove();};
}
(function lowfpsWatch(){
  const tick=ts=>{
    requestAnimationFrame(tick);
    if(document.hidden||LOWFPS.shown){LOWFPS.last=0;LOWFPS.n=0;return;}
    if(LOWFPS.last&&ts-LOWFPS.last>400){LOWFPS.last=ts;LOWFPS.n=0;LOWFPS.t=ts;return;}   // tab switch / hitch: restart window
    LOWFPS.last=ts;if(!LOWFPS.t)LOWFPS.t=ts;LOWFPS.n++;
    if(ts-LOWFPS.t>=1000){
      const fps=LOWFPS.n*1000/(ts-LOWFPS.t);LOWFPS.n=0;LOWFPS.t=ts;
      const menu=document.body.classList.contains('m-menu'),floor=menu?14:22;   // menu is capped at 30 by design
      if(performance.now()<4000)return;
      if(fps<floor){if(++LOWFPS.bad>=5)lowfpsShow('low',Math.round(fps));}else LOWFPS.bad=Math.max(0,LOWFPS.bad-1);
    }
  };
  requestAnimationFrame(tick);
  setTimeout(()=>{if(V3&&V3.soft)lowfpsShow('soft');},2500);
})();
if(/[?&]debug/.test(location.search))window.SCdbg={fn:{onSquare,adminKeyAug,adminShow,spawnBoss,bossAttacked,dragonFly,krakenAttack,babyTick,bossWin,bossTick,dragonBreath,onFire,endTurn,refreshLegal,startTgt,tgtClick,buy,useAbility,ramTick,turretFire,mk,legal,stOf,finishTurn,pickAug,has,aiExtra,igniteZone},sync:()=>sync3d(),G:()=>G,MPS:()=>MPS,play:(m)=>{play(m,"Q");after();},start:(m)=>start(m),opts:()=>opts,AIW:()=>AIW,R:()=>V3R,sqX:(i)=>sqX(i),sqZ:(i)=>sqZ(i),por:(t,c)=>portraitURL(t,c),rl:()=>refreshLegal(),G:()=>G,render:()=>render(),N:()=>N,mv:(i)=>{select(i);return G.selMoves.map(m=>m.t);},ENG,NAMES};
