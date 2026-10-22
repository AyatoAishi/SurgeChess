/* ===== Game state, orbs, turn flow ===== */
const ORB_MIN=5,ORB_MAX=10;   // an orb drops after a random 5-10 completed turns (both players combined)
const MAX_ORBS=4;             // newest orb replaces the oldest when the board is full
const SIDE=['White','Black'];
const PW={
  y:{name:'Divine judgement',d:'The piece gets a golden charge. If it is captured, it returns once on a random free square on its own half of the board.'},
  r:{name:'Chain move',d:'The same piece moves again right away. You can skip the bonus move.'},
  b:{name:'Bounty rune',d:'The piece that takes it claims 100 gold on the spot.'},
  t:{name:'Turret',d:'A turret goes into your inventory. Place it on a free tile next to any of your pieces. It never moves. After each of your turns it has a 25% chance to shoot an enemy in its 5×5 box (pawns first, never kings) and dismantles after 3 shots. Killing it pays the enemy 200 gold.'},
  i:{name:'Invisibility',d:'For 5 of its own turns the piece cannot be captured, units slide through it and it cannot give check. Capturing breaks the invisibility.'},
  m:{name:'Gold mine',d:'A mine on the tile, not a pickup. Whoever has a unit standing on it earns 10 gold at the start of each of their turns. Each round it has a 5% chance to run dry.'},
  g:{name:'Lancer',d:'A lancer copy of the piece appears on a random free square next to it, or on the nearest free square.'}
};
const ICON={
  y:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" fill="currentColor"/></svg>',
  r:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5l8 7-8 7zM12 5l8 7-8 7z" fill="currentColor"/></svg>',
  m:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19l5-9 4 5 3-6 6 10z" fill="currentColor"/><circle cx="17" cy="6" r="2.4" fill="currentColor"/></svg>',
  g:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" fill="currentColor"/></svg>',
  b:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 7v10M9.500 9.500c0-1.200 1-1.800 2.500-1.800s2.500.7 2.500 1.800-1 1.500-2.500 1.900-2.500.8-2.500 2 1 1.900 2.500 1.900 2.500-.7 2.500-1.900" stroke="currentColor" stroke-width="1.600" fill="none"/></svg>',
  t:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="15" width="14" height="5" rx="1" fill="currentColor"/><circle cx="11" cy="12" r="4" fill="currentColor"/><rect x="12" y="10.500" width="9" height="3" rx="1" fill="currentColor"/></svg>',
  i:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.200" fill="currentColor"/></svg>'
};
const TIER={s:'Silver',g:'Gold',p:'Prismatic'};
const AUG={
  terrain:{n:'Terrain',t:'s',i:'🪨',d:'6 immovable rocks appear in the center of the board. Sliding pieces are blocked by them; knights, marshals and cardinals jump over.'},
  rez:{n:'Resurrect',t:'p',i:'✝️',d:'One of your random pieces is marked. If it is slain, it returns on the same square 2 of your turns later, killing whatever stands there.'},
  ultra:{n:'Overdrive',t:'s',i:'⚡',d:'Each of your moves has a 20% chance to become a chain move.'},
  deploy:{n:'Deploy Pawn',t:'g',i:'🪖',d:'Choose a spot on your half: 5 pawns appear in a plus shape (empty squares only).'},
  charged:{n:'Charged Pawns',t:'s',i:'⏫',d:'Your pawns can always move 1 or 2 squares forward, not only on their first move.'},
  cav:{n:'Cavalry',t:'g',i:'🐎',d:'After a knight captures, it may move again, but not to capture. Click the knight to decline.'},
  midas:{n:'Golden Touch',t:'s',i:'💰',d:'+40 gold now, then +3 extra gold at the start of each of your turns.'},
  bounty:{n:'Blood Money',t:'s',i:'🎯',d:'Your kills pay 50% more gold.'},
  cheap:{n:'Haggler',t:'s',i:'🏷️',d:'Shop items cost 30% less for you.'},
  blink:{n:'Phase Step',t:'g',i:'🗡️',act:1,d:'Once, free action: teleport any non-king piece to an empty square within 3 tiles.'},
  rapier:{n:'Wrath Blade',t:'g',i:'⚔️',d:'One random piece gets a bonus move after each capture. If it dies, the enemy gets 100 gold.'},
  meteor:{n:'Falling Star',t:'g',i:'☄️',act:1,d:'Once: target a 3×3 area on the enemy half. It lands after 2 of your turns and destroys every non-king piece inside.'},
  mines:{n:'Minefield',t:'g',i:'💣',d:'3 visible mines are planted in the middle ranks. The first enemy non-king piece to land on one is destroyed.'},
  frost:{n:'Winter’s Grasp',t:'g',i:'❄️',act:1,d:'Once: freeze every enemy non-king piece in a 3×3 area for 2 of their turns.'},
  zhonya:{n:"Frozen Moment",t:'g',i:'⏳',act:1,d:'Once: one of your pieces cannot move or be captured for 2 of your turns.'},
  linken:{n:"Queen’s Veil",t:'s',i:'🔮',d:'The first capture against your queen is blocked, and the attacker bounces back.'},
  steal:{n:'Mirror Mind',t:'p',i:'🧙',d:'Also copy a random augment your opponent already owns.'},
  fury:{n:'Reaper’s Cleave',t:'s',i:'🪓',d:'When your pawn captures, it also destroys one enemy pawn next to the victim.'},
  chrono:{n:'Rewind',t:'p',i:'⏪',act:1,d:'Once: undo the last full round. The enemy cannot repeat the move you undid.'},
  wall:{n:'Castle Wall',t:'g',i:'🧱',act:1,d:'Once: build a horizontal wall of up to 3 blocks on empty tiles. Walls are permanent. Sliders and horse jumps cannot pass through them.'},
  zone:{n:'Safe Zone',t:'p',i:'🔥',d:'In 30 turns the two side columns (a and j) ignite for good. Units on them burn, anything stepping on them dies, and kings are knocked inside. Promotion rows stay safe.'},
  portal:{n:'Twin Gates',t:'g',i:'🌀',d:'Two gates open on random empty tiles. A piece that steps on one comes out of the other. An enemy there is captured, an ally swaps places with you. Step off and back on to use it again.'},
  formation:{n:'Formation',t:'g',i:'🛡️',d:'When a pawn steps straight ahead you may march in formation: every friendly pawn touching it also steps one tile forward, if its way is clear. Formation moves never capture.'},
  polarity:{n:'Polarity',t:'g',i:'🧲',d:'Gives you 3 charges. Free action: pick one unit, then another, and they swap places. A swap that would leave you checkmated is refused.'},
  qm:{n:'Quartermaster',t:'s',i:'📦',d:'Shop item cooldowns are 40% shorter for you.'},
  plunder:{n:'Plunder',t:'p',i:'🏴‍☠️',d:'Every time you kill a piece, all your shop cooldowns drop by 4 turns.'},
  twin:{n:'Double Time',t:'p',i:'⏩',d:'After your move (and any chain moves) you may make one more move with a different piece. It cannot proc Overdrive or chains, and you cannot shop during it. Skip it any time.'},
  aghs:{n:"Sovereign’s Reach",t:'g',i:'🔱',d:'Your rooks and bishops can also step 1 square in any direction, like a king.'}
};
const AUG_EVERY=20;
const GOLD={W:150,A:35,T:200,P:10,N:25,B:25,R:40,M:50,C:45,Q:80,H:15,K:0};
const ABIL_NAMES={};
const ITEMS={
  rz:{short:'Reveal every square the enemy can hit for 20 turns',name:'Red zone',cost:80,d:'Highlights every square the enemy can move to or capture on. Lasts 20 turns, counting both sides.'},
  ch:{short:'Teleport your king to a safe square on your side',name:'Parachute',cost:190,d:'Teleport your king to any safe empty square on your half of the board. Does not cost your turn.'},
  hc:{short:'Summon a 5×5 champion beside your king for 5 turns',name:'Summon champion',cost:400,d:'A champion appears next to your king. It moves anywhere in a 5×5 box around it, can never capture or checkmate a king, and vanishes after 5 of your turns. If an enemy slays it, they get a knight.'},
  ms:{short:'5 missiles blast random enemies in the middle ranks',name:'Missile frags',cost:95,d:'5 missiles hit random squares in the four middle ranks. Enemy pieces there are destroyed (not kings). Your own pieces are never hit.'},
  sq:{short:'Spawn a queen on a free corner of your half',name:'Spawn queen',cost:480,d:'A queen appears on a random corner of your half of the board (or beside it when the corner is taken or burning).'},
  fo:{short:'Home rank tiles become safe for 4 turns',name:'Fortification',cost:480,d:'The tiles of your home rank become invulnerable for 4 turns. Any enemy unit that attacks a piece standing there is destroyed instead. Only protects the tiles, not pieces that leave them.'},
  as:{short:'Rebuild your whole army from scratch',name:'Ascend',cost:1760,d:'Removes all your units, then restores 10 pawns and 10 major pieces on your home ranks, kings and all. Always 20 units, however big the arena is. Enemy units in the way are pushed aside. Inside a Safe Zone the army forms up between the side columns.'},
  dk:{short:'Spawn a second king for you',name:'Double king',cost:2080,d:'A second king appears next to your first. While you have two kings you are never in check, and the enemy can capture a king. Lose one and normal check rules return.'},
  sn:{short:'Swap sides: your army becomes theirs',name:'Sunder',cost:2080,d:'Every unit you own goes to the enemy and every enemy unit becomes yours. Buffs stay with the pieces. They keep their colours, a ring on the tile shows the new owner.'},
  ar:{short:'An archer goes to your inventory, deploy behind a pawn',name:'Archer',cost:260,d:'An archer goes into your inventory. Place it on an empty tile directly behind one of your pawns. It steps 1 tile in a plus direction and shoots up to 4 tiles along a plus line without leaving its tile. Any unit, wall, rock or boss in the way blocks the shot.'},
  rm:{short:'Auto-marching ram, 3 HP, crushes what it hits',name:'Battering Ram',cost:500,d:'A battering ram goes into your inventory. Deploy it on a free tile of your home rank. You cannot control it: after each of your turns it has a 50% chance to advance 1 tile. It crushes enemy units and breaks walls and rocks, losing 1 HP for each (3 HP). It swaps places with friendly units in its way (not kings) and bumps into kings, frozen or invisible units without moving. A boss makes it lose 1 HP and counts as a sacrifice for you. It breaks apart when it reaches the far end. Enemy attacks deal 1 HP and do not move the attacker.'},
  bw:{short:'Fill your pawn rank with pawns',name:'Bulwark',cost:190,d:'Fills every empty square of your pawn rank with a pawn.'}
};
const CD={rz:6,bw:60,ch:10,ar:11,hc:12,fo:14,sq:16,ms:20,rm:30,as:40,dk:55,sn:65};
const cdOf=(c,k)=>{const b=CD[k]||0;return has(c,'qm')?Math.ceil(b*.6):b;};
const opts={mode:'pvp',human:0,level:'normal',lv:['normal','normal'],spd:1};
let G=null,toastFn=()=>{};

const stOf=()=>({b:G.b,ep:G.ep,turn:G.turn,ply:G.ply});
const fireOn=()=>!!(G&&G.fire&&G.fire.on);
const onFire=i=>(fireOn()&&isEdgeSq(i))||!!(G.cr&&G.cr.includes(i))||!!(G.df&&G.df.some(x=>x.sq===i));
const BOSS_MAX={V:5,D:7,K:6},BOSS_NAME={V:'Vanguard',D:'Dragon',K:'Kraken'};
const ENVS=['volcano','sky','rain'];
const safeRow=r=>r===homeRow(0)||r===pawnRow(0)||r===homeRow(1)||r===pawnRow(1);
const isAI=c=>opts.mode==='sim'||(opts.mode==='ai'&&c!==opts.human);
const locked=c=>isAI(c)||(opts.mode==='mp'&&mpSeat()!==c);   // true when the local player may not act for side c
const MPG=()=>opts.mode==='mp'&&!mpIsHost();                  // online guest: forwards actions to the host instead of running them
const lvlOf=c=>G&&G.bg?G.bgLv[c]:opts.mode==='sim'?opts.lv[c]:opts.level;

