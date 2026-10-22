/* ===== UI (helpers $, GL, pieceHtml live in the FX file) ===== */
let toastTimer=0,aiTimer=0;

toastFn=(txt,k)=>{
  const t=$('toast');t.textContent=txt;t.className='toast show '+k;
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>{t.className='toast '+k;},2600);
};

function legendHtml(){
  return Object.keys(PW).map(k=>'<li><span class="orb '+k+'">'+ICON[k]+'</span><div><strong>'+PW[k].name+'</strong><span class="d">'+PW[k].d+'</span></div></li>').join('');
}
function shopLegend(){
  return Object.keys(ITEMS).map(k=>'<li><span class="gcost">'+ITEMS[k].cost+'g</span><div><strong>'+ITEMS[k].name+'</strong><span class="d">'+ITEMS[k].d+'</span></div></li>').join('');
}
function unitsHtml(){
  return[['M','Commander','Leaps to the outer ring of its 5×5 box. Needs an empty route through the inner 3×3.'],['H','Champion','Shop unit. Moves anywhere in a 5×5 box, never captures a king.']]
    .map(u=>'<li><span class="uprev">'+portraitImg(u[0],0)+'</span><div><strong>'+u[1]+'</strong><span class="d">'+u[2]+'</span></div></li>').join('');
}

function render(){
  const flip=G.flip,dest=new Map(G.selMoves.map(m=>[m.t,m]));
  const chkSq=inCheck(stOf())?kingSq(G.b,G.turn):-1;
  const tgtV=G.tgt?G.tgt.valid:null,mtSet=new Set(),mtCtr=new Set();for(const m of G.meteors){mtCtr.add(m.sq);for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const rr=rowOf(m.sq)+dr,cc=colOf(m.sq)+dc;if(rr>=0&&rr<N&&cc>=0&&cc<N)mtSet.add(rr*N+cc);}}
  const rzOn=[0,1].map(c=>G.rz[c]>G.ply?rzSet(c):null),chuteSq=G.chute?new Set(chuteSpots(G.turn)):tgtV;
  const loserKing=G.over&&G.over.type==='mate'&&G.fallenOn?kingSq(G.b,1-G.over.winner):-1;
  sync3d();
  G.freshP=new Set();G.freshO=new Set();

  if(G.over&&!G.overSeen){
    G.overSeen=true;
    const g0=G;
    if(G.over.type==='mate'){
      const ki=kingSq(G.b,1-G.over.winner);
      if(FX.on)setTimeout(()=>{if(G!==g0)return;g0.fallenOn=true;v3KingFall(ki);},620);
      else g0.fallenOn=true;
    }
    G.overDelay=FX.on?(G.over.type==='mate'?2000:700):0;
    if(G.overDelay)setTimeout(()=>{if(G!==g0)return;g0.overDelay=0;render();},G.overDelay);
  }

  const ai=isAI(G.turn)&&!G.over;
  $('tdot').className='tdot '+(G.turn===0?'w':'b');
  let tt=SIDE[G.turn]+' to move';
  if(G.over)tt='Game over';
  else if(G.xt)tt=SIDE[G.turn]+': extra move (different piece)';
  else if(G.bonus!=null)tt=SIDE[G.turn]+': bonus move';
  else if(ai)tt='Computer is thinking';
  $('turnTxt').textContent=tt;
  $('chkTxt').textContent=!G.over&&chkSq>=0?'Check':'';
  $('surgeTxt').textContent='Orbs '+G.pw.filter(Boolean).length+'/'+MAX_ORBS+' · White '+G.gold[0]+'g · Black '+G.gold[1]+'g';
  $('pips').innerHTML='';
  renderShop();renderAug();
  driveDraft();
  $('log').innerHTML=G.log.slice(0,8).map(e=>'<li class="'+e.k+'">'+e.t+'</li>').join('');
  $('skipBtn').hidden=!((G.bonus!=null||G.xt)&&!ai);

  $('tgtBar').hidden=!G.tgt;
  if(G.tgt){const T={polar:G.tgt.step?'Polarity: pick the unit to swap with.':'Polarity: pick the first unit.',turret:'Turret: pick an empty tile touching one of your pieces.',ram:'Battering Ram: pick a free tile on your home rank.',archer:'Archer: pick an empty tile directly behind one of your pawns.',wall:'Castle Wall: pick an empty tile. A wall of up to 3 blocks is built across it.',deploy:'Deploy Pawn: pick the centre of a plus-shaped 5-pawn block on your half.',blink:G.tgt.step?'Phase Step: pick an empty square within 3 tiles.':'Phase Step: pick a piece to teleport.',meteor:'Falling Star: pick the centre of a 3×3 area on the enemy half.',frost:'Winter’s Grasp: pick the centre of a 3×3 area.',zhonya:"Frozen Moment: pick one of your pieces."};$('tgtTxt').textContent=T[G.tgt.kind];$('tgtCancel').textContent=G.tgt.forced?'Random spot':'Cancel';}
  $('promo').hidden=!G.promo;
  if(G.promo){
    $('promoBtns').innerHTML=['Q','M','R','B','N'].map(t=>'<button type="button" data-t="'+t+'" aria-label="'+NAMES[t]+'">'+portraitImg(t,G.turn)+'</button>').join('');
  }
  $('over').hidden=!G.over||G.overHidden||!!G.overDelay;
  if(G.over){
    const o=G.over;$('recap').innerHTML=recapHtml();
    $('overTitle').textContent=o.type==='mate'?'Checkmate':o.type==='stalemate'?'Stalemate':'Draw';
    $('overTxt').textContent=o.type==='mate'?SIDE[o.winner]+' wins'+(opts.mode==='ai'?(o.winner===opts.human?'. Nice one.':'. The computer got you.'):'.'):o.type==='stalemate'?SIDE[G.turn]+' has no legal move and is not in check.':'Only the two kings are left.';
  }
}

