/* ===== Custom mode: private online 1v1 rooms (host-authoritative relay) =====
   The room creator's browser runs the real game. Every render it pushes a snapshot through the relay
   server to everyone else. Guests never run game logic: they send intents (move, buy, pick...) and the
   host validates and applies them. Spectators just receive snapshots. */
const MP_DEFAULT_URL='wss://surgechess-rooms.onrender.com';
const MPS={on:false,ws:null,key:'',you:null,token:null,host:false,seat:-1,room:null,mid:null,curMid:null,
  lastSent:'',manualClose:false,pend:null,fading:false,recT:0,recN:0,pingT:0,pauseT:0,down:false,name:''};
const MP_LOCAL=['hist','sel','selMoves','promo','fm','overSeen','fallenOn','overDelay','overHidden','killcam','holdUntil','flip','thinking','aiBusy','paused'];
const mpSeat=()=>MPS.seat,mpIsHost=()=>MPS.host;
const mpRep=(k,v)=>v instanceof Set?{__set:[...v]}:v;
const mpRev=(k,v)=>v&&typeof v==='object'&&Array.isArray(v.__set)?new Set(v.__set):v;
function mpUrl(){const q=/[?&]mp=([^&]+)/.exec(location.search);return q?decodeURIComponent(q[1]):MP_DEFAULT_URL;}
const mpMember=id=>MPS.room&&MPS.room.members.find(m=>m.id===id);
function mpName(side){const r=MPS.room;if(!r)return SIDE[side];const m=mpMember(r.seats[side]);return m?m.name:SIDE[side];}
function mpTurnTxt(){
  const me=MPS.seat;
  if(me===G.turn)return 'Your move ('+SIDE[G.turn]+')';
  return mpName(G.turn)+' ('+SIDE[G.turn]+') to move';
}
const mpStore=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch(e){}return null;};

/* ---------- socket ---------- */
function mpSend(d){if(MPS.ws&&MPS.ws.readyState===1)MPS.ws.send(JSON.stringify({t:'intent',d}));}
function mpRaw(o){if(MPS.ws&&MPS.ws.readyState===1)MPS.ws.send(JSON.stringify(o));}
function mpConnect(first){
  return new Promise((res,rej)=>{
    mpCloseSock();MPS.manualClose=false;
    let ws;try{ws=new WebSocket(mpUrl());}catch(e){rej(new Error('bad url'));return;}
    MPS.ws=ws;let opened=false,done=false;
    const to=setTimeout(()=>{if(!opened){try{ws.close();}catch(e){}if(!done){done=true;rej(new Error('The server did not answer. It may be waking up, try again.'));}}},70000);
    ws.onopen=()=>{opened=true;clearTimeout(to);ws.send(JSON.stringify(first));clearInterval(MPS.pingT);MPS.pingT=setInterval(()=>mpRaw({t:'ping'}),20000);};
    ws.onmessage=e=>{
      let d;try{d=JSON.parse(e.data,mpRev);}catch(x){return;}
      if(ws!==MPS.ws)return;
      if(!done&&(d.t==='joined'||d.t==='err')){done=true;if(d.t==='err'){rej(Object.assign(new Error(d.msg||d.code),{code:d.code}));return;}MPS.on=true;mpOnMsg(d);res(d);return;}
      mpOnMsg(d);
    };
    ws.onclose=()=>{clearTimeout(to);if(!done){done=true;rej(new Error('Could not reach the server.'));}mpOnClose(ws);};
    ws.onerror=()=>{};
  });
}
function mpCloseSock(){clearInterval(MPS.pingT);const w=MPS.ws;MPS.ws=null;if(w){try{w.onclose=null;w.close();}catch(e){}}}
function mpReset(){
  MPS.on=false;MPS.key='';MPS.you=null;MPS.token=null;MPS.host=false;MPS.seat=-1;MPS.room=null;MPS.mid=null;MPS.curMid=null;MPS.lastSent='';MPS.pend=null;MPS.fading=false;MPS.down=false;
  clearTimeout(MPS.recT);clearInterval(MPS.pauseT);mpStore('surgeMp',null);
  $('mpPause').hidden=true;$('mpBar').hidden=true;
}
function mpLeave(){
  MPS.manualClose=true;mpRaw({t:'leave'});mpCloseSock();mpReset();
}
function mpOnClose(ws){
  if(ws!==MPS.ws)return;
  MPS.ws=null;clearInterval(MPS.pingT);
  if(MPS.manualClose||!MPS.on)return;
  MPS.down=true;MPS.recN=0;mpUi();mpRetry();
}
function mpRetry(){
  clearTimeout(MPS.recT);
  if(!MPS.on)return;
  MPS.recN++;
  if(MPS.recN>45){mpGone('Lost the connection to the room.');return;}
  mpConnect({t:'join',key:MPS.key,token:MPS.token,name:MPS.name}).then(d=>{MPS.down=false;mpUi();}).catch(e=>{
    if(e.code==='nokey'||e.code==='full'){mpGone('The room no longer exists.');return;}
    MPS.recT=setTimeout(mpRetry,2500);
  });
}
function mpGone(msg){
  const inGame=opts.mode==='mp'&&!$('game').hidden;
  mpCloseSock();mpReset();toastFn(msg,'r');mpNote('cuNote',msg);
  if(inGame)uiToMenu();else{mview('mvCustom');}
}