function newStats(){return{k:[{},{}],d:[{},{}],cl:[{},{}],orbs:[{},{}],buys:[{},{}],gold:[0,0],sac:[0,0],gm:[0,0],str:[0,0],ft:[0,0],contest:[0,0],slam:0,tp:null,lead:0,mateBy:null};}
const matOf=c=>{let s=0;for(const p of G.b)if(p&&p.c===c&&p.t!=='K')s+=VAL[p.t]||0;return s;};
const bump=(o,k)=>{o[k]=(o[k]||0)+1;};
function newGame(){
  setN(10);
  G={b:newBoard(),pw:Array(N*N).fill(null),gold:[5,0],aug:[[],[]],used:[{},{}],draft:null,draftQ:[],fire:null,portals:null,inv:[{turret:0,polarity:0,archer:0,ram:0},{turret:0,polarity:0,archer:0,ram:0}],mv:[],xu:false,xt:false,cd:[{},{}],boss:{on:false,done:false,sq:-1,hits:[0,0],kind:null,max:5,nextAt:80,act:0},df:[],baby:[],babyQ:[],fort:[0,0],gm:[],orbMem:0,stats:newStats(),killer:null,streak:[0,0],burn:[null,null],fb:false,tgt:null,rezQ:[],meteors:[],mines:[],hist:[],ban:null,env:(opts.env&&ENVS.includes(opts.env))?opts.env:(/[?&]env=(\w+)/.exec(location.search)||[])[1]&&ENVS.includes((/[?&]env=(\w+)/.exec(location.search)||[])[1])?(/[?&]env=(\w+)/.exec(location.search)||[])[1]:ENVS[rnd(ENVS.length)],cr:[],pd:[],bonusNoCap:false,rz:[0,0],chute:false,orbSeq:Array(N*N).fill(0),orbN:0,nextOrb:ORB_MIN+rnd(ORB_MAX-ORB_MIN+1),ep:null,turn:0,ply:0,bonus:null,over:null,overHidden:false,
     last:null,sel:null,selMoves:[],promo:null,fx:[],overFx:false,freshP:new Set(),freshO:new Set(),log:[],legal:[],thinking:false,
     flip:(opts.mode==='ai'||opts.mode==='mp')&&opts.human===1};
  ENG.cp=[false,false];ENG.ag=[false,false];ENG.ply=0;ENG.fire=false;
  refreshLegal();
}
const OPEN_FORT=0;
function syncFort(){for(let i=0;i<N*N;i++){const p=G.b[i];if(!p||p.c>1)continue;const on=(G.fort[p.c]>0||G.ply<OPEN_FORT)&&rowOf(i)===homeRow(p.c)&&colOf(i)>=OFF()&&colOf(i)<=9+OFF();if(!!p.ft!==on)p.ft=on;}}
const bossCells=a=>[a,a+1,a+N,a+N+1];
const bossFree=(a,own)=>bossCells(a).every(s=>{const p=G.b[s];return !p||p.t==='X'||(own&&p.t==='Z');});
function bossPut(a){for(const s of bossCells(a)){const u=G.b[s];G.b[s]={id:uid++,t:'Z',c:2,boss:1,under:u&&u.t==='X'?u:null};}}
function bossClear(a){for(const s of bossCells(a)){const p=G.b[s];if(p&&p.t==='Z')G.b[s]=p.under||null;}}
function spawnBoss(forced){
  const kind=forced||pick(['V','D','K']);let a=-1;
  if(kind==='K')a=(HALF()-1)*N+HALF()-1;
  else{const cand=[];for(let r=HALF()-2;r<=HALF();r++)for(let c=0;c<=N-2;c++){const x=r*N+c;if(bossFree(x,false)&&!bossCells(x).some(onFire))cand.push(x);}
    if(!cand.length)return false;a=pick(cand);}
  const ev=[];for(const q of bossCells(a)){const p=G.b[q];if(p&&p.t!=='X'){ev.push(p);G.b[q]=null;}G.pw[q]=null;}
  bossPut(a);for(const p of ev){const ns=cloneSpot(a,p);if(ns>=0){G.b[ns]=p;G.freshP.add(ns);}}
  const B=G.boss;B.on=true;B.done=true;B.sq=a;B.kind=kind;B.max=BOSS_MAX[kind];B.hits=[0,0];B.act=G.ply+10+rnd(11);
  G.fx.push({k:'bossup',sq:a,kind});
  event('r',kind==='V'?'The Vanguard has appeared in the middle! Hit it 5 times to claim 3 augments.':kind==='D'?'A Dragon has appeared! Hit it 7 times to slay it and summon a baby dragon.':'The Kraken rises from the center! Hit it 6 times to claim 1500 gold.');
  return true;
}
function moveBoss(){
  const B=G.boss,a=B.sq,dd=pick([[-1,0],[1,0],[0,-1],[0,1]]),r=rowOf(a)+dd[0],c=colOf(a)+dd[1];
  if(r<0||r>N-2||c<0||c>N-2)return;
  const na=r*N+c,mine=new Set(bossCells(a));
  if(!bossCells(na).every(s=>{if(mine.has(s))return true;const p=G.b[s];return !p||p.t==='X';}))return;
  bossClear(a);bossPut(na);B.sq=na;G.fx.push({k:'bossmove',sq:a,to:na});
}
function bossRing(a){
  const r0=rowOf(a),c0=colOf(a),out=[];
  for(let r=r0-1;r<=r0+2;r++)for(let c=c0-1;c<=c0+2;c++){
    if(r<0||r>=N||c<0||c>=N)continue;
    if(r>=r0&&r<=r0+1&&c>=c0&&c<=c0+1)continue;
    const p=G.b[r*N+c];if(p&&p.c<2)out.push(r*N+c);
  }
  return out;
}
function bossSlam(){
  const a=G.boss.sq,ring=bossRing(a);let n=0;
  for(const s of ring){
    const p=G.b[s];if(!p)continue;
    const a0r=rowOf(a),a0c=colOf(a);let r=rowOf(s),c=colOf(s);
    const ry=r<a0r?-1:r>a0r+1?1:0,rx=c<a0c?-1:c>a0c+1?1:0;
    let to=s;
    for(let st=0;st<2;st++){
      const nr=r+ry,nc=c+rx;if(nr<0||nr>=N||nc<0||nc>=N)break;
      const t=nr*N+nc;if(G.b[t]||onFire(t))break;
      r=nr;c=nc;to=t;
    }
    if(to!==s){G.b[to]=p;G.b[s]=null;n++;}
  }
  G.stats.slam++;G.fx.push({k:'bossslam',sq:a,n});
  event('r','The boss slams the ground'+(n?' and knocks '+n+' unit'+(n===1?'':'s')+' away':''));
}
function bossTick(){
  const B=G.boss;
  G.df=G.df.filter(x=>{if(x.until>G.ply)return true;G.fx.push({k:'dfireGone',sq:x.sq});return false;});
  if(!B.on){if(G.ply>=B.nextAt)spawnBoss();return;}
  if(B.kind==='V'){if(G.turn===0){const ch=.05+.03*bossRing(B.sq).length;if(Math.random()<ch)bossSlam();else moveBoss();}}
  else if(B.kind==='D'){if(G.turn===0)dragonFly();}
  else if(G.ply>=B.act){B.act=G.ply+10+rnd(11);krakenAttack();}
}
const bossRingAll=a=>{const r0=rowOf(a),c0=colOf(a),o=[];for(let r=r0-1;r<=r0+2;r++)for(let c=c0-1;c<=c0+2;c++){if(r<0||r>=N||c<0||c>=N)continue;if(r>=r0&&r<=r0+1&&c>=c0&&c<=c0+1)continue;o.push(r*N+c);}return o;};
function tossPiece(m){
  const B=G.boss,a0r=rowOf(B.sq)+.5,a0c=colOf(B.sq)+.5,r0=rowOf(m.t),c0=colOf(m.t),dr=r0>a0r?1:-1,dc=c0>a0c?1:-1,steps=1+rnd(5);
  let last=-1;
  for(let k=1;k<=steps;k++){const rr=r0+dr*k,cc=c0+dc*k;if(rr<0||rr>=N||cc<0||cc>=N)break;const t=rr*N+cc;if(G.b[t]||onFire(t))break;last=t;}
  if(last<0)return m.f;
  const p=G.b[m.f];G.b[last]=Object.assign({},p,{cs:false});G.b[m.f]=null;G.freshP.add(last);G.last={f:m.f,t:last};return last;
}
function bossAttacked(m,mover){
  const B=G.boss,pc=G.b[m.f];
  B.hits[mover]++;G.stats.sac[mover]++;G.last={f:m.f,t:m.f};G.lastKill=null;
  const to=B.kind==='V'?tossPiece(m):m.f;
  G.fx.push({k:'bosshit',sq:m.f,to:m.t,c:mover,toss:to!==m.f?to:-1});
  const nm=BOSS_NAME[B.kind];
  note(SIDE[mover]+' '+NAMES[pc.t]+' strikes the '+nm+' ('+B.hits[mover]+'/'+B.max+')');
  event(mover?'':'y',SIDE[mover]+' hits the '+nm+' ('+B.hits[mover]+'/'+B.max+')');
  if(B.hits[mover]>=B.max){bossWin(mover);return;}
  if(B.kind==='V')bossSlam();else if(B.kind==='D')dragonBreath();
}
function dragonBreath(){
  const B=G.boss,ring=bossRingAll(B.sq);if(!ring.length)return;
  const t1=pick(ring),near=ring.filter(t=>t!==t1&&Math.abs(rowOf(t)-rowOf(t1))<=1&&Math.abs(colOf(t)-colOf(t1))<=1),tiles=[t1];
  if(near.length)tiles.push(pick(near));
  for(const t of tiles)if(!G.df.some(x=>x.sq===t))G.df.push({sq:t,until:G.ply+10});
  G.fx.push({k:'dbreath',sq:B.sq,tiles});
  event('r','The Dragon breathes fire on '+tiles.map(sqName).join(' and '));
}
function dragonFly(){
  const B=G.boss,cand=[];
  for(let r=0;r<=N-2;r++)for(let c=0;c<=N-2;c++){const x=r*N+c;if(x!==B.sq&&bossFree(x,true)&&!bossCells(x).some(onFire))cand.push(x);}
  if(!cand.length)return;
  const na=pick(cand),a=B.sq;bossClear(a);bossPut(na);B.sq=na;G.fx.push({k:'bossmove',sq:a,to:na,fly:1});
  const r0=rowOf(na)-rnd(2),c0=colOf(na)-rnd(2),foot=new Set(bossCells(na)),cells=[];let n=0;
  for(let r=r0;r<r0+3;r++)for(let c=c0;c<c0+3;c++){
    if(r<0||r>=N||c<0||c>=N)continue;const t=r*N+c;if(foot.has(t))continue;cells.push(t);
    const p=G.b[t];if(!p||p.t==='K'||p.t==='X'||p.t==='Z'||p.t==='W'||p.c>1)continue;
    G.b[t]=null;n++;G.fx.push({k:'burn',sq:t,late:1350});afterCapture(p,1-p.c,t,true);
  }
  G.fx.push({k:'dland',sq:na,cells});
  event('r','The Dragon lands on '+sqName(na)+(n?' and scorches '+n+' unit'+(n===1?'':'s'):''));
}
function krakenAttack(){
  const B=G.boss,r0=rowOf(B.sq),c0=colOf(B.sq);
  if(Math.random()<.5){
    const dirs=[[0,1],[0,-1],[1,0],[-1,0]],d=pick(dirs),lane=rnd(2),L=[];
    let r=d[0]===0?r0+lane:d[0]>0?r0+2:r0-1,c=d[1]===0?c0+lane:d[1]>0?c0+2:c0-1;
    while(r>=0&&r<N&&c>=0&&c<N){L.push(r*N+c);r+=d[0];c+=d[1];}
    let n=0,dead=0;
    for(let st=0;st<3;st++)for(let k=L.length-1;k>=0;k--){
      const p=G.b[L[k]];if(!p||p.t==='X'||p.t==='Z')continue;
      if(k+1>=L.length){if(p.t==='K')continue;G.b[L[k]]=null;G.fx.push({k:'crush',sq:L[k]});dead++;if(p.t==='W')ramDamage(p.rid,99,null);else if(p.c<2)afterCapture(p,1-p.c,L[k],true);continue;}
      if(G.b[L[k+1]]||onFire(L[k+1]))continue;
      G.b[L[k+1]]=p;G.b[L[k]]=null;n++;
    }
    G.fx.push({k:'kwater',sq:B.sq,d,tiles:L});
    event('r','The Kraken blasts a jet of water'+(dead?' and sweeps '+dead+' unit'+(dead===1?'':'s')+' off the board':n?' and shoves units back':''));
  }else{
    const foot=new Set(bossCells(B.sq)),cand=[];
    for(let r=r0-2;r<=r0+3;r++)for(let c=c0-2;c<=c0+3;c++){if(r<0||r>=N||c<0||c>=N)continue;const t=r*N+c;if(!foot.has(t))cand.push(t);}
    const n=2+rnd(3),tiles=[];while(tiles.length<n&&cand.length)tiles.push(cand.splice(rnd(cand.length),1)[0]);
    let dead=0;
    for(const t of tiles){const p=G.b[t];if(!p||p.t==='K'||p.t==='X'||p.t==='Z'||p.t==='W'||p.c>1)continue;G.b[t]=null;dead++;afterCapture(p,1-p.c,t,true);}
    G.fx.push({k:'kslam',sq:B.sq,tiles});
    event('r','The Kraken slams '+tiles.length+' tiles'+(dead?' and crushes '+dead+' unit'+(dead===1?'':'s'):''));
  }
}
function bossWin(c){
  const B=G.boss,kind=B.kind;bossClear(B.sq);B.on=false;B.nextAt=G.ply+200;B.hits=[0,0];G.fx.push({k:'bossdie',sq:B.sq,c,kind});
  if(kind==='V'){
    const pool=Object.keys(AUG).filter(k=>k!=='deploy'&&k!=='steal'&&!G.aug[c].includes(k)&&!(k==='zone'&&G.fire));
    const got=[],gotK=[];for(let n=0;n<3&&pool.length;n++){const k=pool.splice(rnd(pool.length),1)[0];got.push(AUG[k].n);gotK.push(k);grant(c,k);}
    G.reward={side:c,keys:gotK};event('y',SIDE[c]+' slays the Vanguard and gains '+got.join(', '));
  }else if(kind==='D'){
    G.df=G.df.filter(x=>{G.fx.push({k:'dfireGone',sq:x.sq});return false;});
    G.babyQ.push({c,at:G.ply+5});event('y',SIDE[c]+' slays the Dragon: a baby dragon will join in 5 turns');
  }else{G.gold[c]+=1500;G.stats.gold[c]+=1500;event('y',SIDE[c]+' slays the Kraken: +1500 gold');}
}
function babyTick(mover){
  for(let i=G.babyQ.length-1;i>=0;i--){const q=G.babyQ[i];if(G.ply>=q.at){G.babyQ.splice(i,1);const sq=homeRow(q.c)*N+rnd(N);G.baby.push({id:uid++,c:q.c,sq});G.fx.push({k:'babyup',sq});event('y',SIDE[q.c]+' baby dragon arrives');}}
  for(const bb of[...G.baby]){
    if(bb.c!==mover||Math.random()>=.2)continue;
    const d=bb.c===0?-1:1,col=colOf(bb.sq),nr=rowOf(bb.sq)+d,old=bb.sq;bb.sq=nr*N+col;
    const cells=[];for(let dc=-1;dc<=1;dc++){const rr=nr+d,cc=col+dc;if(rr<0||rr>=N||cc<0||cc>=N)continue;cells.push(rr*N+cc);}
    let n=0;for(const t of cells){const p=G.b[t];if(canKill(p,bb.c)&&p.t!=='X'&&p.t!=='Z'){G.b[t]=null;n++;G.killer='D';afterCapture(p,bb.c,t);G.killer=null;}}
    G.fx.push({k:'babyfire',sq:bb.sq,from:old,cells});
    if(n)event('y',SIDE[bb.c]+' baby dragon scorches '+n+' unit'+(n===1?'':'s'));
    if(nr===(bb.c===0?0:N-1)){G.baby=G.baby.filter(x=>x!==bb);G.fx.push({k:'babygone',sq:bb.sq});event('','A baby dragon flies away');}
  }
}
function refreshLegal(){
  if(fireOn())burnEdge();
  burnCraters();
  syncFort();ENG.gm=G.gm;
  ENG.hot=G.cr.concat(G.df.map(x=>x.sq));
  let l=legalH(stOf());
  if(G.df.length)l=l.filter(m=>!(G.b[m.f]&&G.b[m.f].t==='K'&&G.df.some(x=>x.sq===m.t)));
  if(G.xt)l=l.filter(m=>{const q=G.b[m.f];return !(q&&G.mv.includes(q.id));});
  if(G.bonus!=null)l=l.filter(m=>m.f===G.bonus&&!(G.b[m.t]&&G.b[m.t].t==='K'&&kcount(G.b,1-G.turn)<2));
  if(G.bonus!=null&&G.bonusNoCap)l=l.filter(m=>!G.b[m.cs]);
  if(G.ban&&G.turn===G.ban.c)l=l.filter(m=>!(m.f===G.ban.f&&m.t===G.ban.t));
  G.legal=l;
}
function event(k,txt){
  G.log.unshift({k,t:txt});if(G.log.length>40)G.log.pop();
  if(k)toastFn(txt,k);
}
function note(txt){G.log.unshift({k:'',t:txt});if(G.log.length>40)G.log.pop();}

