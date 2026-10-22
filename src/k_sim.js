
/* ===== Sim lab: watch AI vs AI and bulk headless runs ===== */
const SIM_MAX=360;
let simRun=null;
function simStepOnce(){
  if(G.over)return false;
  if(G.draft){const o=G.draft.opts.filter(k=>k!=='blink'&&k!=='wall'&&k!=='polarity'&&k!=='formation');pickAug(pick(o.length?o:G.draft.opts));return true;}
  if(G.tgt){autoTgt();if(G.tgt)G.tgt=null;return true;}
  G.reward=null;
  if(G.xt&&aiExtra())return true;
  const bonus=G.bonus!=null,key=G.ply+':'+(bonus?1:0);
  simStepOnce.k=simStepOnce.k===key?simStepOnce.n+1:0;simStepOnce.n=simStepOnce.k;simStepOnce.k=key;
  const spin=simStepOnce.n>25;
  if(!spin&&!bonus&&aiBoss())return true;
  if(!spin&&!bonus&&(aiAbility()||aiShop()))return true;
  const res=aiPick(stOf(),lvlOf(G.turn),bonus?G.bonus:null,G.pw,G.bonusNoCap);
  if(!res||(bonus&&res.skip)){if(bonus){skipBonus();return true;}return false;}
  play(res.m,'Q');return true;
}
function simSummary(lv){
  const S=G.stats,o=G.over;
  return{w:lv[0],b:lv[1],winner:o&&o.type==='mate'?o.winner:-1,end:o?o.type:'cap',plies:G.ply,
    k:S.k,d:S.d,cl:S.cl,orbs:S.orbs,buys:S.buys,gold:S.gold,sac:S.sac,gm:S.gm,str:S.str,ft:S.ft,contest:S.contest,slam:S.slam,
    mateBy:S.mateBy,tp:S.tp,mat:[matOf(0),matOf(1)],aug:G.aug.map(a=>a.slice()),boss:G.boss.hits.slice(),bossDone:G.boss.done,bossOn:G.boss.on};
}
function simAgg(rs,cfg){
  const A={cfg,games:rs.length,wins:[0,0],draws:0,plies:0,k:[{},{}],d:[{},{}],cl:[{},{}],mate:{},orbs:[{},{}],buys:[{},{}],aug:[{},{}],augWin:{},gold:[0,0],sac:[0,0],gm:[0,0],str:[0,0],ft:[0,0],contest:[0,0],slam:0,bossClaimed:[0,0],bossGone:0};
  const add=(a,b)=>{for(const k in b)a[k]=(a[k]||0)+b[k];};
  for(const r of rs){
    if(r.winner<0)A.draws++;else{A.wins[r.winner]++;for(const k of r.aug[r.winner])A.augWin[k]=(A.augWin[k]||0)+1;}
    A.plies+=r.plies;for(const s of[0,1]){add(A.k[s],r.k[s]);add(A.d[s],r.d[s]);add(A.cl[s],r.cl[s]);add(A.orbs[s],r.orbs[s]);add(A.buys[s],r.buys[s]);for(const k of r.aug[s])A.aug[s][k]=(A.aug[s][k]||0)+1;
      A.gold[s]+=r.gold[s];A.sac[s]+=r.sac[s];A.gm[s]+=r.gm[s];A.str[s]=Math.max(A.str[s],r.str[s]);A.ft[s]+=r.ft[s];A.contest[s]+=r.contest[s];}
    if(r.mateBy)A.mate[r.mateBy]=(A.mate[r.mateBy]||0)+1;A.slam+=r.slam;
    if(r.boss[0]>=5)A.bossClaimed[0]++;else if(r.boss[1]>=5)A.bossClaimed[1]++;else if(r.bossDone)A.bossGone++;
  }
  A.avgPlies=Math.round(A.plies/Math.max(1,rs.length));
  return A;
}
function simTable(A){
  const types=['P','N','B','R','Q','K','M','C','H','T','fire','ability'],nm=t=>t==='fire'?'Fire':t==='ability'?'Abilities':NAMES[t][0].toUpperCase()+NAMES[t].slice(1);
  const g=A.games,pc=v=>(Math.round(v*10)/10);
  let h='<h3>Results · '+g+' games · avg '+A.avgPlies+' moves</h3><table class="simt"><tr><th></th><th>White ('+A.cfg.lv[0]+')</th><th>Black ('+A.cfg.lv[1]+')</th></tr>'
   +'<tr><td>Wins</td><td>'+A.wins[0]+'</td><td>'+A.wins[1]+'</td></tr><tr><td>Draws / cap</td><td colspan="2">'+A.draws+'</td></tr>'
   +'<tr><td>Gold earned / game</td><td>'+pc(A.gold[0]/g)+'</td><td>'+pc(A.gold[1]/g)+'</td></tr>'
   +'<tr><td>Gold mine income / game</td><td>'+pc(A.gm[0]/g)+'</td><td>'+pc(A.gm[1]/g)+'</td></tr>'
   +'<tr><td>Boss sacrifices / game</td><td>'+pc(A.sac[0]/g)+'</td><td>'+pc(A.sac[1]/g)+'</td></tr>'
   +'<tr><td>Boss claimed</td><td>'+A.bossClaimed[0]+'</td><td>'+A.bossClaimed[1]+'</td></tr>'
   +'<tr><td>Attackers lost on fortified tiles</td><td>'+A.ft[1]+'</td><td>'+A.ft[0]+'</td></tr>'
   +'<tr><td>Contested orbs taken</td><td>'+A.contest[0]+'</td><td>'+A.contest[1]+'</td></tr>'
   +'<tr><td>Best kill streak</td><td>'+A.str[0]+'</td><td>'+A.str[1]+'</td></tr></table>';
  h+='<h3>Units</h3><table class="simt"><tr><th>Unit</th><th>Kills W/B</th><th>Lost W/B</th><th>Clutch kills W/B</th><th>Mates</th></tr>';
  for(const t of types){const kk=[A.k[0][t]||0,A.k[1][t]||0],dd=[A.d[0][t]||0,A.d[1][t]||0],cc=[A.cl[0][t]||0,A.cl[1][t]||0];
    if(!kk[0]&&!kk[1]&&!dd[0]&&!dd[1])continue;
    h+='<tr><td>'+nm(t)+'</td><td>'+kk[0]+' / '+kk[1]+'</td><td>'+(t==='fire'||t==='ability'?'-':dd[0]+' / '+dd[1])+'</td><td>'+cc[0]+' / '+cc[1]+'</td><td>'+(A.mate[t]||0)+'</td></tr>';}
  h+='</table><p class="fine">Clutch kill = a capture made while that side was behind by more than 2 pawns of material. “Lost” counts units of that colour destroyed.</p>';
  const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>(AUG[k]?AUG[k].n:ITEMS[k]?ITEMS[k].name:k)+' '+v).join(', ')||'-';
  h+='<h3>Picks</h3><p class="fine">Augments owned by winners: '+top(A.augWin)+'</p><p class="fine">Shop buys W: '+top(A.buys[0])+'<br>Shop buys B: '+top(A.buys[1])+'</p>';
  return h;
}
function simBulk(n,lv){
  if(simRun)return;
  const rs=[],t0=Date.now(),cfg={lv:lv.slice(),n};
  const mode0=opts.mode,tf=toastFn;toastFn=()=>{};
  simRun={cancel:false};$('simBulk').disabled=true;$('simCopy').hidden=true;$('simOut').innerHTML='';
  const finish=()=>{
    toastFn=tf;opts.mode=mode0;simRun=null;$('simBulk').disabled=false;
    const A=simAgg(rs,cfg);A.seconds=Math.round((Date.now()-t0)/1000);
    $('simOut').innerHTML=simTable(A);$('simProg').textContent='Done in '+A.seconds+'s.';
    window.__simData={aggregate:A,games:rs};$('simCopy').hidden=false;
  };
  const nextGame=()=>{
    if(rs.length>=n){finish();return;}
    opts.mode='sim';opts.lv=lv.slice();newGame();simStepOnce.k=null;simStepOnce.n=0;
    const loop=()=>{
      const tEnd=performance.now()+35;
      while(performance.now()<tEnd){
        if(G.over||G.ply>=SIM_MAX||!simStepOnce()){rs.push(simSummary(lv));$('simProg').textContent='Game '+rs.length+' of '+n+' finished ('+G.ply+' moves)…';setTimeout(nextGame,0);return;}
      }
      $('simProg').textContent='Game '+(rs.length+1)+' of '+n+' · move '+G.ply+'…';
      setTimeout(loop,0);
    };
    loop();
  };
  nextGame();
}
function simSeg(id,fn){$(id).addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;fn(b.dataset.v);for(const x of $(id).children)x.setAttribute('aria-pressed',x===b?'true':'false');});}
opts.lv=['normal','normal'];opts.spd=1;
simSeg('segSimW',v=>{opts.lv[0]=v;});simSeg('segSimB',v=>{opts.lv[1]=v;});simSeg('segSimS',v=>{opts.spd=Number(v);});
$('simWatch').addEventListener('click',()=>uiGo(()=>start('sim')));
$('simBulk').addEventListener('click',()=>simBulk(Math.max(1,Math.min(100,parseInt($('simN').value)||10)),opts.lv));
$('simCopy').addEventListener('click',()=>{
  const txt=JSON.stringify(window.__simData);
  const done=()=>{$('simCopy').textContent='Copied';setTimeout(()=>{$('simCopy').textContent='Copy JSON';},1500);};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(done,()=>{$('simJson').hidden=false;$('simJson').value=txt;$('simJson').select();});
  else{$('simJson').hidden=false;$('simJson').value=txt;$('simJson').select();}
});
