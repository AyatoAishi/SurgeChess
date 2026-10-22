/* ===== Engine (no DOM). 10x10 board, index = row*10+col, row 0 = rank 10 (black side). ===== */
let N=10;
const FILES='abcdefghijklmnopqrstuvwxyz';
/* Board geometry: everything is derived from N so the arena can grow (Upscale). The original 10x10 setup always sits centred. */
const OFF=()=>(N-10)>>1;
const HALF=()=>N>>1;
const homeRow=c=>c===0?N-1-OFF():OFF();
const pawnRow=c=>c===0?N-2-OFF():1+OFF();
const fireLo=()=>(N-8)>>1;
const midBand=()=>[HALF()-2,HALF()+1];
const orbBand=()=>[HALF()-3,HALF()+2];
const ownRows=c=>c===0?[HALF(),N-1]:[0,HALF()-1];
const setN=n=>{N=n;};
const kcount=(b,c)=>{let n=0;for(let i=0;i<N*N;i++){const p=b[i];if(p&&p.t==='K'&&p.c===c)n++;}return n;};
const NAMES={W:'battering ram',A:'archer',Z:'boss',T:'turret',P:'pawn',N:'knight',B:'bishop',R:'rook',Q:'queen',K:'king',M:'commander',C:'commander',H:'champion',X:'rock'};
const VAL={W:0,A:340,Z:0,T:300,P:100,N:320,B:335,R:500,Q:900,K:0,M:620,C:620,H:330,X:0};
const BOX5=[];for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)if(a||b)BOX5.push([a,b]);
const KN=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
const KG=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const DIAG=[[-1,-1],[-1,1],[1,-1],[1,1]];
const ORTH=[[-1,0],[1,0],[0,-1],[0,1]];
const MATE=100000;
const ENG={cp:[false,false],ag:[false,false],ply:99,wake:0,fire:false,bossHit:false};   // augment flags read by move generation   // augment flags read by move generation
const hit=(q,me)=>q.c!==me&&q.t!=='X'&&!(q.t==='Z'&&!ENG.bossHit)&&!q.zh&&!(q.inv>0);
const sleeping=q=>q.t==='M'&&ENG.ply<ENG.wake;
const live=(q,by)=>q&&q.c===by&&!q.fz&&!q.zh&&!(q.inv>0)&&!sleeping(q);
const isEdgeSq=i=>{const c=i%N,lo=(N-8)>>1;return c<lo||c>=N-lo;};
/* Commander: lands on the outer ring of its 5x5 box; needs an unoccupied route through the inner 3x3. */
function lPathClear(b,r,c,dr,dc){
  const at=(rr,cc)=>{const q=b[rr*N+cc];return q&&!(q.inv>0)?q:null;};
  const rs=[Math.floor(dr/2),Math.ceil(dr/2)],cs=[Math.floor(dc/2),Math.ceil(dc/2)];
  for(const a of rs)for(const k of cs)if(!at(r+a,c+k))return true;
  return false;
}
function lPathClearOld(b,r,c,dr,dc){
  const lr=Math.abs(dr)===2,sr=Math.sign(dr),sc=Math.sign(dc);
  const at=(rr,cc)=>{const q=b[rr*N+cc];return q&&!(q.inv>0)?q:null;};
  if(lr){
    if(!at(r+sr,c)&&!at(r+dr,c))return true;
    if(!at(r,c+dc)&&!at(r+sr,c+dc))return true;
  }else{
    if(!at(r,c+sc)&&!at(r,c+dc))return true;
    if(!at(r+dr,c)&&!at(r+dr,c+sc))return true;
  }
  return false;
}
let uid=1;
const mk=(t,c,cs)=>({id:uid++,t,c,aura:false,cs:!!cs});
const rowOf=i=>(i/N)|0;
const colOf=i=>i%N;
const sqName=i=>FILES[colOf(i)]+(N-rowOf(i));
const rnd=n=>Math.floor(Math.random()*n);
const pick=a=>a[rnd(a.length)];
const isLeaper=t=>t==='N';
const SLMAX={B:7,R:8};   // slide caps: bishop 7, rook 8, queen unlimited
const CRING=BOX5.filter(d=>Math.abs(d[0])===2||Math.abs(d[1])===2);