function cloneSpot(sq,piece){
  const r0=rowOf(sq),c0=colOf(sq);
  for(let d=1;d<N;d++){
    const ring=[];
    for(let r=r0-d;r<=r0+d;r++)for(let c=c0-d;c<=c0+d;c++){
      if(r<0||r>=N||c<0||c>=N||Math.max(Math.abs(r-r0),Math.abs(c-c0))!==d)continue;
      const i=r*N+c;
      if(G.b[i]||G.pw[i]||onFire(i)||(G.portals&&G.portals.includes(i)))continue;
      if(piece.t==='P'&&(r===0||r===N-1))continue;
      ring.push(i);
    }
    if(ring.length)return pick(ring);
  }
  return -1;
}
function spawnOrb(){
  const have=[];for(let i=0;i<N*N;i++)if(G.pw[i])have.push(i);
  if(have.length>=MAX_ORBS){const old=have.reduce((a,b)=>G.orbSeq[a]<=G.orbSeq[b]?a:b);G.pw[old]=null;note('The oldest orb faded away');}
  const mw=matOf(0),mbk=matOf(1),gap=Math.abs(mw-mbk);let tilt=0;if(gap>=500){const sg=mw<mbk?-1:1;tilt=sg*Math.min(1.2,(gap-300)/700)*.7;}
  const spots=[],wts=[],BASE={0:1,1:1.5,2:2.2,3:2.2,4:1.5,5:1};
  const [ob0,ob1]=orbBand();
  for(let r=ob0;r<=ob1;r++)for(let c=0;c<N;c++){const i=r*N+c;if(!G.b[i]&&!G.pw[i]&&!G.gm.includes(i)&&!onFire(i)&&!(G.portals&&G.portals.includes(i))){const v=((N-1)/2-r)/2.5;spots.push(i);wts.push(BASE[r-ob0]*Math.exp(-.9*G.orbMem*v+tilt*v));}}
  if(!spots.length)return;
  let tot=0;for(const w of wts)tot+=w;let x=Math.random()*tot,j=0;for(;j<spots.length-1;j++){x-=wts[j];if(x<=0)break;}
  const s=spots[j],v=((N-1)/2-rowOf(s))/2.5;
  G.orbMem=Math.max(-3,Math.min(3,G.orbMem*.8+v));
  if(G.gm.length<2&&Math.random()<.14){G.gm.push(s);G.fx.push({k:'gmup',sq:s});event('y','A gold mine opened on '+sqName(s));return;}
  const k=pick(['y','r','g','b','t','i']);
  G.pw[s]=k;G.orbSeq[s]=++G.orbN;G.freshO.add(s);
  event(k,PW[k].name+' orb appeared on '+sqName(s));
}
const has=(c,id)=>G.aug[c].includes(id);
const canKill=(p,by)=>!!p&&p.c!==by&&p.c<2&&p.t!=='K'&&p.t!=='W'&&!p.zh&&!p.ft&&!(p.inv>0);
const stripped=(p,o)=>Object.assign({},p,{aura:false,cs:false,rez:false,rap:false,lk:false,fz:0,zh:0,pt:false,inv:0,bty:false},o||{});
function price(c,k){const b=ITEMS[k].cost;return has(c,'cheap')?Math.ceil(b*.7):b;}
function gain(by,cap){let g=GOLD[cap.t]||0;if(has(by,'bounty'))g=Math.round(g*1.5);if(cap.rap)g+=100;G.gold[by]+=g;G.stats.gold[by]+=g;}
function afterCapture(cap,by,sq,burn){
  if(cap.c>1)return;
  if(has(by,'plunder'))for(const k in G.cd[by])G.cd[by][k]=Math.max(0,G.cd[by][k]-4);
  {const S=G.stats,kl=burn?'fire':(G.killer||'ability'),vv=VAL[cap.t]||0,mb=matOf(by),mo=matOf(cap.c)+vv;
   bump(S.k[by],kl);bump(S.d[cap.c],cap.t);if(mb<mo-200)bump(S.cl[by],kl);
   const df=matOf(0)-matOf(1),sg=df>150?1:df<-150?-1:0;
   if(sg!==0){if(S.lead!==0&&sg!==S.lead)S.tp={ply:G.ply,side:by,txt:SIDE[by]+' '+(kl==='fire'||kl==='ability'?'took':NAMES[kl]+' took')+' '+NAMES[cap.t]+' and took the lead'};S.lead=sg;}}
  if(!burn){gain(by,cap);
  {const prev=G.streak[cap.c];G.streak[by]++;G.streak[cap.c]=0;if(G.streak[by]>G.stats.str[by])G.stats.str[by]=G.streak[by];
   if(prev>=3){const bb=prev>=4?Math.min(100,30+prev*10):0;if(bb){G.gold[by]+=bb;event('y',SIDE[by]+' ends a '+prev+'-kill streak: +'+bb+' gold');}G.fx.push({k:'shutdown',sq,c:cap.c,n:prev,b:bb});}
   if(!G.fb){G.fb=true;G.gold[by]+=30;G.fx.push({k:'fblood',sq,c:by});event('y',SIDE[by]+' draws first blood: +30 gold');}}
   if(G.streak[by]>=3)G.fx.push({k:'streak',sq,c:by,n:G.streak[by]});}
  let back=false;
  if(cap.aura){
    const c=respawnCands(G.b,cap,kingSq(G.b,by),G.pw);
    if(c.length){
      const s=pick(c);
      G.b[s]=stripped(cap,{id:uid++});G.freshP.add(s);G.fx.push({k:'respawn',sq:s});back=true;
      event('y',SIDE[1-by]+' '+NAMES[cap.t]+' came back on '+sqName(s));
    }else event('y','The charged '+NAMES[cap.t]+' found no free square');
  }
  if(!back&&cap.rez){
    G.rezQ.push({sq,piece:stripped(cap),at:G.ply+4});G.fx.push({k:'shop',sq,col:'255,215,100'});
    event('y',SIDE[cap.c]+' '+NAMES[cap.t]+' will rise again on '+sqName(sq)+' in 2 turns');
  }
  if(cap.t==='H'&&!burn){
    const s=cloneSpot(sq,{t:'N'});
    if(s>=0){G.b[s]=mk('N',by);G.freshP.add(s);G.fx.push({k:'shop',sq:s,col:'255,200,90'});event('',SIDE[by]+' gains a knight from the slain champion');}
  }
}
function snapshot(){
  const cl=a=>a.map(z=>Object.assign({},z));
  return{b:G.b.map(p=>p&&Object.assign({},p)),pw:G.pw.slice(),ep:G.ep&&Object.assign({},G.ep),turn:G.turn,last:G.last&&Object.assign({},G.last),rezQ:cl(G.rezQ),meteors:cl(G.meteors),mines:cl(G.mines)};
}
function resolveTimed(){
  if(G.meteors.length){
    const q=G.meteors;G.meteors=[];
    for(const m of q){
      if(m.at>G.ply){G.meteors.push(m);continue;}
      const r0=rowOf(m.sq),c0=colOf(m.sq);let n=0;
      for(let r=r0-1;r<=r0+1;r++)for(let c=c0-1;c<=c0+1;c++){
        if(r<0||r>=N||c<0||c>=N)continue;
        const s=r*N+c,p=G.b[s];G.fx.push({k:'meteor',sq:s});
        if(p&&p.t!=='K'&&p.c<2&&!p.zh&&!p.ft&&!(p.inv>0)){G.b[s]=null;n++;afterCapture(p,m.c,s);}
      }
      event('r','Falling Star lands: '+n+' piece'+(n===1?'':'s')+' destroyed');
    }
  }
  if(G.rezQ.length){
    const q=G.rezQ;G.rezQ=[];
    for(const z of q){
      if(z.at>G.ply){G.rezQ.push(z);continue;}
      const o=G.b[z.sq];
      if(o&&(o.t==='K'||o.t==='X')){z.at=G.ply+2;G.rezQ.push(z);continue;}
      if(onFire(z.sq)){const ns=cloneSpot(z.sq,z.piece);if(ns<0){z.at=G.ply+2;G.rezQ.push(z);continue;}z.sq=ns;}
      if(o){G.b[z.sq]=null;afterCapture(o,z.piece.c,z.sq);}
      G.b[z.sq]=stripped(z.piece,{id:uid++});G.freshP.add(z.sq);G.fx.push({k:'rez',sq:z.sq});
      event('y',SIDE[z.piece.c]+' '+NAMES[z.piece.t]+' rose again on '+sqName(z.sq));
    }
  }
}
function igniteZone(){
  G.fire.on=true;ENG.fire=true;G.fx.push({k:'ignite',sq:45});
  event('r','The side columns burst into flame!');
  burnEdge();
}
/* Event-driven (no ticking): runs once at ignition and whenever the board changes, so nothing can sit on a burning edge. */
function burnEdge(){
  for(let i=0;i<N*N;i++){
    if(!isEdgeSq(i))continue;
    G.pw[i]=null;const mi=G.mines.findIndex(x=>x.sq===i);if(mi>=0)G.mines.splice(mi,1);
    const p=G.b[i];if(!p||p.t==='X'||p.t==='Z')continue;
    if(p.t==='K'){
      const r0=rowOf(i),c0=colOf(i);let best=-1,bd=99;
      for(let r=0;r<N;r++)for(let c=fireLo();c<N-fireLo();c++){const s=r*N+c;if(G.b[s]||G.pw[s]||(G.portals&&G.portals.includes(s)))continue;const dd=Math.max(Math.abs(r-r0),Math.abs(c-c0))+Math.random()*.4;if(dd<bd){bd=dd;best=s;}}
      if(best>=0){G.b[best]=Object.assign({},p,{cs:false});G.b[i]=null;G.freshP.add(best);G.fx.push({k:'knock',sq:i,to:best});event('r',SIDE[p.c]+' king is knocked off the burning edge');}
      continue;
    }
    G.b[i]=null;G.fx.push({k:'burn',sq:i});
    if(p.c<2){afterCapture(p,1-p.c,i,true);event('r',SIDE[p.c]+' '+NAMES[p.t]+' burns on '+sqName(i));}
  }
}
/* ===== Environments ===== */
function burnCraters(){
  if((!G.cr||!G.cr.length)&&!G.df.length)return;
  for(const s of G.cr.concat(G.df.map(x=>x.sq))){const p=G.b[s];if(!p||p.t==='K'||p.t==='X'||p.t==='Z')continue;
    G.b[s]=null;G.fx.push({k:'burn',sq:s,late:G.df.some(x=>x.sq===s)?900:0});
    if(p.c<2){afterCapture(p,1-p.c,s,true);event('r',SIDE[p.c]+' '+NAMES[p.t]+' burns in the crater on '+sqName(s));}}
}
function volcanoTick(){
  if(G.cr.length)for(let n=G.cr.length-1;n>=0;n--)if(Math.random()<.10){G.fx.push({k:'craterGone',sq:G.cr[n]});G.cr.splice(n,1);}
  if(Math.random()>=.15)return;
  const cand=[];
  for(let i=0;i<N*N;i++){
    if(safeRow(rowOf(i))||isEdgeSq(i)&&fireOn()||G.cr.includes(i)||(G.portals&&G.portals.includes(i)))continue;
    const p=G.b[i];if(p&&(p.t==='K'||p.t==='X'||p.t==='Z'))continue;
    cand.push(i);
  }
  if(!cand.length)return;
  const s=cand[rnd(cand.length)],p=G.b[s];
  G.fx.push({k:'volmeteor',sq:s});
  if(p&&(p.ft||p.zh||p.inv>0)){event('r','A volcanic meteor smashed into the '+sqName(s)+' - the '+NAMES[p.t]+' shrugged it off');return;}
  if(p){G.b[s]=null;afterCapture(p,1-p.c,s,true);event('r','A volcanic meteor obliterated '+SIDE[p.c]+' '+NAMES[p.t]+' on '+sqName(s));}
  else event('r','A volcanic meteor cratered '+sqName(s));
  G.pw[s]=null;const mi=G.mines.findIndex(x=>x.sq===s);if(mi>=0)G.mines.splice(mi,1);
  const gi=G.gm.indexOf(s);if(gi>=0)G.gm.splice(gi,1);
  G.cr.push(s);G.freshP.delete(s);
}
function galeTick(){
  if(Math.random()>=.20)return;
  const row=rnd(N),dir=Math.random()<.5?-1:1,mv=[];
  for(let c=0;c<N;c++){
    const f=row*N+c,p=G.b[f];if(!p||p.t==='X'||p.t==='Z')continue;
    const nc=c+dir;if(nc<0||nc>=N)continue;
    const t=row*N+nc;
    if(G.b[t]||G.pw[t]||onFire(t)||(G.portals&&G.portals.includes(t))||G.mines.some(x=>x.sq===t))continue;
    mv.push({f,t,p});
  }
  G.fx.push({k:'gale',row,dir,n:mv.length});
  event('b','Galeforce sweeps '+(dir<0?'west':'east')+' along row '+(N-row)+(mv.length?': '+mv.length+' piece'+(mv.length===1?'':'s')+' blown aside':' - nothing moved'));
  if(!mv.length)return;
  for(const m of mv)G.b[m.f]=null;
  for(const m of mv){G.b[m.t]=Object.assign({},m.p,m.p.cs?{cs:false}:{});G.freshP.add(m.t);}
  G.ep=null;
}
function rainTick(){
  const PUD_ROUNDS=6;
  for(const d of G.pd){
    const p=G.b[d.sq];
    if(!p||p.c>1||p.t==='X'||p.t==='Z'){d.id=null;d.n=0;continue;}
    if(p.id!==d.id){d.id=p.id;d.n=1;}else d.n++;
    if(d.n>=PUD_ROUNDS*2){
      const nb=[];const r0=rowOf(d.sq),c0=colOf(d.sq);
      for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const r=r0+dr,c=c0+dc;if(r<0||r>=N||c<0||c>=N)continue;const t=r*N+c;
        if(!G.b[t]&&!G.pw[t]&&!G.gm.includes(t)&&!onFire(t)&&!(G.portals&&G.portals.includes(t))&&!G.mines.some(x=>x.sq===t))nb.push(t);}
      if(!nb.length)continue;
      d.n=0;const t=nb[rnd(nb.length)],k=pick(['y','r','g','b','t','i']);
      const have=[];for(let i=0;i<N*N;i++)if(G.pw[i])have.push(i);
      if(have.length>=MAX_ORBS){const old=have.reduce((a,b)=>G.orbSeq[a]<=G.orbSeq[b]?a:b);G.pw[old]=null;}
      G.pw[t]=k;G.orbSeq[t]=++G.orbN;G.freshO.add(t);G.fx.push({k:'rainorb',sq:d.sq,to:t});
      event(k,'The puddle under '+SIDE[p.c]+' '+NAMES[p.t]+' sprouted a '+PW[k].name+' orb on '+sqName(t));
    }
  }
  if(G.pd.length<10&&Math.random()<.20){
    const cand=[];
    for(let i=0;i<N*N;i++){
      if(G.pd.some(d=>d.sq===i)||onFire(i)||(G.portals&&G.portals.includes(i)))continue;
      const p=G.b[i];if(p&&(p.t==='X'||p.t==='Z'))continue;cand.push(i);}
    if(cand.length){const sq=cand[rnd(cand.length)];G.pd.push({sq,id:null,n:0});G.fx.push({k:'puddle',sq});}
  }
}
function envTick(){
  if(G.env==='volcano')volcanoTick();
  else if(G.env==='sky')galeTick();
  else if(G.env==='rain')rainTick();
  burnCraters();
  if(G.fire&&G.fire.on)burnEdge();
}
const ramCells=rid=>{const o=[];for(let i=0;i<N*N;i++){const p=G.b[i];if(p&&p.t==='W'&&p.rid===rid)o.push(i);}return o;};
function ramDamage(rid,n,by){
  const cells=ramCells(rid);if(!cells.length)return;
  const p0=G.b[cells[0]],hp=p0.hp-n;
  if(hp<=0){for(const s of cells){G.fx.push({k:'crush',sq:s});G.b[s]=null;}event('r',SIDE[p0.c]+' battering ram is wrecked');if(by!=null&&by!==p0.c)afterCapture(p0,by,cells[0]);return;}
  for(const s of cells)G.b[s]=Object.assign({},G.b[s],{hp});
  G.fx.push({k:'ramhit',sq:cells[0]});
}
function ramTick(mover){
  const seen=new Set();
  for(let i=0;i<N*N;i++){
    const p=G.b[i];if(!p||p.t!=='W'||p.c!==mover||seen.has(p.rid))continue;seen.add(p.rid);
    if(Math.random()>=.5)continue;
    const cells=ramCells(p.rid),d=mover===0?-1:1,front=cells.map(s=>s+d*N);
    if(front.some(s=>s<0||s>=N*N)){ramDamage(p.rid,99,null);continue;}
    let blocked=false,boss=false;
    for(const s of front){const q=G.b[s];if(!q)continue;
      if(q.t==='Z')boss=true;
      else if(q.t==='K'||q.t==='W'||q.zh||q.inv>0)blocked=true;
      else if(q.c!==mover&&q.ft)blocked=true;}
    if(blocked)continue;
    if(boss){
      G.boss.hits[mover]++;G.stats.sac[mover]++;G.fx.push({k:'ramhit',sq:cells[0]});
      event('r',SIDE[mover]+' ram slams into the boss ('+G.boss.hits[mover]+'/'+G.boss.max+')');
      ramDamage(p.rid,1,null);
      if(G.boss.hits[mover]>=G.boss.max)bossWin(mover);
      continue;
    }
    let dmg=0;const swap=[];
    for(const s of front){const q=G.b[s];if(!q)continue;
      if(q.c===mover&&q.t!=='X'){swap.push(s);continue;}
      G.fx.push({k:'crush',sq:s});G.b[s]=null;dmg++;
      if(q.t==='X')event('y',SIDE[mover]+' ram smashes through the '+(q.wl?'wall':'rock'));
      else{G.killer='W';afterCapture(q,mover,s);G.killer=null;}
    }
    const hp=p.hp-dmg,moved=[];
    for(let k=0;k<cells.length;k++){const o=G.b[cells[k]],sw=swap.includes(front[k])?G.b[front[k]]:null;G.b[front[k]]=Object.assign({},o,{hp});G.b[cells[k]]=sw?Object.assign({},sw,{cs:false}):null;if(sw){G.freshP.add(cells[k]);G.fx.push({k:'polar',sq:cells[k],to:front[k]});event('y',SIDE[mover]+' ram swaps places with a '+NAMES[sw.t]);}moved.push(front[k]);}
    G.freshP=G.freshP||new Set();
    const endRow=mover===0?0:N-1;
    if(hp<=0){ramDamage(p.rid,99,mover===p.c?null:null);G.fx.push({k:'ramhit',sq:moved[0]});}
    else if(rowOf(moved[0])===endRow||moved.some(s=>onFire(s))){ramDamage(p.rid,99,null);}
  }
}
function turretFire(mover){
  for(let i=0;i<N*N;i++){
    const t=G.b[i];if(!t||t.t!=='T'||t.c!==mover)continue;
    const tg=[];for(const dd of BOX5){const rr=rowOf(i)+dd[0],cc=colOf(i)+dd[1];if(rr<0||rr>=N||cc<0||cc>=N)continue;const s=rr*N+cc,q=G.b[s];if(canKill(q,mover))tg.push(s);}
    if(!tg.length||Math.random()>=.25)continue;
    const pw=tg.filter(s=>G.b[s].t==='P'),s=pick(pw.length?pw:tg),vic=G.b[s];
    G.b[s]=null;G.fx.push({k:'shot',sq:i,to:s});G.killer='T';
    note(SIDE[mover]+' turret '+sqName(i)+' fires on '+sqName(s)+' ('+NAMES[vic.t]+')');
    afterCapture(vic,mover,s);G.killer=null;
    const sh=(t.sh==null?3:t.sh)-1;
    if(sh<=0){G.b[i]=null;G.fx.push({k:'turretgone',sq:i});event('r',SIDE[mover]+' turret is spent and dismantles');}else G.b[i]=Object.assign({},G.b[i],{sh});
  }
}
function endTurn(){
  const mover=G.turn;
  G.mv=[];G.xu=false;G.xt=false;
  if(!G.over)turretFire(mover);
  if(!G.over)ramTick(mover);
  babyTick(mover);
  for(let i=0;i<N*N;i++){const p=G.b[i];if(!p||p.c!==mover)continue;
    if(p.t==='H'){p.ttl--;if(p.ttl<=0){G.b[i]=null;event('','The '+SIDE[mover]+' champion vanished');continue;}}
    if(p.fz)p.fz--;if(p.zh)p.zh--;if(p.inv>0)p.inv--;}
  if(G.fort[mover]>0)G.fort[mover]--;
  for(const k in G.cd[mover])if(G.cd[mover][k]>0)G.cd[mover][k]--;
  G.turn=1-G.turn;G.ply++;G.gold[G.turn]+=5+(has(G.turn,'midas')?3:0);
  if(G.gm.length){
    if(G.turn===0)for(let n=G.gm.length-1;n>=0;n--)if(Math.random()<.05){G.fx.push({k:'gmgone',sq:G.gm[n]});event('','A gold mine ran dry on '+sqName(G.gm[n]));G.gm.splice(n,1);}
    for(const s of G.gm){const p=G.b[s];if(p&&p.c===G.turn){G.gold[G.turn]+=10;G.stats.gm[G.turn]+=10;G.fx.push({k:'gmpay',sq:s});}}
  }
  if(G.fire&&!G.fire.on&&G.ply>=G.fire.at)igniteZone();
  bossTick();
  resolveTimed();
  envTick();
  if(G.ply>=G.nextOrb){spawnOrb();G.nextOrb=G.ply+ORB_MIN+rnd(ORB_MAX-ORB_MIN+1);}
  refreshLegal();
  if(!G.legal.length){
    G.over=inCheck(stOf())?{type:'mate',winner:1-G.turn}:{type:'stalemate'};
    if(G.over.type==='mate'){const lp=G.last&&G.b[G.last.t];G.stats.mateBy=lp?lp.t:null;}
  }else if(G.b.every(p=>!p||p.t==='K'||p.t==='X'||p.t==='Z')){
    G.over={type:'kings'};
  }
  if(!G.over&&G.ply%AUG_EVERY===0)startDraft();
}

