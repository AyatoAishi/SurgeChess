/* ===== Admin mode (vs AI only): double-tap the Augments key to open ===== */
const ADM={el:null,buff:null,last:0};
const ADM_BUFFS=[['rap','⚔️ Wrath Blade',{rap:true}],['aura','✨ Divine judgement',{aura:true}],['bty','💰 Bounty (+100g)',{bty:true}],['inv','👁 Invisible',{inv:6}],['zh','⏳ Frozen Moment',{zh:4}],['rez','✝️ Resurrect mark',{rez:true}],['lk','🔮 Queen’s Veil',{lk:true}],['clear','🧼 Remove buffs',null]];
const adminOpen=()=>!!(ADM.el&&!ADM.el.hidden);
function adminEnsure(){
  if(ADM.el)return ADM.el;
  const st=document.createElement('style');
  st.textContent='#adminP{position:fixed;right:12px;top:64px;width:300px;max-height:calc(100vh - 100px);overflow:auto;z-index:70;background:rgba(14,18,30,.94);border:1px solid #6b5a2e;border-radius:14px;padding:12px;color:#eee;font:13px/1.35 var(--fb,system-ui);box-shadow:0 10px 40px rgba(0,0,0,.6)}#adminP[hidden]{display:none}#adminP h3{margin:0 0 6px;font-size:15px;color:#ffd45e;display:flex;justify-content:space-between;align-items:center}#adminP h4{margin:12px 0 5px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#9fb0d0}#adminP .row{display:flex;flex-wrap:wrap;gap:5px}#adminP button,#adminP select{background:#1f2740;color:#eee;border:1px solid #3a4568;border-radius:8px;padding:5px 8px;font:inherit;cursor:pointer}#adminP button:hover{background:#2c3860}#adminP button.on{background:#7a5a10;border-color:#ffd45e}#adminP .lv button{min-width:26px;padding:4px 0;text-align:center}#adminP .note{font-size:11px;color:#9fb0d0;margin-top:4px}#adminBadge{position:fixed;left:12px;top:100px;z-index:60;background:#7a1f1f;color:#fff;border-radius:8px;padding:3px 8px;font:700 11px system-ui;letter-spacing:.1em;pointer-events:none}@media(max-width:700px){#adminP{left:8px;right:8px;width:auto;top:56px}}';
  document.head.appendChild(st);
  const el=document.createElement('div');el.id='adminP';el.hidden=true;document.body.appendChild(el);ADM.el=el;
  el.addEventListener('click',adminClick);
  return el;
}
function adminMe(){return opts.human;}
function adminRender(){
  const el=adminEnsure(),me=adminMe(),ai=1-me,lv=lvNum(lvlOf(ai));
  el.innerHTML='<h3>Admin mode <button type="button" data-a="close">✕</button></h3>'
  +'<h4>AI difficulty (live)</h4><div class="row lv">'+[1,2,3,4,5,6,7,8,9,10].map(n=>'<button type="button" data-a="lv" data-n="'+n+'"'+(n===lv?' class="on"':'')+'>'+n+'</button>').join('')+'</div>'
  +'<h4>Gold</h4><div class="row"><span style="width:100%">You '+G.gold[me]+'g · AI '+G.gold[ai]+'g</span>'
  +[100,500,2000].map(n=>'<button type="button" data-a="gold" data-s="me" data-n="'+n+'">You +'+n+'</button>').join('')
  +[500,2000].map(n=>'<button type="button" data-a="gold" data-s="ai" data-n="'+n+'">AI +'+n+'</button>').join('')
  +'<button type="button" data-a="gold" data-s="ai" data-n="-9999">AI → 0</button></div>'
  +'<h4>Augments</h4><div class="row"><select id="admAug">'+Object.keys(AUG).map(k=>'<option value="'+k+'">'+AUG[k].i+' '+AUG[k].n+'</option>').join('')+'</select><button type="button" data-a="aug" data-s="me">Give me</button><button type="button" data-a="aug" data-s="ai">Give AI</button></div>'
  +'<h4>Inventory &amp; shop</h4><div class="row"><button type="button" data-a="inv" data-k="turret">+Turret</button><button type="button" data-a="inv" data-k="archer">+Archer</button><button type="button" data-a="inv" data-k="ram">+Ram</button><button type="button" data-a="inv" data-k="polarity">+Polarity</button><button type="button" data-a="cd">Clear cooldowns</button></div>'
  +'<h4>Spawn boss</h4><div class="row"><button type="button" data-a="boss" data-k="V">Vanguard</button><button type="button" data-a="boss" data-k="D">Dragon</button><button type="button" data-a="boss" data-k="K">Kraken</button></div>'
  +'<h4>Unit buffs — pick one, then click a unit</h4><div class="row">'+ADM_BUFFS.map(b=>'<button type="button" data-a="buff" data-k="'+b[0]+'"'+(ADM.buff===b[0]?' class="on"':'')+'>'+b[1]+'</button>').join('')+'</div>'
  +'<h4>Transform a unit — pick, then click</h4><div class="row">'+['P','N','B','R','Q','M','A'].map(t=>'<button type="button" data-a="buff" data-k="T'+t+'"'+(ADM.buff==='T'+t?' class="on"':'')+'>'+NAMES[t]+'</button>').join('')+'<button type="button" data-a="buff" data-k="DEL"'+(ADM.buff==='DEL'?' class="on"':'')+'>🗑 Delete</button></div>'
  +'<p class="note">'+(ADM.buff?'Click a unit on the board to apply. Press the same button again to stop.':'Double-tap A (or the Augments button) to open this panel. Esc closes it.')+'</p>';
}
function adminShow(on){
  const el=adminEnsure();
  if(on&&!(opts.mode==='ai'&&G&&!G.over))return;
  if(on){G.admin=true;adminRender();el.hidden=false;adminBadge(true);}
  else{el.hidden=true;ADM.buff=null;}
}
function adminBadge(on){let b=document.getElementById('adminBadge');if(on&&!b){b=document.createElement('div');b.id='adminBadge';b.textContent='ADMIN';document.body.appendChild(b);}if(!on&&b)b.remove();}
function adminClick(e){
  const b=e.target.closest('button[data-a]');if(!b||!G)return;
  const a=b.dataset.a,me=adminMe(),ai=1-me,side=b.dataset.s==='ai'?ai:me;
  if(a==='close'){adminShow(false);return;}
  if(a==='lv'){opts.level=Number(b.dataset.n);}
  else if(a==='gold'){G.gold[side]=Math.max(0,G.gold[side]+Number(b.dataset.n));}
  else if(a==='aug'){const k=$('admAug').value;if(!G.aug[side].includes(k)){grant(side,k);event('y','Admin: '+SIDE[side]+' gains '+AUG[k].n);}else toastFn('Already owned.','n');}
  else if(a==='inv'){G.inv[me][b.dataset.k]++;}
  else if(a==='cd'){G.cd=[{},{}];}
  else if(a==='boss'){if(G.boss.on){toastFn('A boss is already out.','n');}else{G.boss.done=true;spawnBoss(b.dataset.k);}}
  else if(a==='buff'){ADM.buff=ADM.buff===b.dataset.k?null:b.dataset.k;}
  refreshLegal();render();adminRender();
}
/* returns true when the click was consumed */
function adminSquare(i){
  if(!ADM.buff||!adminOpen()||!G)return false;
  const p=G.b[i];if(!p||p.c>1||p.t==='X'||p.t==='Z'||p.t==='W'&&ADM.buff[0]==='T'){toastFn('Click one of the units on the board.','n');return true;}
  const k=ADM.buff;let np;
  if(k==='DEL'){if(p.t==='K'){toastFn('Not deleting a king.','n');return true;}G.b[i]=null;G.fx.push({k:'burn',sq:i});}
  else if(k[0]==='T'&&k.length===2){if(p.t==='K'||p.t==='W'){toastFn('Pick a regular unit.','n');return true;}G.b[i]=Object.assign({},p,{t:k[1],cs:false});G.freshP.add(i);}
  else if(k==='clear'){G.b[i]=stripped(p);}
  else{const bf=ADM_BUFFS.find(x=>x[0]===k);G.b[i]=Object.assign({},p,bf[2]);if(k==='aura')G.fx.push({k:'charge',sq:i});}
  G.last=G.last;refreshLegal();render();adminRender();return true;
}
function adminKeyAug(){
  if(opts.mode!=='ai'||!G||G.over||G.bg)return false;
  const now=performance.now(),dbl=now-ADM.last<600;ADM.last=now;
  if(dbl){ADM.last=0;togglePanel('aug',false);adminShow(!adminOpen());return true;}
  return false;
}