function newBoard(){
  const b=Array(N*N).fill(null),back=['R','N','B','M','Q','K','M','B','N','R'];
  for(let c=0;c<N;c++){
    const cs=back[c]==='R'||back[c]==='K';
    b[c]=mk(back[c],1,cs);b[N+c]=mk('P',1);
    b[(N-2)*N+c]=mk('P',0);b[(N-1)*N+c]=mk(back[c],0,cs);
  }
  return b;
}
function kingSq(b,c){for(let i=0;i<N*N;i++){const p=b[i];if(p&&p.t==='K'&&p.c===c)return i;}return -1;}

function attacked(b,sq,by){
  const r=rowOf(sq),c=colOf(sq),pr=r-(by===0?-1:1);
  if(pr>=0&&pr<N)for(let dc=-1;dc<=1;dc+=2){const pc=c+dc;if(pc>=0&&pc<N){const q=b[pr*N+pc];if(live(q,by)&&q.t==='P')return true;}}
  for(const d of KN){const rr=r+d[0],cc=c+d[1];if(rr>=0&&rr<N&&cc>=0&&cc<N){const q=b[rr*N+cc];if(live(q,by)&&q.t==='N')return true;}}
  for(const d of CRING){const rr=r+d[0],cc=c+d[1];if(rr>=0&&rr<N&&cc>=0&&cc<N){const q=b[rr*N+cc];if(live(q,by)&&q.t==='M'&&lPathClear(b,rr,cc,-d[0],-d[1]))return true;}}
  for(const d of ORTH){let rr=r+d[0],cc=c+d[1],k=1;while(k<=4&&rr>=0&&rr<N&&cc>=0&&cc<N){const q=b[rr*N+cc];if(q&&!(q.inv>0)){if(live(q,by)&&q.t==='A')return true;break;}rr+=d[0];cc+=d[1];k++;}}
  for(const d of KG){const rr=r+d[0],cc=c+d[1];if(rr>=0&&rr<N&&cc>=0&&cc<N){const q=b[rr*N+cc];if(live(q,by)&&(q.t==='K'||(ENG.ag[by]&&(q.t==='R'||q.t==='B'))))return true;}}
  for(const d of DIAG){let rr=r+d[0],cc=c+d[1],k=1;while(rr>=0&&rr<N&&cc>=0&&cc<N){const q=b[rr*N+cc];if(q&&!(q.inv>0)){if(live(q,by)&&((q.t==='B'&&k<=7)||q.t==='Q'))return true;break;}rr+=d[0];cc+=d[1];k++;}}
  for(const d of ORTH){let rr=r+d[0],cc=c+d[1],k=1;while(rr>=0&&rr<N&&cc>=0&&cc<N){const q=b[rr*N+cc];if(q&&!(q.inv>0)){if(live(q,by)&&((q.t==='R'&&k<=8)||q.t==='Q'))return true;break;}rr+=d[0];cc+=d[1];k++;}}
  return false;
}