/* Play one move for the side to move (also used for bonus moves). */
function play(m,promoT){
  const mover=G.turn,wasBonus=G.bonus!=null||!!G.xt;
  G.xt=false;
  if(!wasBonus){G.hist.push(snapshot());if(G.hist.length>10)G.hist.shift();if(G.ban&&G.ban.c===mover)G.ban=null;}
  G.bonus=null;G.bonusNoCap=false;G.sel=null;G.selMoves=[];G.freshP=new Set();G.freshO=new Set();G.fx=[];G.killer=null;
  const contested=G.pw[m.t]?legal({b:G.b,ep:null,turn:1-mover,ply:G.ply}).some(x=>x.t===m.t):false;
  const piece=G.b[m.f],tp=G.b[m.cs];
  if(piece&&piece.id!=null)G.mv.push(piece.id);
  if(tp&&tp.lk){
    G.b[m.cs]=Object.assign({},tp,{lk:false});G.last={f:m.f,t:m.f};G.lastKill=null;
    G.fx.push({k:'shop',sq:m.cs,col:'120,180,255'});
    note(SIDE[mover]+' '+NAMES[piece.t]+' '+sqName(m.f)+'×'+sqName(m.cs)+' (blocked)');
    event('g',"Queen’s Veil blocked the capture and bounced the attacker back");
    endTurn();return;
  }
  if(m.fl===5||m.fl===6){
    const vic=G.b[m.t],nm=m.fl===6?'archer':'turret';
    if(vic&&vic.t==='W'){G.fx.push({k:'shot',sq:m.f,to:m.t});G.last={f:m.f,t:m.f};ramDamage(vic.rid,1,mover);endTurn();return;}
    if(vic&&vic.ft){G.fx.push({k:'shot',sq:m.f,to:m.t});G.fx.push({k:'fortbreak',sq:m.f,to:m.t});G.b[m.f]=null;event('r','The '+nm+' shot is reflected by the fortification');afterCapture({t:'T',c:mover},1-mover,m.f);endTurn();return;}
    G.b[m.t]=null;G.last={f:m.f,t:m.t};G.lastKill=vic?vic.t:null;G.fx.push({k:'shot',sq:m.f,to:m.t});
    note(SIDE[mover]+' '+nm+' '+sqName(m.f)+' shoots '+sqName(m.t)+(vic?' ('+NAMES[vic.t]+')':''));
    if(vic)afterCapture(vic,mover,m.t);
    const tt=G.b[m.f];
    if(tt&&m.fl===5){const sh=(tt.sh==null?3:tt.sh)-1;if(sh<=0){G.b[m.f]=null;G.fx.push({k:'turretgone',sq:m.f});event('r',SIDE[mover]+' turret is spent and dismantles');}else G.b[m.f]=Object.assign({},tt,{sh});}
    endTurn();return;
  }
  {const tg=G.b[m.t];
   if(tg&&tg.t==='Z'){bossAttacked(m,mover);endTurn();return;}
   if(tg&&tg.t==='W'&&tg.c!==mover&&m.fl!==6){
    G.last={f:m.f,t:m.f};G.lastKill=null;G.fx.push({k:'ramhit',sq:m.t});
    note(SIDE[mover]+' '+NAMES[G.b[m.f].t]+' strikes the ram');ramDamage(tg.rid,1,mover);
    endTurn();return;
   }
   const tc=G.b[m.cs];
   if(m.fl!==5&&tc&&tc.ft&&tc.c!==mover&&tc.c<2&&m.cs!=null){
    const pc=G.b[m.f];G.b[m.f]=null;G.last={f:m.f,t:m.f};G.fx.push({k:'fortbreak',sq:m.f,to:m.cs});G.stats.ft[1-mover]++;
    event('r',SIDE[mover]+' '+NAMES[pc.t]+' strikes a fortified tile and is destroyed');
    afterCapture(pc,1-mover,m.f);endTurn();return;
   }}
  const r=applyCore(stOf(),m,promoT);
  G.b=r.b;G.ep=r.ep;G.last={f:m.f,t:m.t};
  if(m.grp&&m.grp.length){
    for(const g of m.grp){const q=G.b[g.f];if(q&&!G.b[g.t]){G.b[g.t]=q;G.b[g.f]=null;}}
    G.fx.push({k:'formation',sq:m.t,n:m.grp.length});event('g',SIDE[mover]+' pawns march in formation ('+(m.grp.length+1)+' pawns)');
  }
  let msg;
  if(m.fl===3)msg=SIDE[mover]+' castles short';
  else if(m.fl===4)msg=SIDE[mover]+' castles long';
  else msg=SIDE[mover]+' '+NAMES[piece.t]+' '+sqName(m.f)+(r.captured?'×':'→')+sqName(m.t);
  if(r.captured)msg+=' (took '+NAMES[r.captured.t]+')';
  if(m.pr)msg+=' = '+NAMES[r.piece.t];
  note(msg);
  G.lastKill=r.captured?r.captured.t:null;

  G.killer=piece.t;
  if(r.captured)afterCapture(r.captured,mover,m.cs);
  if(r.captured&&r.captured.c<2&&G.b[m.t])G.burn[mover]=G.b[m.t].id;
  let cur=G.b[m.t];
  if(cur&&m.pr&&onFire(m.t)){
    const r0=rowOf(m.t),c0=colOf(m.t);let best=-1,bd=99;
    for(let r=0;r<N;r++)for(let c=fireLo();c<N-fireLo();c++){const s=r*N+c;if(G.b[s]||G.pw[s]||(G.portals&&G.portals.includes(s)))continue;const dd=Math.max(Math.abs(r-r0),Math.abs(c-c0))+Math.random()*.4;if(dd<bd){bd=dd;best=s;}}
    if(best>=0){G.b[best]=cur;G.b[m.t]=null;G.freshP.add(best);G.fx.push({k:'knock',sq:m.t,to:best});event('y',SIDE[mover]+' pawn promotes and is flung clear of the flames');m=Object.assign({},m,{t:best});G.last={f:m.f,t:best};cur=G.b[best];}
  }

  const mi=G.mines.findIndex(x=>x.sq===m.t&&x.c!==mover);
  if(mi>=0&&cur&&cur.t!=='K'&&!cur.zh){
    G.mines.splice(mi,1);G.b[m.t]=null;afterCapture(cur,1-mover,m.t);G.fx.push({k:'mine',sq:m.t});
    event('r',SIDE[mover]+' '+NAMES[cur.t]+' stepped on a mine');G.lastKill=cur.t;cur=null;
  }
  if(cur&&r.captured&&piece.t==='P'&&has(mover,'fury')){
    const r0=rowOf(m.cs),c0=colOf(m.cs),cand=[];
    for(let rr=r0-1;rr<=r0+1;rr++)for(let cc=c0-1;cc<=c0+1;cc++){if(rr<0||rr>=N||cc<0||cc>=N)continue;const s=rr*N+cc,p=G.b[s];if(p&&p.t==='P'&&canKill(p,mover))cand.push(s);}
    if(cand.length){const s=pick(cand),v=G.b[s];G.b[s]=null;afterCapture(v,mover,s);G.fx.push({k:'meteor',sq:s});event('r','Reaper’s Cleave cleaves an enemy pawn on '+sqName(s));}
  }

  if(cur&&G.portals){
    const pi=G.portals.indexOf(m.t);
    if(pi>=0){
      const ex=G.portals[1-pi],ob=G.b[ex],en=m.t;
      let ok=false,swap=false;
      if(!ob)ok=true;
      else if(canKill(ob,mover))ok=true;
      else if(ob.c===mover&&ob.t!=='K'&&ob.t!=='X'&&!ob.zh){
        const b2=G.b.slice();b2[en]=ob;b2[ex]=cur;const ks=kingSq(b2,mover);
        if(ks<0||!attacked(b2,ks,1-mover)){ok=true;swap=true;}
      }
      if(ok){
        if(swap){G.b[en]=Object.assign({},ob,{cs:false});G.b[ex]=cur;G.freshP.add(en);}
        else{if(ob){G.b[ex]=null;afterCapture(ob,mover,ex);}G.b[ex]=cur;G.b[en]=null;}
        G.fx.push({k:'portal',sq:en,to:ex,swap});
        G.last={f:m.f,t:ex};m=Object.assign({},m,{t:ex});cur=G.b[ex];
        event('b',SIDE[mover]+' '+NAMES[cur.t]+' steps through the gate to '+sqName(ex)+(swap?' and swaps places':ob&&!swap?' and takes '+NAMES[ob.t]:''));
      }
    }
  }
  const k=G.pw[m.t];
  let bonusSq=null,tag='';
  if(k&&cur&&(cur.t!=='K'||k==='r')&&cur.t!=='H'&&cur.t!=='X'){
    G.pw[m.t]=null;bump(G.stats.orbs[mover],k);
    if(contested){G.gold[mover]+=40;G.stats.contest[mover]++;G.fx.push({k:'shop',sq:m.t,col:'255,120,90'});event('y',SIDE[mover]+' snatches a contested orb: +40 gold');}
    if(k==='y'){
      G.b[m.t]=Object.assign({},cur,{aura:true});G.fx.push({k:'charge',sq:m.t});
      event('y',SIDE[mover]+' '+NAMES[cur.t]+' is charged on '+sqName(m.t));
    }else if(k==='g'){
      const s=cloneSpot(m.t,cur);
      if(s>=0){G.b[s]=stripped(cur,{id:uid++});G.freshP.add(s);G.fx.push({k:'clone',sq:s});event('g',SIDE[mover]+' '+NAMES[cur.t]+' cloned onto '+sqName(s));}
      else event('g','No room to clone');
    }else if(k==='b'){
      G.gold[mover]+=100;G.fx.push({k:'bounty',sq:m.t});
      event('y',SIDE[mover]+' '+NAMES[cur.t]+' claims a bounty: +100 gold');
    }else if(k==='t'){
      G.inv[mover].turret++;G.fx.push({k:'shop',sq:m.t,col:'170,180,205'});
      event('g',SIDE[mover]+' picks up a turret. Place it from your inventory');
    }else if(k==='i'){
      G.b[m.t]=Object.assign({},cur,{inv:6});G.fx.push({k:'cloak',sq:m.t});
      event('g',SIDE[mover]+' '+NAMES[cur.t]+' turns invisible');
    }else{bonusSq=m.t;tag='Chain move';}
  }
  if(bonusSq==null&&cur&&!wasBonus){
    cur=G.b[m.t];
    if(r.captured&&cur.rap){bonusSq=m.t;tag='Wrath Blade';}
    else if(r.captured&&cur.t==='N'&&has(mover,'cav')){bonusSq=m.t;G.bonusNoCap=true;tag='Cavalry';}
    else if(has(mover,'ultra')&&Math.random()<.2){bonusSq=m.t;tag='Overdrive';}
  }
  if(bonusSq!=null){
    G.bonus=bonusSq;refreshLegal();
    if(!G.legal.length){G.bonus=null;G.bonusNoCap=false;event('r',tag+' fizzled: no legal move');}
    else{event('r',tag+': '+SIDE[mover]+' '+NAMES[G.b[bonusSq].t]+' moves again'+(G.bonusNoCap?' (no captures)':''));return;}
  }
  finishTurn();
}
function finishTurn(){
  const mover=G.turn;
  if(has(mover,'twin')&&!G.xu&&!G.over&&!G.promo){
    G.xu=true;G.xt=true;refreshLegal();
    if(G.legal.length){event('r','Double Time: '+SIDE[mover]+' may move another piece');return;}
    G.xt=false;
  }
  endTurn();
}
function aiExtra(){
  const c=G.turn;if(!G.xt)return false;
  let best=null,bv=-1;
  for(const m of G.legal){const v=G.b[m.cs];if(!v||v.c===c)continue;const a=G.b[m.f],vv=VAL[v.t]||0;if(attacked(G.b,m.t,1-c)&&vv<(VAL[a.t]||0))continue;if(vv>bv){bv=vv;best=m;}}
  if(best)play(best,'Q');else skipBonus();
  return true;
}
function skipBonus(){
  if(G.bonus==null&&!G.xt)return;
  note(SIDE[G.turn]+' skips the bonus move');
  G.bonus=null;G.bonusNoCap=false;G.xt=false;G.sel=null;G.selMoves=[];
  endTurn();
}