/* ---------- messages ---------- */
function mpOnMsg(d){
  switch(d.t){
    case 'joined':
      MPS.you=d.you;MPS.token=d.token;MPS.key=d.key;
      mpStore('surgeMp',JSON.stringify({key:d.key,token:d.token}));
      break;
    case 'room':{
      MPS.room=d;MPS.host=d.host===MPS.you;MPS.seat=d.seats.indexOf(MPS.you);
      if(d.status==='lobby'&&opts.mode==='mp'&&!$('game').hidden){mpToLobby();return;}
      mpLobbyRender();mpUi();break;
    }
    case 'start':mpOnStart(d.env);break;
    case 'snap':
      if(MPS.host){if(d.restore&&(!G||opts.mode!=='mp'))mpApply(d.d,true);}
      else mpApply(d.d);
      break;
    case 'resume':if(MPS.host){if((!G||opts.mode!=='mp')&&d.snap)mpApply(d.snap,true);else{MPS.lastSent='';mpBroadcast();}}break;
    case 'intent':if(MPS.host)mpIntent(d.seat,d.d);break;
    case 'forfeit':mpForfeit(d);break;
    case 'kicked':mpCloseSock();mpReset();toastFn('You were removed from the room.','r');if(opts.mode==='mp'&&!$('game').hidden)uiToMenu();else mview('mvPlay');break;
    case 'closed':if(MPS.on){mpGone('The host closed the room.');}break;
    case 'err':mpNote('lbNote',d.msg||d.code);toastFn(d.msg||d.code,'r');break;
  }
}
function mpForfeit(d){
  if(!G||opts.mode!=='mp'||G.over)return;
  G.over={type:'forfeit',winner:d.winner};G.overSeen=true;G.overDelay=0;
  render();
}

/* ---------- host: snapshot out ---------- */
function mpPack(){
  const g={};for(const k in G)if(!MP_LOCAL.includes(k))g[k]=G[k];
  return{mid:MPS.mid,g,eng:ENG,n:N};
}
function mpBroadcast(){
  if(!MPS.on||!MPS.host||opts.mode!=='mp'||!G||!MPS.ws||MPS.ws.readyState!==1||MPS.fading)return;
  const s=JSON.stringify({t:'snap',d:mpPack(),over:!!G.over},mpRep);
  if(s===MPS.lastSent)return;MPS.lastSent=s;MPS.ws.send(s);
}
/* ---------- guest/spectator: snapshot in ---------- */
function mpApply(s,asHost){
  if(MPS.fading){MPS.pend=s;return;}
  const fresh=s.mid!==MPS.curMid||!G||opts.mode!=='mp'||$('game').hidden;
  if(fresh){
    if(UIF.busy){setTimeout(()=>mpApply(s,asHost),300);return;}
    MPS.fading=true;MPS.pend=s;
    uiGo(()=>{MPS.fading=false;const p=MPS.pend;MPS.pend=null;if(p)mpApplyNow(p,true,asHost);});
    return;
  }
  mpApplyNow(s,false,asHost);
}
function mpApplyNow(s,fresh,asHost){
  const old=G,g=s.g;
  Object.assign(ENG,s.eng);if(s.n&&s.n!==N)setN(s.n);
  if(fresh){
    MPS.curMid=s.mid;MPS.mid=s.mid;opts.mode='mp';opts.human=MPS.seat>=0?MPS.seat:0;
    clearTimeout(aiTimer);
    g.hist=g.hist||[];g.sel=null;g.selMoves=[];g.promo=null;g.flip=MPS.seat===1;g.killcam=opts.killcam!==false;
    G=g;v3Reset();show('game');mpUi();after();showVs();uiGameStart();
    return;
  }
  for(const k of MP_LOCAL)if(old&&k in old)g[k]=old[k];
  G=g;
  if(G.sel!=null){
    const ms=G.legal.filter(m=>m.f===G.sel);
    if(G.turn===MPS.seat&&ms.length&&(G.bonus==null||G.bonus===G.sel))G.selMoves=ms;
    else{G.sel=null;G.selMoves=[];G.promo=null;}
  }
  mpUi();after();
}