/* move = {f,t,cs (captured square),fl: 0 normal|1 double step|2 en passant|3 castle short|4 castle long, pr: promotion} */
function pseudo(S){
  ENG.ply=S.ply==null?99:S.ply;
  const b=S.b,ep=S.ep,me=S.turn,out=[];
  const add=(f,t,o)=>out.push(Object.assign({f,t,cs:t,fl:0,pr:false},o));
  for(let i=0;i<N*N;i++){
    const p=b[i];if(!p||p.c!==me||p.fz||p.zh||sleeping(p))continue;
    const r=rowOf(i),c=colOf(i),t0=p.t,hp=q=>hit(q,me)&&!(p.inv>0&&q.t==='K')&&!(q.t==='Z'&&(p.t==='K'||p.t==='T'));
    if(t0==='P'){
      const d=me===0?-1:1,start=pawnRow(me),last=me===0?0:N-1,r1=r+d;
      if(r1<0||r1>=N)continue;
      const f1=r1*N+c;
      if(b[f1]&&b[f1].t==='Z'&&ENG.bossHit)add(i,f1);
      if(!b[f1]){
        add(i,f1,{pr:r1===last});
        const r2=r1+d;
        if((r===start||ENG.cp[me])&&r2>=0&&r2<N&&!b[f1+d*N])add(i,f1+d*N,{fl:1,pr:r2===last});
      }
      for(let dc=-1;dc<=1;dc+=2){
        const cc=c+dc;if(cc<0||cc>=N)continue;
        const t=r1*N+cc,q=b[t];
        if(q&&hp(q))add(i,t,{pr:r1===last});
        else if(!q&&ep&&ep.c!==me&&ep.sq===t){const cs=r*N+cc;if(b[cs]&&b[cs].t==='P'&&b[cs].c!==me)add(i,t,{cs,fl:2});}
      }
      continue;
    }
    if(t0==='T'||t0==='W')continue;
    if(t0==='A'){
      for(const d of ORTH){
        const r1=r+d[0],c1=c+d[1];
        if(r1>=0&&r1<N&&c1>=0&&c1<N&&!b[r1*N+c1])add(i,r1*N+c1);
        for(let k=1;k<=4;k++){const rr=r+d[0]*k,cc=c+d[1]*k;if(rr<0||rr>=N||cc<0||cc>=N)break;const t=rr*N+cc,q=b[t];if(!q||q.inv>0)continue;if(q.t!=='Z'&&hp(q))add(i,t,{fl:6});break;}
      }
      continue;
    }
    if(t0==='H'){
      for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){const rr=r+dr,cc=c+dc;if((!dr&&!dc)||rr<0||rr>=N||cc<0||cc>=N)continue;const t=rr*N+cc,q=b[t];if(!q||(hp(q)&&q.t!=='K'))add(i,t);}
    }
    if(t0==='M'){for(const d of CRING){const rr=r+d[0],cc=c+d[1];if(rr<0||rr>=N||cc<0||cc>=N)continue;const t=rr*N+cc,q=b[t];if(!lPathClear(b,r,c,d[0],d[1]))continue;if(!q||hp(q))add(i,t);}}
    if(isLeaper(t0)||t0==='K'){
      for(const d of(t0==='K'?KG:KN)){const rr=r+d[0],cc=c+d[1];if(rr<0||rr>=N||cc<0||cc>=N)continue;const t=rr*N+cc,q=b[t];if(t0==='K'&&ENG.fire&&isEdgeSq(t))continue;if(!q||hp(q))add(i,t);}
    }
    if(t0==='K'&&p.cs&&!attacked(b,i,1-me)){
      const o=OFF(),row=r*N+o,rk=b[row+9],rq=b[row];
      if(rk&&rk.t==='R'&&rk.c===me&&rk.cs&&!b[row+6]&&!b[row+7]&&!b[row+8]&&!attacked(b,row+6,1-me)&&!attacked(b,row+7,1-me))add(i,row+7,{fl:3});
      if(rq&&rq.t==='R'&&rq.c===me&&rq.cs&&!b[row+1]&&!b[row+2]&&!b[row+3]&&!b[row+4]&&!attacked(b,row+4,1-me)&&!attacked(b,row+3,1-me))add(i,row+3,{fl:4});
    }
    const dirs=t0==='B'?DIAG:t0==='R'?ORTH:t0==='Q'?DIAG.concat(ORTH):null,mx=SLMAX[t0]||99;
    if(dirs)for(const d of dirs){let rr=r+d[0],cc=c+d[1],k=1;while(k<=mx&&rr>=0&&rr<N&&cc>=0&&cc<N){k++;const t=rr*N+cc,q=b[t];if(!q)add(i,t);else if(!(q.inv>0)){if(hp(q))add(i,t);break;}rr+=d[0];cc+=d[1];}}
    if(ENG.ag[me]&&(t0==='R'||t0==='B'))for(const d of(t0==='R'?DIAG:ORTH)){const rr=r+d[0],cc=c+d[1];if(rr<0||rr>=N||cc<0||cc>=N)continue;const t=rr*N+cc,q=b[t];if(!q||hp(q))add(i,t);}
  }
  return out;
}