/* ===== Augments ===== */
function rollAug(c){
  const owned=new Set(G.aug[c]),gl=k=>G.aug[0].includes(k)||G.aug[1].includes(k);
  const all=Object.keys(AUG).filter(k=>!owned.has(k)&&!((k==='terrain'||k==='zone'||k==='portal')&&gl(k)));
  const out=[];
  while(out.length<3&&all.length){
    const x=Math.random(),tier=x<.5?'s':x<.85?'g':'p';
    let pool=all.filter(k=>AUG[k].t===tier&&!out.includes(k));
    if(!pool.length)pool=all.filter(k=>!out.includes(k));
    if(!pool.length)break;
    out.push(pick(pool));
  }
  return out;
}
function startDraft(){G.draftQ=[0,1];nextDraft();}
function nextDraft(){
  const c=G.draftQ.shift();
  if(c==null){G.draft=null;refreshLegal();return;}
  const o=rollAug(c);
  if(!o.length){nextDraft();return;}
  G.draft={side:c,opts:o};
}
function pickAug(id){
  const d=G.draft;if(!d||!d.opts.includes(id))return false;
  G.draft=null;G.sel=null;G.selMoves=[];G.fx=[];G.freshP=new Set();
  event('y',SIDE[d.side]+' chose '+AUG[id].n);
  grant(d.side,id);
  if(!G.tgt)nextDraft();
  return true;
}
function markRandom(c,flag){
  const cand=[];for(let i=0;i<N*N;i++){const p=G.b[i];if(p&&p.c===c&&p.t!=='K'&&p.t!=='X'&&p.t!=='T'&&!p[flag])cand.push(i);}
  if(!cand.length)return;
  const s=pick(cand);G.b[s]=Object.assign({},G.b[s],{[flag]:true});G.fx.push({k:'shop',sq:s,col:flag==='rez'?'255,215,100':'255,120,120'});
  event('y',SIDE[c]+' '+NAMES[G.b[s].t]+' on '+sqName(s)+' gains '+(flag==='rez'?'Resurrect':'the Wrath Blade'));
}
/* Bulwark row: the pawn rank, or one step inside the fire once the Safe Zone burns. */
const bulwarkRow=c=>pawnRow(c);
function ascendArmy(c){
  const fire=fireOn(),lo=fireLo(),o=OFF(),slots=[];
  for(let i=0;i<N*N;i++){const p=G.b[i];if(p&&p.c===c)G.b[i]=null;}
  G.rezQ=G.rezQ.filter(z=>z.piece.c!==c);
  if(!fire){
    ['R','N','B','M','Q','K','M','B','N','R'].forEach((t,k)=>slots.push({r:homeRow(c),col:o+k,t,cs:t==='R'||t==='K'}));
    for(let k=0;k<10;k++)slots.push({r:pawnRow(c),col:o+k,t:'P'});
  }else{
    const hr=homeRow(c),dir=c===0?-1:1;
    ['R','B','M','Q','K','M','B','R'].forEach((t,k)=>slots.push({r:hr,col:lo+k,t}));
    for(let k=0;k<8;k++)slots.push({r:hr+dir,col:lo+k,t:'P'});
    ['N','P','P','N'].forEach((t,k)=>slots.push({r:hr+2*dir,col:lo+2+k,t}));
  }
  let n=0;
  for(const s of slots){
    const sq=s.r*N+s.col,q=G.b[sq];let tgt=sq;
    if(q){
      if(q.c<2&&q.c!==c){G.b[sq]=null;const ns=cloneSpot(sq,q);if(ns>=0){G.b[ns]=q;G.freshP.add(ns);}}
      else tgt=cloneSpot(sq,{t:s.t});
    }
    if(tgt<0)continue;
    G.b[tgt]=mk(s.t,c,!!s.cs);G.pw[tgt]=null;G.freshP.add(tgt);n++;
  }
  G.fx.push({k:'ascend',c,sq:homeRow(c)*N+HALF()});
  event('y',SIDE[c]+' ascends: the army is rebuilt ('+n+' units)');
}
function sunderBoards(){
  const sw=p=>Object.assign({},p,{c:1-p.c,vc:p.vc!=null?p.vc:p.c,cs:false});
  for(let i=0;i<N*N;i++){const p=G.b[i];if(p&&p.c<2)G.b[i]=sw(p);}
  G.rezQ=G.rezQ.map(z=>Object.assign({},z,{piece:sw(z.piece)}));G.ep=null;
  G.fx.push({k:'sunder',sq:HALF()*N+HALF()});
}
/* Formation: friendly pawns touching the moving pawn step forward too. Returns [{f,t}] already validated. */
function formationGroup(m){
  const c=G.turn,d=c===0?-1:1,out=[];
  const b2=applyCore(stOf(),m,'Q').b,r0=rowOf(m.f),c0=colOf(m.f),cands=[];
  for(const dd of KG){const rr=r0+dd[0],cc=c0+dd[1];if(rr<0||rr>=N||cc<0||cc>=N)continue;const f=rr*N+cc,q=G.b[f];
    if(!q||q.t!=='P'||q.c!==c||q.fz||q.zh)continue;const tr=rr+d;if(tr<=0||tr>=N-1)continue;cands.push({f,t:tr*N+cc,tr});}
  cands.sort((a,b)=>d<0?a.tr-b.tr:b.tr-a.tr);
  const two=kcount(b2,c)>=2;
  for(const g of cands){
    if(b2[g.t]||G.pw[g.t]||onFire(g.t)||G.mines.some(x=>x.sq===g.t)||(G.portals&&G.portals.includes(g.t)))continue;
    const q=b2[g.f];b2[g.t]=q;b2[g.f]=null;
    const ks=kingSq(b2,c);
    if(!two&&ks>=0&&attacked(b2,ks,1-c)){b2[g.f]=q;b2[g.t]=null;continue;}
    out.push({f:g.f,t:g.t});
  }
  return out;
}
function polarSafe(a,b,c){
  const b2=G.b.slice(),pa=b2[a],pb=b2[b];
  b2[a]=Object.assign({},pb,{cs:false});b2[b]=Object.assign({},pa,{cs:false});
  return legal({b:b2,ep:null,turn:c,ply:G.ply}).length>0;
}
function placeRocks(){
  const cand=[];{const [m0,m1]=midBand();for(let r=m0;r<=m1;r++)for(let c=2+OFF();c<=7+OFF();c++){const i=r*N+c;if(!G.b[i])cand.push(i);}}
  for(let n=0;n<6&&cand.length;n++){const s=cand.splice(rnd(cand.length),1)[0];G.b[s]={id:uid++,t:'X',c:2,aura:false,cs:false};G.pw[s]=null;G.freshP.add(s);G.fx.push({k:'shop',sq:s,col:'170,170,180'});}
  event('','Rocks rise in the center');
}
function placeMines(c){
  const cand=[];{const [m0,m1]=midBand();for(let r=m0;r<=m1;r++)for(let col=OFF();col<=9+OFF();col++){const i=r*N+col;if(!G.b[i]&&!G.mines.some(x=>x.sq===i))cand.push(i);}}
  for(let n=0;n<3&&cand.length;n++){const s=cand.splice(rnd(cand.length),1)[0];G.mines.push({sq:s,c});}
  event('r',SIDE[c]+' plants 3 mines');
}
function placePortals(){
  const cand=[];{const [o0,o1]=orbBand();for(let r=o0;r<=o1;r++)for(let c=1+OFF();c<=8+OFF();c++){const i=r*N+c;if(!G.b[i]&&!G.pw[i]&&!G.mines.some(x=>x.sq===i))cand.push(i);}}
  if(cand.length<2)return;
  const a=cand.splice(rnd(cand.length),1)[0],far=cand.filter(i=>Math.max(Math.abs(rowOf(i)-rowOf(a)),Math.abs(colOf(i)-colOf(a)))>=3),b=pick(far.length?far:cand);
  G.portals=[a,b];G.fx.push({k:'shop',sq:a,col:'90,170,255'},{k:'shop',sq:b,col:'255,160,70'});
  event('b','Twin Gates open on '+sqName(a)+' and '+sqName(b));
}
function grant(c,id){
  G.aug[c].push(id);
  switch(id){
    case 'terrain':placeRocks();break;
    case 'rez':markRandom(c,'rez');break;
    case 'rapier':markRandom(c,'rap');break;
    case 'linken':{const q=G.b.findIndex(p=>p&&p.t==='Q'&&p.c===c);if(q>=0)G.b[q]=Object.assign({},G.b[q],{lk:true});break;}
    case 'midas':G.gold[c]+=40;break;
    case 'mines':placeMines(c);break;
    case 'charged':ENG.cp[c]=true;break;
    case 'zone':G.fire={at:G.ply+30,on:false};G.fx.push({k:'zone',sq:45});event('r','Safe Zone: the side columns ignite in 30 turns');break;
    case 'portal':placePortals();break;
    case 'aghs':ENG.ag[c]=true;break;
    case 'polarity':G.inv[c].polarity=3;break;
    case 'deploy':startTgt('deploy',c,true);break;
    case 'steal':{
      let pool=G.aug[1-c].filter(k=>k!=='steal'&&k!=='terrain'&&k!=='zone'&&k!=='portal'&&!G.aug[c].includes(k));
      if(!pool.length)pool=Object.keys(AUG).filter(k=>k!=='steal'&&k!=='terrain'&&k!=='zone'&&k!=='portal'&&!G.aug[c].includes(k));
      if(pool.length){const k=pick(pool);event('y',SIDE[c]+' steals '+AUG[k].n);grant(c,k);}
      break;
    }
  }
}