/* ---------- host: intents in ---------- */
function mpIntent(seat,d){
  if(!G||G.over||opts.mode!=='mp'||!d||seat<0)return;
  switch(d.k){
    case 'play':{
      if(G.turn!==seat||G.draft||G.tgt||G.reward)return;
      const m=G.legal.find(x=>x.f===d.f&&x.t===d.t&&(x.fl||0)===(d.fl||0));if(!m)return;
      let mm=m;
      if(d.fm&&has(seat,'formation')&&G.bonus==null){const grp=formationGroup(m);if(grp.length)mm=Object.assign({},m,{grp});}
      commit(mm,m.pr&&'QMRBN'.includes(d.pr)?d.pr:'Q');return;
    }
    case 'sq':
      if(G.tgt){if(G.tgt.c!==seat)return;tgtClick(d.i);flow();return;}
      if(G.chute&&G.turn===seat){if(!doChute(d.i))G.chute=false;render();}
      return;
    case 'buy':if(G.turn!==seat||!ITEMS[d.b])return;buy(d.b);render();return;
    case 'aug':if(!G.draft||G.draft.side!==seat)return;sfx('pick');pickAug(d.a);flow();return;
    case 'abil':if(G.turn!==seat||typeof d.a!=='string')return;useAbility(d.a);flow();return;
    case 'tgtCancel':if(G.tgt&&G.tgt.c===seat){cancelTgt();flow();}return;
    case 'skip':if(G.turn===seat&&(G.bonus!=null||G.xt)){skipBonus();after();}return;
    case 'brOk':if(G.reward&&G.reward.side===seat){G.reward=null;render();}return;
  }
}

/* ---------- start / rematch / lobby transitions ---------- */
function mpOnStart(env){
  mpNote('lbNote','Starting…');
  if(!MPS.host)return;
  MPS.mid=Math.random().toString(36).slice(2,10);MPS.lastSent='';MPS.curMid=MPS.mid;
  opts.human=MPS.seat>=0?MPS.seat:0;opts.env=env==='random'?null:env;
  uiGo(()=>{start('mp');opts.env=null;mpUi();});
}
function mpRematch(){if(MPS.host)mpRaw({t:'lobby'});}
function mpToLobby(){
  uiFade(()=>{
    closeAllMods();clearTimeout(aiTimer);clearTimeout(vsTimer);$('vsOv').hidden=true;$('mpBar').hidden=true;$('mpPause').hidden=true;
    MPS.curMid=null;MPS.lastSent='';opts.mode='sim';show('menu');mview('mvLobby');bgStart();mpLobbyRender();
  });
}
function mpOverUi(){
  if(opts.mode!=='mp'){$('rematch').disabled=false;$('rematch').textContent='Play again';return;}
  $('rematch').textContent=MPS.host?'Back to lobby':'Waiting for host…';$('rematch').disabled=!MPS.host;
}