/* Pure move application (no powerup effects). Returns a new state plus what was captured. */
function applyCore(S,m,promoT){
  const b=S.b.slice(),p=b[m.f];
  if(m.fl===5||m.fl===6){const captured=b[m.t]||null;b[m.t]=null;return{b,ep:null,captured,piece:p,turn:1-S.turn,ply:S.ply==null?undefined:S.ply+1};}
  const captured=b[m.cs]||null;
  b[m.cs]=null;b[m.f]=null;
  let np=p.cs?Object.assign({},p,{cs:false}):p;
  if(captured&&np.inv>0)np=Object.assign({},np,{inv:0});
  if(m.pr)np=Object.assign({},np,{t:promoT||'Q'});
  b[m.t]=np;
  let ep=null;
  if(m.fl===1)ep={sq:(m.f+m.t)/2,c:p.c};
  if(m.fl===3){const rf=rowOf(m.t)*N+9+OFF(),rk=b[rf];b[rf]=null;b[m.t-1]=Object.assign({},rk,{cs:false});}
  if(m.fl===4){const rf=rowOf(m.t)*N+OFF(),rk=b[rf];b[rf]=null;b[m.t+1]=Object.assign({},rk,{cs:false});}
  return{b,ep,captured,piece:np,turn:1-S.turn,ply:S.ply==null?undefined:S.ply+1};
}
function legal(S){
  const out=[],me=S.turn,pl=S.ply==null?99:S.ply,two=kcount(S.b,me)>=2;
  for(const m of pseudo(S)){
    ENG.ply=pl;
    const r=applyCore(S,m,'Q'),k=kingSq(r.b,me);
    if(two||(k>=0&&!attacked(r.b,k,1-me)))out.push(m);
  }
  return out;
}
function inCheck(S){if(kcount(S.b,S.turn)>=2)return false;const k=kingSq(S.b,S.turn);return k>=0&&attacked(S.b,k,1-S.turn);}

/* Where a charged piece can come back: empty squares on its own 5 ranks that do not attack the capturer's king. */
const RO=c=>{const h=homeRow(c),s=c===0?-1:1;return[h+s,h+2*s,h,h+3*s,h+4*s];},CO=()=>[4,5,3,6,2,7,1,8,0,9].map(x=>x+OFF());
function respawnCands(b,piece,tKing,pw){
  const out=[];
  for(const r of RO(piece.c)){
    if(piece.t==='P'&&(r===0||r===N-1))continue;
    for(const c of CO()){
      const i=r*N+c;if(b[i]||(pw&&pw[i])||(ENG.fire&&isEdgeSq(i)))continue;
      b[i]=piece;const bad=tKing>=0&&attacked(b,tKing,piece.c);b[i]=null;
      if(!bad)out.push(i);
    }
  }
  return out;
}
/* Search version: respawn is deterministic (first candidate). */
function searchApply(S,m,promoT){
  const r=applyCore(S,m,promoT);
  if(r.captured&&r.captured.aura){
    const c=respawnCands(r.b,r.captured,kingSq(r.b,S.turn),null);
    if(c.length)r.b[c[0]]=Object.assign({},r.captured,{aura:false,cs:false});
  }
  return r;
}