/* ===== Targeting (deploy, blink, meteor, frost, zhonya) ===== */
const half=(c,own)=>{const top=(c===0)===own;return top?[HALF(),N-1]:[0,HALF()-1];};  // rows of a side's own/enemy half
function plusSpawn(c,sq){
  const r=rowOf(sq),col=colOf(sq),out=[];
  for(const d of[[0,0],[-1,0],[1,0],[0,-1],[0,1]]){
    const rr=r+d[0],cc=col+d[1];if(rr<1||rr>N-2||cc<0||cc>=N)continue;
    const [lo,hi]=ownRows(c);if(rr<lo||rr>hi)continue;
    const s=rr*N+cc;if(!G.b[s]&&!onFire(s))out.push(s);
  }
  return out;
}
function blinkDest(c,from){
  const r0=rowOf(from),c0=colOf(from),out=new Set(),k=kingSq(G.b,c);
  for(let r=r0-3;r<=r0+3;r++)for(let col=c0-3;col<=c0+3;col++){
    if(r<0||r>=N||col<0||col>=N)continue;const s=r*N+col;if(G.b[s]||onFire(s))continue;
    const b=G.b.slice();b[s]=b[from];b[from]=null;
    if(!attacked(b,k,1-c))out.add(s);
  }
  return out;
}
const wallOk=s=>s>=0&&s<N*N&&!G.b[s]&&!G.pw[s]&&!onFire(s)&&!(G.portals&&G.portals.includes(s))&&!G.mines.some(x=>x.sq===s);
function wallRun(sq){
  const r=rowOf(sq),out=[sq];let l=sq-1,rt=sq+1,tryR=true;
  const okR=s=>s<N*N&&rowOf(s)===r&&wallOk(s),okL=s=>s>=0&&rowOf(s)===r&&wallOk(s);
  while(out.length<3){
    if(tryR&&okR(rt)){out.push(rt++);}
    else if(!tryR&&okL(l)){out.push(l--);}
    else if(okR(rt)){out.push(rt++);}
    else if(okL(l)){out.push(l--);}
    else break;
    tryR=!tryR;
  }
  return out;
}
function tgtValid(t){
  const c=t.c,v=new Set();
  if(t.kind==='deploy'){for(let s=0;s<N*N;s++)if(plusSpawn(c,s).length&&rowOf(s)>=ownRows(c)[0]&&rowOf(s)<=ownRows(c)[1])v.add(s);}
  else if(t.kind==='meteor'){const [lo,hi]=ownRows(1-c);for(let s=0;s<N*N;s++)if(rowOf(s)>=lo&&rowOf(s)<=hi)v.add(s);}
  else if(t.kind==='frost'){for(let s=0;s<N*N;s++)v.add(s);}
  else if(t.kind==='turret'){for(let s=0;s<N*N;s++){if(!wallOk(s))continue;let ok=false;for(const dd of KG){const rr=rowOf(s)+dd[0],cc=colOf(s)+dd[1];if(rr<0||rr>=N||cc<0||cc>=N)continue;const q=G.b[rr*N+cc];if(q&&q.c===c){ok=true;break;}}if(ok)v.add(s);}}
  else if(t.kind==='polar'){
    for(let s=0;s<N*N;s++){const p=G.b[s];if(!p||p.t==='X'||p.t==='Z'||p.c>1)continue;
      if(t.step===0){v.add(s);continue;}
      if(s!==t.from&&polarSafe(t.from,s,c))v.add(s);}
  }
  else if(t.kind==='archer'){for(let s=0;s<N*N;s++){const p=G.b[s];if(!p||p.t!=='P'||p.c!==c)continue;const bs=s+(c===0?N:-N);if(bs>=0&&bs<N*N&&Math.abs(rowOf(bs)-rowOf(s))===1&&wallOk(bs))v.add(bs);}}
  else if(t.kind==='ram'){const hr=homeRow(c);for(let col=0;col<N;col++){const a=hr*N+col;if(wallOk(a))v.add(a);}}
  else if(t.kind==='wall'){for(let s=0;s<N*N;s++)if(wallOk(s))v.add(s);}
  else if(t.kind==='zhonya'){for(let s=0;s<N*N;s++){const p=G.b[s];if(p&&p.c===c&&p.t!=='K'&&p.t!=='X'&&!p.zh)v.add(s);}}
  else if(t.kind==='blink'){
    if(t.step===0){for(let s=0;s<N*N;s++){const p=G.b[s];if(p&&p.c===c&&p.t!=='K'&&p.t!=='X'&&blinkDest(c,s).size)v.add(s);}}
    else return blinkDest(c,t.from);
  }
  return v;
}
function startTgt(kind,c,forced){
  const t={kind,c,forced:!!forced,step:0};t.valid=tgtValid(t);
  if(!t.valid.size){if(!forced)toastFn('No valid target right now.','n');return false;}
  G.tgt=t;G.sel=null;G.selMoves=[];G.chute=false;return true;
}
function endTgt(){const t=G.tgt;G.tgt=null;if(t&&t.forced)nextDraft();else refreshLegal();}
function tgtClick(sq){
  const t=G.tgt;if(!t||!t.valid.has(sq))return false;
  const c=t.c;shopReset();
  if(t.kind==='deploy'){
    const sp=plusSpawn(c,sq);for(const s of sp){G.b[s]=mk('P',c);G.freshP.add(s);G.fx.push({k:'shop',sq:s,col:'255,200,90'});}
    event('y',SIDE[c]+' deploys '+sp.length+' pawns');endTgt();return true;
  }
  if(t.kind==='blink'){
    if(t.step===0){t.from=sq;t.step=1;t.valid=tgtValid(t);return true;}
    const p=G.b[t.from];G.b[sq]=Object.assign({},p,{cs:false});G.b[t.from]=null;G.last={f:t.from,t:sq};
    G.used[c].blink=true;event('y',SIDE[c]+' '+NAMES[p.t]+' blinks to '+sqName(sq));endTgt();return true;
  }
  if(t.kind==='meteor'){
    G.meteors.push({sq,c,at:G.ply+3});G.used[c].meteor=true;
    event('r',SIDE[c]+' calls a meteor on '+sqName(sq)+' (lands in 2 turns)');endTgt();return true;
  }
  if(t.kind==='polar'){
    if(t.step===0){t.from=sq;t.step=1;t.valid=tgtValid(t);if(!t.valid.size){toastFn('No safe swap for that unit.','n');G.tgt=null;refreshLegal();}return true;}
    const a=t.from,pa=G.b[a],pb=G.b[sq];
    G.b[a]=Object.assign({},pb,{cs:false});G.b[sq]=Object.assign({},pa,{cs:false});G.freshP.add(a);G.freshP.add(sq);G.inv[c].polarity--;
    G.fx.push({k:'polar',sq:a,to:sq});event('b',SIDE[c]+' swaps '+NAMES[pa.t]+' and '+NAMES[pb.t]+' with Polarity');endTgt();return true;
  }
  if(t.kind==='turret'){
    G.b[sq]={id:uid++,t:'T',c,sh:3,aura:false,cs:false};G.inv[c].turret--;G.freshP.add(sq);G.fx.push({k:'turretup',sq});
    event('y',SIDE[c]+' deploys a turret on '+sqName(sq));endTgt();return true;
  }
  if(t.kind==='archer'){
    G.b[sq]={id:uid++,t:'A',c,aura:false,cs:false};G.inv[c].archer--;G.freshP.add(sq);G.fx.push({k:'turretup',sq});
    event('y',SIDE[c]+' deploys an archer on '+sqName(sq));endTgt();return true;
  }
  if(t.kind==='ram'){
    const rid=uid++;for(let k=0;k<1;k++){G.b[sq+k]={id:uid++,t:'W',c,rid,hp:3,part:k,aura:false,cs:false};G.freshP.add(sq+k);G.fx.push({k:'turretup',sq:sq+k});}
    G.inv[c].ram--;event('y',SIDE[c]+' deploys a battering ram on '+sqName(sq));endTgt();return true;
  }
  if(t.kind==='wall'){
    const run=wallRun(sq);for(const s of run){G.b[s]={id:uid++,t:'X',c:2,wl:true,aura:false,cs:false};G.freshP.add(s);G.fx.push({k:'shop',sq:s,col:'190,170,130'});}
    G.used[c].wall=true;event('y',SIDE[c]+' raises a wall of '+run.length+' block'+(run.length===1?'':'s'));endTgt();return true;
  }
  if(t.kind==='frost'){
    const r0=rowOf(sq),c0=colOf(sq);let n=0;
    for(let r=r0-1;r<=r0+1;r++)for(let col=c0-1;col<=c0+1;col++){
      if(r<0||r>=N||col<0||col>=N)continue;const s=r*N+col,p=G.b[s];G.fx.push({k:'frost',sq:s});
      if(canKill(p,c)){G.b[s]=Object.assign({},p,{fz:2});n++;}
    }
    G.used[c].frost=true;event('g','Winter’s Grasp freezes '+n+' enemy piece'+(n===1?'':'s'));endTgt();return true;
  }
  if(t.kind==='zhonya'){
    const p=G.b[sq];G.b[sq]=Object.assign({},p,{zh:2});G.fx.push({k:'frost',sq});
    G.used[c].zhonya=true;event('y',SIDE[c]+' '+NAMES[p.t]+' is frozen in time');endTgt();return true;
  }
  return false;
}
function autoTgt(){const t=G.tgt;if(!t)return;let best=null,bs=-1;
  for(const s of t.valid){const sc=t.kind==='deploy'?plusSpawn(t.c,s).length+Math.random():Math.random();if(sc>bs){bs=sc;best=s;}}
  if(best!=null)tgtClick(best);if(G.tgt&&G.tgt.kind==='blink')tgtClick(pick([...G.tgt.valid]));}