const SHOP_SVG={
  rm:'<svg viewBox="0 0 32 32"><rect x="3" y="13" width="20" height="7" rx="2" fill="currentColor"/><path d="M23 11l7 5.500-7 5.500z" fill="currentColor"/><circle cx="8" cy="25" r="3.500" fill="currentColor"/><circle cx="19" cy="25" r="3.500" fill="currentColor"/><path d="M8 20v2M19 20v2" stroke="currentColor" stroke-width="2"/></svg>',
  ar:'<svg viewBox="0 0 32 32"><path d="M8 4c10 3 10 21 0 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M8 4v24M8 16h20M23 11l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  as:'<svg viewBox="0 0 32 32"><path d="M16 3l9 11h-6v9h-6v-9H7z" fill="currentColor"/><path d="M7 27h18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  dk:'<svg viewBox="0 0 32 32"><path d="M16 2v5M13.500 4.500h5M16 8c-3 0-5 2-5 4.500 0 1.500.7 2.700 1.800 3.500L11 25h10l-1.800-9c1.100-.8 1.800-2 1.800-3.500C21 10 19 8 16 8z" fill="currentColor"/><path d="M25 5v3M23.500 6.500h3" stroke="currentColor" stroke-width="2"/></svg>',
  sn:'<svg viewBox="0 0 32 32"><path d="M5 11h17l-4-4M27 21H10l4 4" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  rz:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="16" cy="16" r="4" fill="currentColor"/><path d="M16 2v6M16 24v6M2 16h6M24 16h6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  ch:'<svg viewBox="0 0 32 32"><path d="M4 15C4 8 9.500 3 16 3s12 5 12 12c-2-2-4-2.500-6-1-2-2-4-2-6 0-2-2-4-2-6 0-2-1.500-4-1-6 1z" fill="currentColor"/><path d="M8 15l8 11M16 14v12M24 15l-8 11" stroke="currentColor" stroke-width="1.800" fill="none" stroke-linecap="round"/><rect x="13" y="25" width="6" height="5" rx="1.500" fill="currentColor"/></svg>',
  hc:'<svg viewBox="0 0 32 32"><path d="M16 3l11 4v8c0 7-5 12-11 14C10 27 5 22 5 15V7z" fill="currentColor"/><path d="M16 9l2 4.500 5 .5-3.700 3.300 1.200 5-4.500-2.700-4.500 2.700 1.200-5L9 14l5-.5z" fill="rgba(255,255,255,.8)"/></svg>',
  ms:'<svg viewBox="0 0 32 32"><path d="M24 3c-7 1-13 7-14 14l5 5c7-1 13-7 14-14z" fill="currentColor"/><circle cx="21" cy="11" r="2.800" fill="rgba(255,255,255,.85)"/><path d="M10 17l-5 1 3 3M15 22l-1 5-3-3" fill="currentColor"/><path d="M6 26c1-4 3-5 5-5" stroke="currentColor" stroke-width="2.500" stroke-linecap="round" fill="none"/></svg>',
  sq:'<svg viewBox="0 0 32 32"><path d="M4 11l6 6 6-10 6 10 6-6-3 15H7z" fill="currentColor"/><circle cx="4" cy="10" r="2.2" fill="currentColor"/><circle cx="28" cy="10" r="2.2" fill="currentColor"/><circle cx="16" cy="6" r="2.2" fill="currentColor"/><rect x="7" y="27" width="18" height="2.5" rx="1" fill="currentColor"/></svg>',
  fo:'<svg viewBox="0 0 32 32"><rect x="6" y="5" width="6" height="22" rx="2" fill="currentColor"/><rect x="13" y="9" width="6" height="18" rx="2" fill="currentColor"/><rect x="20" y="5" width="6" height="22" rx="2" fill="currentColor"/><path d="M4 27h24" stroke="currentColor" stroke-width="3"/></svg>',
  bw:'<svg viewBox="0 0 32 32"><path d="M3 9h4V6h4v3h4V6h4v3h4V6h4v3h2v19H3z" fill="currentColor"/><path d="M3 16h26M3 22h26M10 9v7M20 9v7M15 16v6M6 22v6M25 22v6" stroke="rgba(0,0,0,.28)" stroke-width="1.600" fill="none"/></svg>'
};
let shopBuilt=false,lastGold=[-1,-1];
function buildShop(){
  $('shopList').innerHTML=Object.keys(ITEMS).map(k=>{const it=ITEMS[k];
    return'<li><button type="button" class="item i-'+k+'" data-k="'+k+'" title="'+it.d.replace(/"/g,'&quot;')+'"><span class="ico">'+SHOP_SVG[k]+'</span><span class="txt"><strong>'+it.name+'</strong><span class="d">'+it.short+'</span></span><span class="price"><i class="coin"></i><b>'+it.cost+'</b></span></button></li>';}).join('');
  shopBuilt=true;
}
function renderShop(){
  if(!shopBuilt)buildShop();
  const c=G.turn,human=!isAI(c)&&canShop();
  $('goldRow').innerHTML=[0,1].map(s=>'<span class="'+(c===s?'on':'')+'" data-s="'+s+'"><i class="coin"></i>'+SIDE[s]+' <b>'+G.gold[s]+'</b></span>').join('');
  for(const s of[0,1]){if(lastGold[s]>=0&&lastGold[s]!==G.gold[s]){const e=$('goldRow').querySelector('[data-s="'+s+'"]');if(e&&FX.on)e.animate([{transform:'scale(1)'},{transform:'scale(1.16)',offset:.35},{transform:'scale(1)'}],{duration:380,easing:'ease-out'});}lastGold[s]=G.gold[s];}
  for(const li of $('shopList').children){
    const btn=li.firstChild,k=btn.dataset.k,it=ITEMS[k],cost=price(c,k),can=human&&G.gold[c]>=cost,act=(k==='ch'&&G.chute)||(k==='rz'&&G.rz[c]>G.ply);
    const cdl=(G.cd[c]&&G.cd[c][k])||0;btn.disabled=(!can||cdl>0)&&!(k==='ch'&&G.chute&&human);btn.classList.toggle('act',act);btn.classList.toggle('poor',!can&&G.gold[c]<cost);
    btn.classList.toggle('cd',cdl>0);btn.querySelector('b').textContent=(k==='ch'&&G.chute)?'cancel':cdl>0?cdl+' turns':cost;
  }
}
function shopFx(btn,k){
  if(!FX.on||!btn.animate)return;
  btn.classList.remove('pop');void btn.offsetWidth;btn.classList.add('pop');
  const r=btn.getBoundingClientRect(),cols={sq:'255,215,100',rz:'255,90,110',ch:'110,200,255',hc:'255,205,90',ms:'255,150,70',bw:'150,200,170',as:'255,215,100',dk:'255,140,160',sn:'176,144,255',fo:'255,255,255'}[k];
  const mk=(css,txt)=>{const e=document.createElement('div');e.style.cssText='position:fixed;pointer-events:none;z-index:60;'+css;if(txt)e.textContent=txt;document.body.appendChild(e);return e;};
  for(let n=0;n<14;n++){
    const x=r.left+r.width*(.15+Math.random()*.7),y=r.top+r.height*.5,s=6+Math.random()*7,coin=n%3!==0;
    const e=mk('left:'+x+'px;top:'+y+'px;width:'+s+'px;height:'+s+'px;border-radius:'+(coin?'50%':'2px')+';background:'+(coin?'#f6c945':'rgb('+cols+')')+';box-shadow:0 0 6px '+(coin?'#f6c945':'rgb('+cols+')')+';');
    const dx=(Math.random()-.5)*120,dy=-40-Math.random()*70;
    e.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate('+dx*.6+'px,'+dy+'px) scale(1.1)',opacity:1,offset:.45},{transform:'translate('+dx+'px,'+(dy+90)+'px) scale(.3)',opacity:0}],{duration:650+Math.random()*350,easing:'cubic-bezier(.2,.7,.4,1)'}).onfinish=()=>e.remove();
  }
  const t=mk('left:'+(r.right-70)+'px;top:'+(r.top+6)+'px;font:800 18px var(--fd,inherit);color:#ffd45e;text-shadow:0 2px 0 #7a4a00,0 0 10px rgba(255,200,60,.8);','-'+price(G.turn,k)+'g');
  t.animate([{transform:'translateY(0) scale(.6)',opacity:0},{transform:'translateY(-14px) scale(1.2)',opacity:1,offset:.25},{transform:'translateY(-48px) scale(1)',opacity:0}],{duration:900,easing:'ease-out'}).onfinish=()=>t.remove();
}
function driveDraft(){
  const g0=G;
  if(G.draft&&isAI(G.draft.side)&&!G.draft._s){G.draft._s=true;setTimeout(()=>{if(G!==g0||!G.draft)return;const o=G.draft.opts.filter(k=>k!=='blink'&&k!=='wall'&&k!=='polarity'&&k!=='formation');pickAug(pick(o.length?o:G.draft.opts));flow();},1400);}
  if(G.tgt&&G.tgt.forced&&isAI(G.tgt.c)&&!G.tgt._s){G.tgt._s=true;setTimeout(()=>{if(G!==g0)return;autoTgt();flow();},800);}
}
function flow(){
  render();
  if(!G.draft&&!G.tgt&&!G.over&&isAI(G.turn)){clearTimeout(aiTimer);aiTimer=setTimeout(aiStep,700);}
}
function recapHtml(){
  const S=G.stats,sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
  const best=o=>{const e=Object.entries(o).sort((a,b)=>b[1]-a[1])[0];const cap=s=>s[0].toUpperCase()+s.slice(1);return e?(e[0]==='fire'?'Fire':e[0]==='ability'?'Abilities':cap(NAMES[e[0]]))+' ('+e[1]+')':'-';};
  const orbs=s=>sum(S.orbs[s]),row=(l,a,b)=>'<tr><td>'+l+'</td><td>'+a+'</td><td>'+b+'</td></tr>';
  let h='<table><tr><th></th><th>White</th><th>Black</th></tr>'+row('Kills',sum(S.k[0]),sum(S.k[1]))+row('Top killer',best(S.k[0]),best(S.k[1]))+row('Clutch kills',sum(S.cl[0]),sum(S.cl[1]))+row('Longest streak',S.str[0],S.str[1])+row('Gold earned',S.gold[0],S.gold[1])+row('Orbs taken',orbs(0),orbs(1))+row('Gold mine income',S.gm[0],S.gm[1])+row('Boss sacrifices',S.sac[0],S.sac[1])+row('Attackers lost to fort',S.ft[1],S.ft[0])+'</table>';
  h+='<p class="fine">Game length: '+G.ply+' moves'+(G.over&&G.over.type==='mate'&&S.mateBy?' · mate delivered by the '+NAMES[S.mateBy]:'')+(S.slam?' · boss slams: '+S.slam:'')+'</p>';
  if(S.tp)h+='<p class="tp">Turning point (move '+S.tp.ply+'): '+S.tp.txt+'.</p>';
  return h;
}
function renderAug(){
  const rw=G.reward;$('bossRew').hidden=!rw;
  if(rw){$('brTitle').textContent=SIDE[rw.side]+' slays the Vanguard';$('brSub').textContent=rw.keys.length+' free augment'+(rw.keys.length===1?'':'s')+'. They last the rest of the game.';
    $('brCards').innerHTML=rw.keys.map(k=>{const a=AUG[k];return'<div class="augc t-'+a.t+'"><span class="aug-t">'+TIER[a.t]+'</span><span class="aug-i">'+a.i+'</span><strong>'+a.n+'</strong><span class="aug-d">'+a.d+'</span></div>';}).join('');}
  const d=G.draft;$('aug').hidden=!d;
  if(d){
    const ai=isAI(d.side);
    $('augTitle').textContent=SIDE[d.side]+(ai?' is choosing an augment…':': choose an augment');
    $('augCards').innerHTML=d.opts.map(k=>{const a=AUG[k];return'<button type="button" class="augc t-'+a.t+'" data-k="'+k+'"'+(ai?' disabled':'')+'><span class="aug-t">'+TIER[a.t]+'</span><span class="aug-i">'+a.i+'</span><strong>'+a.n+'</strong><span class="aug-d">'+a.d+'</span></button>';}).join('');
  }
  const next=AUG_EVERY-(G.ply%AUG_EVERY);
  $('augList').innerHTML=[0,1].map(s=>'<div class="augrow"><b>'+SIDE[s]+'</b><span class="chips">'+(G.aug[s].length?G.aug[s].map(k=>'<span class="chip t-'+AUG[k].t+(AUG[k].act&&G.used[s][k]?' spent':'')+'" title="'+AUG[k].d.replace(/"/g,'&quot;')+'">'+AUG[k].i+' '+AUG[k].n+'</span>').join(''):'<em>none yet</em>')+'</span></div>').join('')+'<p class="fine">Next augment pick in '+next+' turns.</p>';
  const dc=$('dockAug');if(dc)dc.innerHTML=[0,1].map(sd=>G.aug[sd].map(k=>'<span title="'+SIDE[sd]+': '+AUG[k].n+'">'+AUG[k].i+'</span>').join('')).join('')||'<span style="opacity:.45">none</span>';
  const c=G.turn,show=!isAI(c)&&!G.over,ab=show?G.aug[c].filter(k=>AUG[k].act&&!G.used[c][k]):[];
  const tn=show?G.inv[c].turret:0,pn=show?G.inv[c].polarity:0,an=show?G.inv[c].archer:0,rn=show?G.inv[c].ram:0;
  const hasIt=!!(ab.length||tn||pn||an||rn);$('itemBar').hidden=!hasIt;$('game').classList.toggle('has-items',hasIt);
  const tur=tn?'<li><button type="button" class="item i-ab" data-a="turret" title="Place a turret next to any of your pieces"'+(canShop()?'':' disabled')+'><span class="ico">'+ICON.t+'</span><span class="txt"><strong>Turret x'+tn+'</strong><span class="d">Place beside an ally. 25% auto-shot per turn in its 5×5 box, 3 shots.</span></span><span class="price"><b>Place</b></span></button></li>':'';
  const arc=an?'<li><button type="button" class="item i-ab" data-a="archer" title="Place an archer directly behind one of your pawns"'+(canShop()?'':' disabled')+'><span class="ico">🏹</span><span class="txt"><strong>Archer x'+an+'</strong><span class="d">Place behind a pawn. Shoots 4 tiles in a plus line.</span></span><span class="price"><b>Place</b></span></button></li>':'';
  const rmb=rn?'<li><button type="button" class="item i-ab" data-a="ram" title="Deploy a battering ram on your home rank"'+(canShop()?'':' disabled')+'><span class="ico">🐏</span><span class="txt"><strong>Battering Ram x'+rn+'</strong><span class="d">Deploy on a free home-rank tile. It marches by itself.</span></span><span class="price"><b>Deploy</b></span></button></li>':'';
  const pol=pn?'<li><button type="button" class="item i-ab" data-a="polarity" title="Swap any two units"'+(canShop()?'':' disabled')+'><span class="ico">🧲</span><span class="txt"><strong>Polarity x'+pn+'</strong><span class="d">Pick two units to swap places. Free action.</span></span><span class="price"><b>Use</b></span></button></li>':'';
  $('abilList').innerHTML=tur+arc+rmb+pol+ab.map(k=>'<li><button type="button" class="item i-ab" data-a="'+k+'" title="'+AUG[k].d.replace(/"/g,'&quot;')+'"'+(canShop()?'':' disabled')+'><span class="ico">'+AUG[k].i+'</span><span class="txt"><strong>'+AUG[k].n+'</strong><span class="d">'+AUG[k].d.split(':').pop().trim().slice(0,70)+'</span></span><span class="price"><b>Use</b></span></button></li>').join('');
}
function whyIllegal(f,t){
  const q=G.b[f];if(!q)return null;const r=rowOf(f),c=colOf(f),dr=rowOf(t)-r,dc=colOf(t)-c,ad=Math.max(Math.abs(dr),Math.abs(dc));
  if(q.t==='M'&&ad===2){
    const cs=[];for(const a of[Math.floor(dr/2),Math.ceil(dr/2)])for(const k of[Math.floor(dc/2),Math.ceil(dc/2)]){const sq=(r+a)*N+c+k;if(!cs.includes(sq))cs.push(sq);}
    if(cs.every(sq=>G.b[sq]&&!(G.b[sq].inv>0)))return 'Commander blocked: its route goes through '+cs.map(sqName).join(' / ')+', which '+(cs.length>1?'are':'is')+' occupied. It needs an empty tile on the way.';
  }
  const straight=!dr||!dc,diag=Math.abs(dr)===Math.abs(dc);
  if(q.t==='R'&&straight&&ad>8)return 'Out of range: rooks slide at most 8 tiles.';
  if(q.t==='B'&&diag&&ad>7)return 'Out of range: bishops slide at most 7 tiles.';
  return null;
}
function select(i){G.sel=i;G.selMoves=G.legal.filter(m=>m.f===i);}
function after(){
  if(!G.over&&G.bonus!=null&&!isAI(G.turn))select(G.bonus);
  render();
  clearTimeout(aiTimer);
  if(!G.over&&isAI(G.turn)){
    const k=G.lastKill,wait=!FX.on?350:G.bonus!=null?750:k==='Q'?1500:k?950:650;
    aiTimer=setTimeout(aiStep,wait*(G.bg?.85:opts.mode==='sim'?(opts.spd||1):1));
  }
}
function commit(m,t){play(m,t);after();}

function onSquare(i){
  if(G&&G.holdUntil&&performance.now()<G.holdUntil)return;
  if(!G||G.over||G.promo||G.draft||G.reward||G.paused||G.bg)return;
  if(adminSquare(i))return;
  if(G.tgt){if(isAI(G.tgt.c))return;if(!tgtClick(i))toastFn('Pick one of the highlighted squares.','n');flow();return;}
  if(isAI(G.turn))return;
  if(G.bonus!=null&&G.bonusNoCap&&i===G.bonus){skipBonus();after();return;}
  if(G.chute){
    if(!doChute(i)){G.chute=false;toastFn('Parachute cancelled. Pick a highlighted square next time.','n');}
    render();return;
  }
  if(G.sel!=null){
    const m=G.selMoves.find(x=>x.t===i);
    if(m){
      if(m.pr){G.promo=m;render();return;}
      if(has(G.turn,'formation')&&G.bonus==null&&G.b[m.f]&&G.b[m.f].t==='P'&&!G.b[m.cs]&&m.fl!==2&&colOf(m.f)===colOf(m.t)){
        const grp=formationGroup(m);
        if(grp.length){G.fm={m,grp};$('fmTxt').textContent='Move this pawn, or march '+grp.length+' touching pawn'+(grp.length===1?'':'s')+' forward with it. Formation moves never capture.';$('fmModal').hidden=false;return;}
      }
      commit(m,'Q');return;
    }
  }
  const p=G.b[i],chk=inCheck(stOf());
  if(p&&p.c===G.turn){
    if(G.bonus!=null&&G.bonus!==i){toastFn('Bonus move: only the highlighted piece can move. Use Skip bonus move to end your turn.','r');}
    else if(G.legal.some(m=>m.f===i))select(i);
    else{
      toastFn(chk?'You are in check. This piece has no move that fixes it.':'This piece has no legal move right now (it may be pinned to your king).','n');
      if(G.bonus==null){G.sel=null;G.selMoves=[];}
    }
  }else if(G.sel!=null){
    if(p){const w=whyIllegal(G.sel,i);toastFn(w||'Illegal move: normal chess rules apply, and your king can\'t be left in check.','n');}
    if(G.bonus==null){G.sel=null;G.selMoves=[];}
  }else if(p){
    toastFn('Select one of your own pieces first, then click the enemy piece to capture it.','n');
  }
  render();
}

function aiStep(){
  if(!G||G.over||!isAI(G.turn))return;
  if(G.draft||G.tgt)return;
  if(G.paused){clearTimeout(aiTimer);aiTimer=setTimeout(aiStep,300);return;}
  if(G.holdUntil&&performance.now()<G.holdUntil){clearTimeout(aiTimer);aiTimer=setTimeout(aiStep,250);return;}
  if(G.xt&&aiExtra()){after();return;}
  const bonus=G.bonus!=null;
  if(!bonus&&(aiAbility()||aiShop())){render();clearTimeout(aiTimer);aiTimer=setTimeout(aiStep,1100);return;}
  if(!bonus&&aiBoss()){after();return;}
  if(G.aiBusy)return;
  const g0=G,turn0=G.turn,bn=bonus?G.bonus:null,bnc=G.bonusNoCap;
  G.aiBusy=true;
  aiThink(stOf(),lvlOf(G.turn),bn,G.pw,bnc).then(res=>{
    if(G!==g0)return;
    g0.aiBusy=false;
    const go=()=>{
      if(G!==g0||G.over||G.turn!==turn0)return;
      if(G.paused||(G.holdUntil&&performance.now()<G.holdUntil)){setTimeout(go,250);return;}
      if(!res||(bonus&&res.skip)){if(bonus)skipBonus();after();return;}
      play(res.m,'Q');after();
    };
    go();
  });
}
/* AI search runs in a Web Worker (built from the engine source) so the game never freezes while it thinks. */
const AIW={w:null,seq:0,pend:new Map(),bad:false};
function aiWorker(){
  if(AIW.bad)return null;if(AIW.w)return AIW.w;
  try{
    const src=document.getElementById('engSrc').textContent+"\nonmessage=e=>{const d=e.data;let res=null,err=null;try{N=d.N;Object.assign(ENG,d.eng);res=aiPick(d.S,d.level,d.onlySq,d.pw,d.noCap);}catch(x){err=String(x&&x.stack||x);}postMessage({id:d.id,res,err});};";
    const w=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
    w.onmessage=e=>{const f=AIW.pend.get(e.data.id);if(f){AIW.pend.delete(e.data.id);f(e.data);}};
    w.onerror=()=>{AIW.bad=true;AIW.w=null;for(const f of[...AIW.pend.values()])f({err:'worker failed'});AIW.pend.clear();};
    AIW.w=w;return w;
  }catch(e){AIW.bad=true;return null;}
}
function aiThink(S,level,onlySq,pw,noCap){
  return new Promise(resolve=>{
    const sync=()=>resolve(aiPick(S,level,onlySq,pw,noCap)),w=aiWorker();
    if(!w){sync();return;}
    const id=++AIW.seq;let done=false;
    const dog=setTimeout(()=>{if(!done){done=true;AIW.pend.delete(id);sync();}},15000);
    AIW.pend.set(id,d=>{if(done)return;done=true;clearTimeout(dog);if(d.err){console.warn('AI worker:',d.err);sync();}else resolve(d.res);});
    try{w.postMessage({id,N,eng:ENG,S,level,onlySq,pw,noCap});}catch(e){done=true;clearTimeout(dog);AIW.pend.delete(id);sync();}
  });
}

function show(which){
  $('menu').hidden=which!=='menu';
  $('game').hidden=which!=='game';
  document.body.classList.toggle('m-menu',which==='menu');document.body.classList.toggle('m-game',which==='game');
  SFX.bg=which==='menu';
  if(typeof v3Menu==='function')v3Menu(which==='menu');
}
function start(mode){
  if(typeof adminShow==='function'){adminShow(false);adminBadge(false);}
  opts.mode=mode;
  clearTimeout(aiTimer);
  newGame();G.killcam=opts.killcam!==false;v3Reset();show('game');after();
  showVs();
  if(typeof uiGameStart==='function')uiGameStart();
}
const ENV_INFO={
  volcano:{n:'VOLCANO',i:'🌋',c:'#ff7a30',a:'#2a0d06',b:'#080403',d:'Each turn, a 15% chance a meteor hits a random square outside the safe rows. It kills what is there and leaves a burning crater that fades 10% per turn.'},
  sky:{n:'SKY ISLAND',i:'☁️',c:'#8fd0ff',a:'#16365f',b:'#060d1a',d:'Each turn, a 20% chance of a galeforce: a random row is shoved one tile left or right. Pieces with open space move; edges and blockers hold.'},
  rain:{n:'RAINFOREST',i:'🌧️',c:'#6fe39a',a:'#0e3322',b:'#040b07',d:'Each turn, a 20% chance a puddle forms. A unit that stays on a puddle for 6 rounds makes a random power-up appear next to it.'}
};
let vsTimer=0;
function showVs(){
  const o=$('vsOv');if(!o||!G||G.bg)return;
  const E=ENV_INFO[G.env];if(!E)return;
  const lvT=c=>'AI · LV '+lvNum(lvlOf(c));
  $('vsA').textContent=opts.mode==='ai'?(opts.human===0?'YOU':lvT(0)):opts.mode==='sim'?lvT(0):SIDE[0].toUpperCase();$('vsB').textContent=opts.mode==='ai'?(opts.human===1?'YOU':lvT(1)):opts.mode==='sim'?lvT(1):SIDE[1].toUpperCase();
  $('vsEi').textContent=E.i;$('vsEn').textContent=E.n;$('vsEd').textContent=E.d;
  o.style.setProperty('--vsc',E.c);o.style.setProperty('--vs1',E.a);o.style.setProperty('--vs2',E.b);
  o.classList.remove('out');o.hidden=false;G.holdUntil=performance.now()+3300;
  clearTimeout(vsTimer);const close=()=>{clearTimeout(vsTimer);o.classList.add('out');setTimeout(()=>{o.hidden=true;},460);G.holdUntil=0;if(G)flow();};
  o.onclick=close;vsTimer=setTimeout(close,3200);
}

/* ===== wiring ===== */
$('promoBtns').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||!G.promo)return;
  const m=G.promo;G.promo=null;commit(m,b.dataset.t);
});
$('promoCancel').addEventListener('click',()=>{G.promo=null;render();});
$('shopList').addEventListener('click',e=>{const b=e.target.closest('button[data-k]');if(!b||!G||isAI(G.turn))return;const k=b.dataset.k,ok=buy(k);if(ok&&k!=='ch')shopFx(b,k);render();});
$('augCards').addEventListener('click',e=>{const b=e.target.closest('button[data-k]');if(!b||!G.draft||isAI(G.draft.side))return;sfx('pick');pickAug(b.dataset.k);flow();});
$('abilList').addEventListener('click',e=>{const b=e.target.closest('button[data-a]');if(!b||!G||isAI(G.turn))return;useAbility(b.dataset.a);flow();});
$('tgtCancel').addEventListener('click',()=>{if(G&&G.tgt){cancelTgt();flow();}});
$('skipBtn').addEventListener('click',()=>{if((G.bonus!=null||G.xt)&&!isAI(G.turn)){skipBonus();after();}});
$('rematch').addEventListener('click',()=>uiFade(()=>start(opts.mode)));
$('overMenu').addEventListener('click',()=>uiToMenu());
$('overView').addEventListener('click',()=>{G.overHidden=true;render();});

$('v3Reset').addEventListener('click',()=>{v3ResetCam();});
v3Boot();
$('brOk').addEventListener('click',()=>{if(G){G.reward=null;render();}});
$('fmGo').addEventListener('click',()=>{const f=G.fm;$('fmModal').hidden=true;G.fm=null;if(f)commit(Object.assign({},f.m,{grp:f.grp}),'Q');});
$('fmSolo').addEventListener('click',()=>{const f=G.fm;$('fmModal').hidden=true;G.fm=null;if(f)commit(f.m,'Q');});
$('fmCancel').addEventListener('click',()=>{$('fmModal').hidden=true;G.fm=null;render();});