/* ===== Evaluation + search ===== */
function evalSt(S){
  let s=0;
  for(let i=0;i<N*N;i++){
    const p=S.b[i];if(!p||p.t==='X')continue;
    const r=rowOf(i),c=colOf(i);
    let v=VAL[p.t];
    if(p.aura)v+=VAL[p.t]*0.35;
    const mid=(N-1)/2,cen=Math.max(0,4.5-Math.max(Math.abs(r-mid),Math.abs(c-mid)));
    if(p.t==='P'){const adv=p.c===0?pawnRow(0)-r:r-pawnRow(1);v+=adv*6+cen*3;}
    else if(p.t==='N'||p.t==='B'||p.t==='M')v+=cen*7;
    else if(p.t==='Q')v+=cen*2;
    else if(p.t==='K'){const home=r===homeRow(p.c);v+=home?15:-10;}
    s+=p.c===0?v:-v;
  }
  return S.turn===0?s:-s;
}
function order(S,ms){
  return ms.map(m=>{const t=S.b[m.cs];let s=0;if(t)s=10*VAL[t.t]-VAL[S.b[m.f].t]/10;if(m.pr)s+=800;return[s,m];}).sort((a,b)=>b[0]-a[0]).map(x=>x[1]);
}
let nodes=0,limit=0,aborted=false;
function negamax(S,d,alpha,beta){
  if(++nodes>limit){aborted=true;return 0;}
  if(d<=0)return evalSt(S);
  const ms=legal(S);
  if(!ms.length)return inCheck(S)?-(MATE+d):0;
  let best=-1e9;
  for(const m of order(S,ms)){
    const sc=-negamax(searchApply(S,m,'Q'),d-1,-beta,-alpha);
    if(aborted)return 0;
    if(sc>best){best=sc;if(sc>alpha)alpha=sc;}
    if(alpha>=beta)break;
  }
  return best;
}
/* AI strength 1..10 (old names: easy=2, normal=5, hard=8). Depth, node budget and pick tolerance all scale with it. */
const LV_D=[1,1,1,1,2,3,3,4,4,5,5],LV_LIM=[6000,3000,6000,6000,15000,40000,60000,100000,200000,300000,450000],LV_TOL=[80,260,160,80,50,20,10,4,0,0,0];
const lvNum=l=>typeof l==='number'?Math.max(1,Math.min(10,Math.round(l))):({easy:2,normal:5,hard:8})[l]||5;
/* AI root. onlySq restricts to one piece (red-orb bonus move). Returns {m, skip} or null. */
function aiPick(S,level,onlySq,pw,noCap){
  let moves=legal(S).filter(m=>!(S.b[m.t]&&S.b[m.t].t==='K'&&kcount(S.b,1-S.turn)<2)&&!(S.b[m.cs]&&S.b[m.cs].ft)&&!(noCap&&S.b[m.cs]));
  if(ENG.hot&&ENG.hot.length){const sf=moves.filter(m=>!ENG.hot.includes(m.t)||(S.b[m.f]&&S.b[m.f].t==='K'));if(sf.length)moves=sf;}
  if(ENG.fire){const safe=moves.filter(m=>!isEdgeSq(m.t)||m.pr);if(safe.length)moves=safe;}
  if(onlySq!=null)moves=moves.filter(m=>m.f===onlySq);
  if(!moves.length)return null;
  const LN=lvNum(level),maxD=LV_D[LN];
  limit=LV_LIM[LN];nodes=0;aborted=false;
  const bo=m=>{const g0=(ENG.gm&&ENG.gm.includes(m.t))?35:0,k=pw[m.t],p=S.b[m.f];if(!k||p.t==='K')return g0;const v=VAL[p.t];return g0+(k==='y'?v*0.3:k==='g'?v*0.7:45);};
  let scored=order(S,moves).map(m=>({m,s:0}));
  for(let d=1;d<=maxD;d++){
    const cur=[],ab=LN>=8;let alpha=-1e9;
    for(const e of scored){
      const b=bo(e.m);
      const sc=-negamax(searchApply(S,e.m,'Q'),d-1,-1e9,ab?-(alpha-b):1e9)+b;
      if(aborted)break;
      cur.push({m:e.m,s:sc});if(sc>alpha)alpha=sc;
    }
    if(aborted||cur.length<scored.length)break;
    scored=cur.sort((a,b)=>b.s-a.s);
  }
  scored.sort((a,b)=>b.s-a.s);
  const top=scored[0].s,tol=LV_TOL[LN];
  const m=LN>=8?scored[0].m:pick(scored.filter(e=>e.s>=top-tol)).m;
  let skip=false;
  if(onlySq!=null){
    nodes=0;aborted=false;limit=40000;
    const sk=-negamax({b:S.b,ep:S.ep,turn:1-S.turn,ply:S.ply},Math.max(0,maxD-1),-1e9,1e9);
    skip=!aborted&&sk>=top;
  }
  return{m,skip};
}

function legalH(S){ENG.bossHit=true;try{return legal(S);}finally{ENG.bossHit=false;}}