function cancelTgt(){const t=G.tgt;if(!t)return;if(t.forced)autoTgt();else G.tgt=null;}
function useAbility(id){
  const c=G.turn;
  if(id==='polarity'){if(!canShop()||G.inv[c].polarity<1)return false;return startTgt('polar',c,false);}
  if(id==='ram'){if(!canShop()||G.inv[c].ram<1)return false;return startTgt('ram',c,false);}
  if(id==='archer'){if(!canShop()||G.inv[c].archer<1)return false;return startTgt('archer',c,false);}
  if(id==='turret'){if(!canShop()||G.inv[c].turret<1)return false;return startTgt('turret',c,false);}
  if(!canShop()||!has(c,id)||G.used[c][id])return false;
  if(id==='chrono')return useChrono();
  return startTgt(id,c,false);
}
function useChrono(){
  const c=G.turn,n=G.hist.length;
  if(n<2||G.hist[n-2].turn!==c){toastFn('Nothing to rewind yet.','n');return false;}
  const s=G.hist[n-2],lm=G.last,cl=a=>a.map(z=>Object.assign({},z));
  G.b=s.b.map(p=>p&&Object.assign({},p));G.pw=s.pw.slice();G.ep=s.ep&&Object.assign({},s.ep);
  G.rezQ=cl(s.rezQ);G.meteors=cl(s.meteors);G.mines=cl(s.mines);G.last=s.last;G.hist.length=n-2;
  G.used[c].chrono=true;G.ban=lm?{c:1-c,f:lm.f,t:lm.t}:null;
  shopReset();G.fx=[];event('y',SIDE[c]+' rewinds time');refreshLegal();return true;
}
const matBal=(b,c)=>{let s=0;for(const p of b)if(p&&p.c<2&&p.t!=='K')s+=(p.c===c?1:-1)*VAL[p.t];return s;};
/* simple computer use of abilities; returns true when something fired */
function aiBoss(){
  const c=G.turn,B=G.boss;if(!B.on||G.bonus!=null||!canShop())return false;
  if(G.tgt||G.draft)return false;
  const hm=B.hits[c],ho=B.hits[1-c];
  const want=hm>=ho-1&&Math.random()<.65;
  if(!want)return false;
  refreshLegal();
  const cells=bossCells(B.sq),mv=G.legal.filter(m=>cells.includes(m.t)&&G.b[m.t]&&G.b[m.t].t==='Z'&&G.b[m.f]);
  if(!mv.length)return false;
  mv.sort((x,y)=>VAL[G.b[x.f].t]-VAL[G.b[y.f].t]);
  const cheap=mv[0],v=VAL[G.b[cheap.f].t];
  const lim=hm>=4?900:hm>=2?500:330;
  if(v>lim)return false;
  if(inCheck(stOf()))return false;
  play(cheap,'Q');return true;
}
function aiAbility(){
  const c=G.turn;if(!canShop())return false;
  const sum=(sq,pred)=>{let s=0;const r0=rowOf(sq),c0=colOf(sq);for(let r=r0-1;r<=r0+1;r++)for(let col=c0-1;col<=c0+1;col++){if(r<0||r>=N||col<0||col>=N)continue;const p=G.b[r*N+col];if(p&&pred(p))s+=VAL[p.t];}return s;};
  const best=(kind,score)=>{const t={kind,c,step:0};let b=-1,bs=0;for(const s of tgtValid(t)){const v=score(s);if(v>bs){bs=v;b=s;}}return[b,bs];};
  if(has(c,'meteor')&&!G.used[c].meteor){const[b,v]=best('meteor',s=>sum(s,p=>canKill(p,c))-sum(s,p=>p.c===c&&p.t!=='K')*1.5);if(b>=0&&v>=500&&startTgt('meteor',c,false))return tgtClick(b);}
  if(has(c,'frost')&&!G.used[c].frost){const[b,v]=best('frost',s=>sum(s,p=>canKill(p,c)));if(b>=0&&v>=800&&startTgt('frost',c,false))return tgtClick(b);}
  if(has(c,'zhonya')&&!G.used[c].zhonya){let b=-1,bs=0;for(let s=0;s<N*N;s++){const p=G.b[s];if(p&&p.c===c&&p.t!=='K'&&p.t!=='X'&&attacked(G.b,s,1-c)&&VAL[p.t]>bs&&VAL[p.t]>=500){bs=VAL[p.t];b=s;}}if(b>=0&&startTgt('zhonya',c,false))return tgtClick(b);}
  if(G.inv[c].turret>0){let b=-1,bs=0;for(const s of tgtValid({kind:'turret',c,step:0})){let sc=0;for(const dd of BOX5){const rr=rowOf(s)+dd[0],cc=colOf(s)+dd[1];if(rr<0||rr>=N||cc<0||cc>=N)continue;const q=G.b[rr*N+cc];if(q&&q.c===1-c&&q.c<2&&q.t!=='K')sc+=VAL[q.t];}if(attacked(G.b,s,1-c))sc-=250;if(sc>bs){bs=sc;b=s;}}if(b>=0&&startTgt('turret',c,false))return tgtClick(b);}
  if(G.inv[c].ram>0){const vs=[...tgtValid({kind:'ram',c,step:0})];if(vs.length&&startTgt('ram',c,false))return tgtClick(pick(vs));}
  if(G.inv[c].archer>0){const vs=[...tgtValid({kind:'archer',c,step:0})];if(vs.length){let b=vs[0],bs=-1e9;for(const s of vs){let sc=Math.random();for(const d of ORTH){for(let k=1;k<=4;k++){const rr=rowOf(s)+d[0]*k,cc=colOf(s)+d[1]*k;if(rr<0||rr>=N||cc<0||cc>=N)break;const q=G.b[rr*N+cc];if(q){if(q.c===1-c&&q.c<2&&q.t!=='K')sc+=VAL[q.t]/100;break;}}}if(attacked(G.b,s,1-c))sc-=3;if(sc>bs){bs=sc;b=s;}}if(startTgt('archer',c,false))return tgtClick(b);}}
  if(has(c,'chrono')&&!G.used[c].chrono){const n=G.hist.length;if(n>=2&&G.hist[n-2].turn===c&&matBal(G.b,c)<=matBal(G.hist[n-2].b,c)-450)return useChrono();}
  return false;
}