/* ---------- in-game bar + pause overlay ---------- */
function mpFmt(ms){const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function mpUi(){
  const bar=$('mpBar'),r=MPS.room,inGame=opts.mode==='mp'&&!$('game').hidden;
  if(!MPS.on||!r||!inGame){bar.hidden=true;$('mpPause').hidden=true;clearInterval(MPS.pauseT);return;}
  const spec=r.members.filter(m=>!r.seats.includes(m.id)).length,me=MPS.seat;
  bar.innerHTML=(me<0?'<b>Spectating</b>':'You: <b>'+SIDE[me]+'</b>')+' · '+mpName(0)+' vs '+mpName(1)+(spec?' · 👁 '+spec:'');
  bar.hidden=false;
  const ov=$('mpPause');
  clearInterval(MPS.pauseT);
  if(MPS.down){
    $('mpPT').textContent='Connection lost';$('mpPD').textContent='Reconnecting to the room…';ov.hidden=false;
  }else if(r.pause&&r.status==='playing'){
    const pm=mpMember(r.pause.id),nm=pm?pm.name:'A player',tick=()=>{
      $('mpPT').textContent='Game paused';
      $('mpPD').textContent=nm+' disconnected. Waiting for them to rejoin with the key '+MPS.key+'. They forfeit in '+mpFmt(r.pause.until-Date.now())+'.';
    };
    tick();MPS.pauseT=setInterval(tick,500);ov.hidden=false;
  }else ov.hidden=true;
}
$('mpPLeave').addEventListener('click',()=>{$('mpPause').hidden=true;mpLeave();uiToMenu();});

/* ---------- menu: create / join / lobby ---------- */
function mpNote(id,msg){const e=$(id);if(e)e.textContent=msg||'';}
function mpName0(){const v=$('cuName').value.trim();mpStore('surgeName',v||null);return v;}
function mpValidKey(k){return /^[A-Za-z0-9]{6}$/.test(k);}
function mpBusy(on){for(const id of['cuCreate','cuJoin','cuRejoin'])$(id).disabled=on;}
function mpEnter(d){
  MPS.name=mpName0();mpBusy(false);mpNote('cuNote','');
  mview('mvLobby');mpLobbyRender();
}
function mpCreate(){
  mpBusy(true);mpNote('cuNote','Connecting… the free server can take ~30s to wake up.');
  MPS.name=mpName0();
  mpConnect({t:'create',name:MPS.name}).then(mpEnter).catch(e=>{mpBusy(false);mpNote('cuNote',e.message);});
}
function mpJoin(key,token){
  if(!mpValidKey(key)){mpNote('cuNote','Keys are 6 letters/numbers (case matters).');return;}
  mpBusy(true);mpNote('cuNote','Connecting… the free server can take ~30s to wake up.');
  MPS.name=mpName0();
  mpConnect({t:'join',key,token,name:MPS.name}).then(mpEnter).catch(e=>{mpBusy(false);mpNote('cuNote',e.message);});
}
function mpCopy(txt,btn){
  const done=()=>{const o=btn.textContent;btn.textContent='Copied';setTimeout(()=>{btn.textContent=o;},1400);};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done).catch(()=>fb());}else fb();
  function fb(){const t=document.createElement('textarea');t.value=txt;t.style.cssText='position:fixed;opacity:0';document.body.appendChild(t);t.select();try{document.execCommand('copy');done();}catch(e){}t.remove();}
}
const ENV_NAME={random:'Random',volcano:'Volcano',sky:'Sky Island',rain:'Rainforest'};
function mpLobbyRender(){
  const r=MPS.room;if(!r||$('mvLobby').hidden)return;
  $('lbKey').textContent=r.key;
  const me=MPS.you,host=MPS.host,lobby=r.status==='lobby';
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  for(const s of[0,1]){
    const id=r.seats[s],m=id&&mpMember(id),el=$('seat'+s);
    el.className='seat'+(id===me?' me':'')+(m&&!m.online?' off':'');
    let h='<span class="sd">'+SIDE[s]+'</span>';
    if(m){
      h+='<span class="sn">'+esc(m.name)+(id===r.host?'<i>HOST</i>':'')+(id===me?'<i>YOU</i>':'')+(m.online?'':'<i>OFFLINE</i>')+'</span>';
      if(lobby&&id===me)h+='<button type="button" class="btn" data-seat="-1">Stand up</button>';
      else if(lobby&&host&&id!==me)h+='<button type="button" class="btn" data-kick="'+id+'">Kick</button>';
    }else{
      h+='<span class="sn" style="opacity:.55">Open</span>';
      h+=lobby?'<button type="button" class="btn" data-seat="'+s+'">Take '+SIDE[s]+'</button>':'';
    }
    el.innerHTML=h;
  }
  const specs=r.members.filter(m=>!r.seats.includes(m.id));
  $('lbSpecN').textContent=specs.length+'/'+r.max;
  $('lbSpec').innerHTML=specs.length?specs.map(m=>'<li><span>'+esc(m.name)+(m.id===r.host?' <i style="font-style:normal;color:#ffd45e;font-size:11px">HOST</i>':'')+(m.id===me?' <i style="font-style:normal;color:#ffd45e;font-size:11px">YOU</i>':'')+(m.online?'':' (offline)')+'</span>'+(host&&m.id!==me&&lobby?'<button type="button" class="btn" data-kick="'+m.id+'">Kick</button>':'')+'</li>').join(''):'<li class="none">Nobody watching yet</li>';
  $('lbEnvRow').hidden=false;
  $('lbEnvV').textContent=ENV_NAME[r.env]||'';
  for(const b of $('lbEnv').children){b.setAttribute('aria-pressed',b.dataset.v===r.env?'true':'false');b.disabled=!host||!lobby;}
  const both=r.seats[0]!=null&&r.seats[1]!=null;
  const st=$('lbStart');st.hidden=!host;st.disabled=!(lobby&&both);
  st.firstChild.textContent=lobby?'Start match':'Match running';
  $('lbNote').textContent=!lobby?(r.status==='playing'?'A match is in progress…':'Waiting for the host to go back to the lobby…'):host?(both?'Both seats filled. Start when ready.':'Fill both seats to start. Join the white or black slot, or wait for someone to take it.'):(both?'Waiting for the host to start…':'Take a seat, or stay as a spectator.');
}
function mpInit(){
  const nm=mpStore('surgeName');if(nm)$('cuName').value=nm;
  $('cuCreate').addEventListener('click',mpCreate);
  $('cuJoin').addEventListener('click',()=>mpJoin($('cuKey').value.trim()));
  $('cuKey').addEventListener('keydown',e=>{if(e.key==='Enter')mpJoin($('cuKey').value.trim());e.stopPropagation();});
  $('cuName').addEventListener('keydown',e=>e.stopPropagation());
  $('cuRejoin').addEventListener('click',()=>{try{const s=JSON.parse(mpStore('surgeMp'));mpJoin(s.key,s.token);}catch(e){}});
  $('lbCopy').addEventListener('click',()=>mpCopy(MPS.key,$('lbCopy')));
  $('lbLink').addEventListener('click',()=>mpCopy(location.origin+location.pathname+'?room='+MPS.key,$('lbLink')));
  $('lbLeave').addEventListener('click',()=>{mpLeave();mview('mvPlay');sfx('uiback');});
  $('lbStart').addEventListener('click',()=>mpRaw({t:'start'}));
  $('lbEnv').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&MPS.host)mpRaw({t:'set',env:b.dataset.v});});
  $('mvLobby').addEventListener('click',e=>{
    const s=e.target.closest('[data-seat]');if(s){mpRaw({t:'seat',s:Number(s.dataset.seat)});return;}
    const k=e.target.closest('[data-kick]');if(k)mpRaw({t:'kick',id:k.dataset.kick});
  });
  /* show "rejoin" if this tab still holds a room token; prefill key from ?room= links */
  const q=/[?&]room=([A-Za-z0-9]{6})/.exec(location.search);
  const saved=(()=>{try{return JSON.parse(mpStore('surgeMp'));}catch(e){return null;}})();
  if(saved&&saved.key){$('cuRejoin').hidden=false;$('cuRejoin').firstChild.textContent='Rejoin '+saved.key;}
  if(q){$('cuKey').value=q[1];setTimeout(()=>{if(!$('menu').hidden){mview('mvCustom');mpNote('cuNote','Press Join room to enter '+q[1]+'.');}},50);}
}
mpInit();