/* ===== Shop ===== */
function canShop(){return G&&!G.over&&!G.promo&&G.bonus==null&&!G.xt&&!G.draft&&!G.tgt;}
function chuteSpots(c){
  const k=kingSq(G.b,c),out=[];if(k<0)return out;
  for(let r=(c===0?5:0);r<(c===0?N:5);r++)for(let col=0;col<N;col++){
    const i=r*N+col;if(G.b[i]||G.pw[i]||onFire(i))continue;
    const b=G.b.slice();b[i]=b[k];b[k]=null;
    if(!attacked(b,i,1-c))out.push(i);
  }
  return out;
}
function rzSet(c){
  const s=new Set();for(const m of pseudo({b:G.b,ep:null,turn:1-c,ply:G.ply}))s.add(m.t);return s;
}
function shopReset(){G.sel=null;G.selMoves=[];G.lastKill=null;G.freshP=new Set();G.freshO=new Set();G.fx=[];}
function doChute(sq){
  const c=G.turn;
  if(!G.chute||G.gold[c]<price(c,'ch')||!chuteSpots(c).includes(sq))return false;
  shopReset();
  const k=kingSq(G.b,c);
  G.b[sq]=Object.assign({},G.b[k],{cs:false});G.b[k]=null;
  G.gold[c]-=price(c,'ch');G.cd[c].ch=cdOf(c,'ch');G.chute=false;G.last={f:k,t:sq};
  note(SIDE[c]+' king parachutes to '+sqName(sq));
  refreshLegal();return true;
}
function buy(k){
  const c=G.turn,g0=G.gold[c];
  if(!(k==='ch'&&G.chute)&&G.cd[c][k]>0){toastFn(ITEMS[k].name+' is on cooldown ('+G.cd[c][k]+' turns).','n');return false;}
  const r=buy0(k);
  if(r&&G.gold[c]<g0){bump(G.stats.buys[c],k);if(k!=='ch'&&CD[k])G.cd[c][k]=cdOf(c,k);}
  return r;
}
function buy0(k){
  const c=G.turn,it=ITEMS[k];
  if(!canShop()||G.gold[c]<price(c,k))return false;
  if(k==='ch'){
    if(G.chute){G.chute=false;return true;}
    if(!chuteSpots(c).length){toastFn('No safe square for the king right now.','n');return false;}
    G.chute=true;G.sel=null;G.selMoves=[];return true;
  }
  G.chute=false;
  if(k==='rz'){shopReset();G.gold[c]-=price(c,k);G.rz[c]=G.ply+20;event('r',SIDE[c]+' reveals the red zone');return true;}
  if(k==='hc'){
    const ks=kingSq(G.b,c),s=ks>=0?cloneSpot(ks,{t:'H'}):-1;
    if(s<0){toastFn('No room to summon a champion.','n');return false;}
    shopReset();G.gold[c]-=price(c,k);
    G.b[s]={id:uid++,t:'H',c,aura:false,cs:false,ttl:5};G.freshP.add(s);G.fx.push({k:'shop',sq:s,col:'255,200,90'});
    event('y',SIDE[c]+' summons a champion on '+sqName(s));refreshLegal();return true;
  }
  if(k==='ms'){
    const zone=[];{const [m0,m1]=midBand();for(let r=m0;r<=m1;r++)for(let col=0;col<N;col++){const i=r*N+col;if(!(G.b[i]&&G.b[i].c===c))zone.push(i);}}
    shopReset();G.gold[c]-=price(c,k);
    const hits=[];
    for(let n=0;n<5&&zone.length;n++){const j=rnd(zone.length),s=zone.splice(j,1)[0];hits.push(s);}
    let kills=0;
    for(const s of hits){
      G.fx.push({k:'missile',sq:s});
      const p=G.b[s];
      if(canKill(p,c)){G.b[s]=null;kills++;afterCapture(p,c,s);}
    }
    event('r',SIDE[c]+' fires missiles: '+kills+' enemy '+(kills===1?'piece':'pieces')+' destroyed');
    refreshLegal();return true;
  }
  if(k==='fo'){shopReset();G.gold[c]-=price(c,k);G.fort[c]=5;G.fx.push({k:'fort',sq:homeRow(c)*N+4+OFF(),c});event('y',SIDE[c]+' fortifies the home rank for 4 turns');refreshLegal();return true;}
  if(k==='sq'){
    const rows=c===0?[5+OFF(),9+OFF()]:[OFF(),4+OFF()],corners=[];for(const r of rows)for(const col of[OFF(),9+OFF()])corners.push(r*N+col);
    const cr=pick(corners),qp={t:'Q'};
    const s=(!G.b[cr]&&!G.pw[cr]&&!onFire(cr))?cr:cloneSpot(cr,qp);
    if(s<0){toastFn('No room to spawn a queen.','n');return false;}
    shopReset();G.gold[c]-=price(c,k);
    G.b[s]={id:uid++,t:'Q',c,aura:false,cs:false};G.pw[s]=null;G.freshP.add(s);G.fx.push({k:'queen',sq:s});
    event('y',SIDE[c]+' summons a queen on '+sqName(s));refreshLegal();return true;
  }
  if(k==='as'){shopReset();G.gold[c]-=price(c,k);ascendArmy(c);refreshLegal();return true;}
  if(k==='dk'){
    if(kcount(G.b,c)>=2){toastFn('You already have two kings.','n');return false;}
    const ks=kingSq(G.b,c),s=ks>=0?cloneSpot(ks,{t:'K'}):-1;
    if(s<0){toastFn('No room for a second king.','n');return false;}
    shopReset();G.gold[c]-=price(c,k);G.b[s]={id:uid++,t:'K',c,aura:false,cs:false,dk:true};G.pw[s]=null;G.freshP.add(s);G.fx.push({k:'queen',sq:s});
    event('y',SIDE[c]+' crowns a second king on '+sqName(s));refreshLegal();return true;
  }
  if(k==='sn'){
    shopReset();G.gold[c]-=price(c,k);sunderBoards();event('r',SIDE[c]+' sunders the board: every unit changes sides');refreshLegal();
    if(!G.legal.length)G.over=inCheck(stOf())?{type:'mate',winner:1-G.turn}:{type:'stalemate'};
    return true;
  }
  if(k==='rm'){shopReset();G.gold[c]-=price(c,k);G.inv[c].ram++;G.fx.push({k:'shop',sq:kingSq(G.b,c),col:'200,150,90'});event('g',SIDE[c]+' buys a battering ram. Deploy it from your inventory');refreshLegal();return true;}
  if(k==='ar'){shopReset();G.gold[c]-=price(c,k);G.inv[c].archer++;G.fx.push({k:'shop',sq:kingSq(G.b,c),col:'150,210,120'});event('g',SIDE[c]+' buys an archer. Place it from your inventory');refreshLegal();return true;}
  if(k==='bw'){
    const row=bulwarkRow(c),slots=[];for(let col=0;col<N;col++)if(!G.b[row*N+col]&&!onFire(row*N+col))slots.push(row*N+col);
    if(!slots.length){toastFn('Your pawn rank is already full.','n');return false;}
    shopReset();G.gold[c]-=price(c,k);
    for(const s of slots){G.b[s]=mk('P',c);G.freshP.add(s);G.fx.push({k:'shop',sq:s,col:'255,200,90'});}
    event('y',SIDE[c]+' raises a bulwark of '+slots.length+' pawns');refreshLegal();return true;
  }
  return false;
}
/* simple computer shopping: returns true when it bought something */
function aiShop(){
  const c=G.turn;if(!canShop())return false;
  const g=G.gold[c],rd=k=>!(G.cd[c][k]>0);
  if(rd('ch')&&g>=price(c,'ch')&&inCheck(stOf())){const s=chuteSpots(c);if(s.length){G.chute=true;return doChute(pick(s));}}
  const row=bulwarkRow(c);let empty=0;for(let col=0;col<N;col++)if(!G.b[row*N+col])empty++;
  if(rd('bw')&&g>=price(c,'bw')&&empty>=4)return buy('bw');
  if(rd('sq')&&g>=price(c,'sq'))return buy('sq');
  if(G.fort[c]<=0&&G.ply>=OPEN_FORT&&rd('fo')&&g>=price(c,'fo')){const hr=homeRow(c);let thr=0;for(let i=0;i<N*N;i++){const p=G.b[i];if(p&&p.c===1-c&&p.t!=='P'&&p.t!=='K'&&p.c<2&&Math.abs(rowOf(i)-hr)<=3)thr++;}if(thr>=2)return buy('fo');}
  if(rd('hc')&&g>=price(c,'hc')&&Math.random()<.5)return buy('hc');
  if(rd('ms')&&g>=price(c,'ms')){let n=0;{const [m0,m1]=midBand();for(let r=m0;r<=m1;r++)for(let col=0;col<N;col++){const p=G.b[r*N+col];if(canKill(p,c))n++;}}if(n>=3)return buy('ms');}
  return false;
}
