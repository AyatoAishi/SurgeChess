/* ===== Humanoid rig: articulated people instead of statues on pedestals ===== */
const RIGP=new Set(['P','N','B','R','Q','K','M','C','H','A']);
const RD={legU:.44,legL:.44,hipY:.92,torsoH:.62,armU:.36,armL:.34,shX:.4,hipX:.19};
const RPROF={
  P:{s:.9,w:.88,helm:'kettle',wep:'short',shield:'buckler',cape:0,light:1},
  N:{s:1.0,w:1.0,helm:'knight',wep:'sword',cape:.7,mount:1},
  B:{s:1.0,w:.92,helm:'mitre',wep:'staff',robe:1,cape:0},
  R:{s:1.1,w:1.32,helm:'great',wep:'hammer',shield:'tower',cape:0,heavy:1},
  Q:{s:1.05,w:.9,helm:'crown',wep:'rapier',cape:1.2,elegant:1},
  K:{s:1.16,w:1.16,helm:'bigcrown',wep:'greatsword',cape:1.25,heavy:1},
  M:{s:1.08,w:1.2,helm:'commander',wep:'halberd',cape:.6,heavy:1},
  C:{s:1.05,w:.94,helm:'hood',wep:'scimitar',robe:1,cape:.5,rune:1},
  A:{s:.98,w:.86,helm:'hood',wep:'bow',cape:.5,light:1},
  H:{s:1.08,w:1.1,helm:'champ',wep:'glowsword',cape:.9,gold:1}
};
function rigMats(P,c){
  const W=c===0;
  return Object.assign({},P,{
    skin:new THREE.MeshStandardMaterial({color:W?0xe8c4a2:0xc89878,roughness:.7,metalness:0,envMapIntensity:.2}),
    hair:new THREE.MeshStandardMaterial({color:W?0x6a4a2a:0x14110f,roughness:.8,metalness:0}),
    leather:new THREE.MeshStandardMaterial({color:W?0x6b4a2e:0x2a1a16,roughness:.85,metalness:0,envMapIntensity:.2}),
    coat:new THREE.MeshStandardMaterial({color:W?0xe6dfcf:0x2d2528,roughness:.8,metalness:0,envMapIntensity:.2}),
    mane:new THREE.MeshStandardMaterial({color:W?0x8d7d66:0x120e10,roughness:.85,metalness:0})
  });
}
function rgLimb(m,r1,r2,len,seg){const o=G3.cyl(m,r1,r2,len,seg||10);o.position.y=-len/2;return o;}
function rgWeapon(kind,P){
  const g=new THREE.Group(),add=(o,x,y,z,rx,ry,rz)=>put(g,o,x,y,z,rx,ry,rz);
  const hilt=(len=.2)=>{add(G3.cyl(P.leather,.032,.032,len,8),0,len*.3,0);add(G3.sph(P.trim,.045,10,8),0,-.05,0);};
  const guard=(w,y)=>add(G3.box(P.trim,w,.05,.075),0,y,0);
  if(kind==='short'||kind==='sword'||kind==='glowsword'||kind==='greatsword'){
    const L=kind==='short'?.5:kind==='sword'?.82:kind==='greatsword'?1.3:.95,W=kind==='greatsword'?.13:kind==='short'?.07:.085;
    hilt(kind==='greatsword'?.3:.22);guard(kind==='greatsword'?.4:.26,.14);
    const bm=kind==='glowsword'?P.glow:P.steel;
    add(G3.box(bm,W,L,.022),0,.16+L/2,0);add(G3.cone(bm,W*.62,.16,4),0,.16+L+.07,0,0,Math.PI/4,0).scale.set(1,1,.3);
    add(G3.box(P.dark,.02,L*.9,.026),0,.16+L/2,0);
  }else if(kind==='rapier'){
    hilt(.2);add(G3.tor(P.trim,.09,.012,16),0,.12,0,Math.PI/2);guard(.22,.13);add(G3.box(P.steel,.035,1.05,.016),0,.14+.52,0);add(G3.cone(P.steel,.02,.1,6),0,.14+1.08,0);
  }else if(kind==='scimitar'){
    hilt(.2);guard(.2,.13);
    const segs=[[0,.3,.0,.05],[.04,.3,.1,.0],[.14,.28,.2,-.2],[.27,.22,.3,-.4]];let y=.14,z=0;
    for(const[,l,,a]of segs){add(G3.box(P.steel,.075,l,.02),0,y+l/2,z,a,0,0);y+=l*.95;z+=Math.sin(-a)*l*.5;}
    add(G3.box(P.glow,.012,.8,.024),0,.14+.4,.02);
  }else if(kind==='hammer'){
    add(G3.cyl(P.leather,.04,.04,1.0,8),0,.32,0);add(G3.box(P.steel,.34,.26,.26),0,.88,0);add(G3.box(P.trim,.36,.06,.28),0,.88,0);add(G3.cone(P.steel,.1,.2,6),0,1.08,0);
  }else if(kind==='staff'){
    add(G3.cyl(P.gold,.035,.035,1.6,8),0,.5,0);add(G3.tor(P.gold,.12,.02,16),0,1.35,0,Math.PI/2);add(G3.sph(P.glow,.1,12,10),0,1.35,0);add(G3.cone(P.gold,.05,.14,6),0,-.38,0,Math.PI);
  }else if(kind==='bow'){
    add(G3.cyl(P.leather,.035,.035,.22,8),0,.1,0);
    for(const sy of[1,-1]){add(G3.box(P.leather,.04,.4,.05),0,.1+sy*.28,-.1,sy*.38,0,0);add(G3.box(P.leather,.04,.3,.05),0,.1+sy*.55,-.28,sy*.85,0,0);}
    add(G3.box(P.steel,.012,1.0,.012),0,.1,-.34);
  }else if(kind==='halberd'){
    add(G3.cyl(P.leather,.035,.035,1.7,8),0,.55,0);add(G3.cone(P.steel,.06,.3,6),0,1.5,0);add(G3.box(P.steel,.3,.28,.03),.15,1.28,0);add(G3.box(P.trim,.07,.2,.04),0,1.18,0);
    const fl=G3.box(P.trim,.02,.34,.3);add(fl,0,1.12,-.17);
  }
  return g;
}
function rgShield(kind,P){
  const g=new THREE.Group();
  if(kind==='buckler'){const d=G3.cyl(P.armor2,.2,.2,.045,18);d.rotation.x=Math.PI/2;g.add(d);const r=G3.tor(P.trim,.2,.018,20);g.add(r);g.add(put(g,G3.sph(P.steel,.055,10,8),0,0,.04));}
  else{g.add(G3.box(P.armor2,.5,.78,.06));put(g,G3.box(P.trim,.54,.06,.08),0,.39,0);put(g,G3.box(P.trim,.54,.06,.08),0,-.39,0);put(g,G3.box(P.trim,.06,.78,.08),0,0,0);put(g,G3.sph(P.glow,.07,10,8),0,0,.05);}
  return g;
}
function rgHelm(kind,P,head){
  const add=(o,x,y,z,rx,ry,rz)=>put(head,o,x,y,z,rx,ry,rz);
  const eyes=()=>{for(const sx of[-1,1])add(G3.sph(P.glow,.026,8,6),sx*.075,.23,.178);};
  add(G3.sph(P.skin,.2,16,12),0,.22,0);
  if(kind==='kettle'){add(G3.sph(P.armor2,.225,16,10),0,.27,0).scale.set(1,.78,1);add(G3.cyl(P.armor2,.33,.33,.025,20),0,.22,0);add(G3.box(P.dark,.07,.2,.04),0,.18,.2);eyes();add(G3.sph(P.hair,.06,8,6),0,.12,-.17);}
  else if(kind==='knight'){add(G3.sph(P.armor,.235,16,12),0,.23,0);add(G3.box(P.dark,.27,.05,.06),0,.25,.2);add(G3.box(P.dark,.05,.2,.05),0,.2,.215);
    for(let k=0;k<4;k++)add(G3.sph(P.trim,.07-k*.008,8,6),0,.46-k*.03,-.04-k*.1).scale.set(.7,1,1.3);add(G3.box(P.trim,.04,.1,.3),0,.45,-.06);}
  else if(kind==='mitre'){add(G3.cone(P.cloth,.19,.5,4),0,.6,0,0,Math.PI/4,0);add(G3.cone(P.trim,.2,.12,4),0,.4,0,0,Math.PI/4,0);add(G3.box(P.gold,.04,.17,.03),0,.62,.17);add(G3.box(P.gold,.11,.04,.03),0,.64,.17);eyes();add(G3.sph(P.hair,.18,10,8),0,.28,-.07).scale.set(1,.7,.8);}
  else if(kind==='great'){add(G3.box(P.armor,.42,.44,.42),0,.24,0);add(G3.box(P.dark,.3,.045,.06),0,.27,.215);add(G3.box(P.dark,.05,.22,.05),0,.2,.215);
    for(const[x,z]of[[-.16,-.16],[.16,-.16],[-.16,.16],[.16,.16]])add(G3.box(P.armor2,.1,.1,.1),x,.5,z);add(G3.box(P.trim,.44,.05,.44),0,.44,0);}
  else if(kind==='crown'||kind==='bigcrown'){const bg=kind==='bigcrown'?1.25:1;eyes();add(G3.cyl(P.gold,.2*bg,.17*bg,.1*bg,14),0,.42,0);
    for(let k=0;k<7;k++){const a=k/7*6.283;add(G3.cone(P.gold,.035*bg,.17*bg,5),Math.cos(a)*.18*bg,.54*bg+.02,Math.sin(a)*.18*bg);add(G3.sph(P.glow,.022,6,5),Math.cos(a)*.18*bg,.65*bg+.02,Math.sin(a)*.18*bg);}
    add(G3.sph(P.hair,.215,12,10),0,.25,-.05).scale.set(1,.85,.9);if(kind==='bigcrown')add(G3.sph(P.hair,.1,8,6),0,.08,.14).scale.set(1.3,1,.7);}
  else if(kind==='commander'){add(G3.sph(P.armor,.235,16,12),0,.23,0);add(G3.box(P.dark,.27,.05,.06),0,.25,.2);
    add(G3.box(P.trim,.05,.3,.34),0,.5,-.02);for(const sx of[-1,1])add(G3.cone(P.trim,.06,.34,6),sx*.25,.4,0,0,0,-sx*.9);}
  else if(kind==='hood'){add(G3.sph(P.cloth,.26,16,12),0,.24,-.02).scale.set(1,1.05,1.05);add(G3.cone(P.cloth,.16,.3,8),0,.46,-.12,-.5);add(G3.sph(P.dark,.17,12,10),0,.22,.07);eyes();add(G3.box(P.glow,.18,.02,.02),0,.15,.19);}
  else if(kind==='champ'){add(G3.sph(P.gold,.235,16,12),0,.23,0);add(G3.box(P.glow,.27,.05,.06),0,.25,.2);add(G3.tor(P.glow,.3,.018,28),0,.62,0,Math.PI/2);
    for(const sx of[-1,1])add(G3.box(P.gold,.04,.34,.2),sx*.24,.42,-.04,0,0,-sx*.5);}
}
/* ---- mount: horse segments (each is a group whose origin is its joint pivot) ---- */
const HORSE_SEG=['hbody','hneck','hhead','htail','hlf','hlfL','hrf','hrfL','hlb','hlbL','hrb','hrbL'];
const HZ=-.18,HY=.74,HK=1.0;
const HORSE_REST={hbody:[0,0,0],hneck:[0,.94,.42+HZ],hhead:[0,.42,.5],htail:[0,.9,-.55+HZ],hlf:[.17,HY,.34+HZ],hrf:[-.17,HY,.34+HZ],hlb:[.17,HY,-.36+HZ],hrb:[-.17,HY,-.36+HZ],hlfL:[0,-.34,0],hrfL:[0,-.34,0],hlbL:[0,-.34,0],hrbL:[0,-.34,0]};
function rigHorse(S,P){
  const C=P.coat,Mn=P.mane,hb=S.hbody;
  for(const n of HORSE_SEG)S[n].scale.setScalar(HK);
  put(hb,G3.sph(C,1,16,12),0,.84,HZ).scale.set(.27,.27,.64);
  put(hb,G3.sph(C,1,12,10),0,.86,.4+HZ).scale.set(.26,.29,.3);
  put(hb,G3.sph(C,1,12,10),0,.85,-.4+HZ).scale.set(.27,.28,.3);
  put(hb,G3.box(P.cloth,.58,.05,.5),0,1.08,HZ-.04);
  put(hb,G3.box(P.leather,.3,.07,.36),0,1.13,HZ-.04);
  for(const sx of[-1,1]){put(hb,G3.box(P.cloth,.035,.34,.46),sx*.275,.86,HZ-.04);put(hb,G3.box(P.trim,.04,.03,.48),sx*.275,.69,HZ-.04);put(hb,G3.box(P.leather,.04,.3,.05),sx*.3,.82,HZ+.02);}
  put(hb,G3.box(P.armor,.34,.3,.07),0,.9,.66+HZ,-.35);put(hb,G3.box(P.trim,.36,.04,.09),0,1.04,.62+HZ,-.35);
  const hn=S.hneck,hh=S.hhead,ht=S.htail;
  put(hn,G3.cyl(C,.11,.17,.64,10),0,.21,.24,.85);
  put(hn,G3.box(Mn,.05,.56,.07),0,.24,.17,.85);
  put(hn,G3.box(P.armor2,.3,.16,.16),0,.08,.1,.85);
  const sk=new THREE.Group();sk.rotation.x=.6;hh.add(sk);
  put(sk,G3.box(C,.17,.2,.34),0,0,.13);put(sk,G3.box(C,.12,.14,.2),0,-.01,.34);put(sk,G3.box(P.dark,.115,.03,.05),0,-.07,.44);
  for(const sx of[-1,1]){put(sk,G3.cone(C,.04,.14,5),sx*.065,.13,-.02,-.2,0,sx*.2);put(sk,G3.sph(P.glow,.022,6,5),sx*.092,.04,.1);}
  put(sk,G3.box(Mn,.06,.1,.12),0,.12,.06);put(sk,G3.box(P.trim,.19,.03,.2),0,.1,.22);
  put(ht,G3.cone(Mn,.075,.55,6),0,-.24,-.1,Math.PI+.35);
  for(const[k,sx,fr]of[['lf',1,1],['rf',-1,1],['lb',1,0],['rb',-1,0]]){
    const U=S['h'+k],L=S['h'+k+'L'];
    put(U,G3.cyl(C,.085,.06,.36,10),0,-.17,0);put(U,G3.sph(C,.085,10,8),0,0,0);
    put(L,G3.cyl(C,.052,.045,.34,8),0,-.17,fr?0:.01);put(L,G3.box(P.dark,.1,.09,.13),0,-.37,.015);put(L,G3.box(Mn,.07,.07,.07),0,-.28,-.04);
  }
}
/* builds every moving segment as its own little Group (origin = joint pivot) */
function rigParts(type,c,P0){
  const P=rigMats(P0,c),pf=RPROF[type],w=pf.w,D=RD,S={};
  const mk=()=>new THREE.Group();
  for(const n of['pelvis','torso','head','uL','fL','uR','fR','tL','sL','tR','sR'].concat(pf.mount?HORSE_SEG:[]))S[n]=mk();
  const armorM=pf.light?P.cloth:P.armor,legM=pf.robe?P.cloth:(pf.light?P.leather:P.armor2),armM=pf.robe?P.cloth:(pf.light?P.cloth:P.armor2);
  /* pelvis + skirt/belt */
  put(S.pelvis,G3.box(pf.robe?P.cloth:P.armor2,(D.hipX*2+.12)*(.9+.1*w),.22,.34),0,0,0);
  put(S.pelvis,G3.box(P.trim,(D.hipX*2+.14)*(.9+.1*w),.05,.36),0,.1,0);
  if(pf.robe){put(S.pelvis,G3.cyl(P.cloth,.3*w,.52*w,.95,14),0,-.38,0);put(S.pelvis,G3.cyl(P.trim,.52*w,.53*w,.06,14),0,-.84,0);}
  else if(!pf.light){put(S.pelvis,G3.box(P.cloth,.3,.4,.04),0,-.22,.19,.05);put(S.pelvis,G3.box(P.cloth,.3,.36,.04),0,-.2,-.19,-.05);}
  /* legs */
  for(const[T,Sh,sx]of[[S.tL,S.sL,1],[S.tR,S.sR,-1]]){
    T.add(rgLimb(legM,.105*(.9+.1*w),.088,D.legU,10));put(T,G3.sph(pf.robe?P.cloth:P.armor2,.095,10,8),0,-D.legU,.04);
    Sh.add(rgLimb(pf.robe?P.cloth:P.dark,.085,.07,D.legL,10));
    put(Sh,G3.box(P.leather,.17,.1,.34),0,-D.legL+.03,.08);put(Sh,G3.box(P.trim,.18,.03,.2),0,-D.legL+.1,.02);
  }
  /* torso */
  const tw=w;
  const ch=G3.cyl(armorM,.3*tw,.22*tw,D.torsoH,14);ch.scale.z=.72;put(S.torso,ch,0,D.torsoH/2,0);
  if(!pf.robe){put(S.torso,G3.box(P.trim,.36*tw,.3,.05),0,.38,.19*(.8+.2*tw),-.1);put(S.torso,G3.box(P.dark,.34*tw,.07,.28),0,.04,0);put(S.torso,G3.cyl(P.trim,.31*tw,.31*tw,.04,14),0,D.torsoH-.02,0).scale.z=.72;}
  else{put(S.torso,G3.box(P.trim,.1,.62,.05),0,.31,.17);put(S.torso,G3.cyl(P.cloth,.27,.3,.24,12),0,D.torsoH-.04,0);}
  if(pf.rune){for(let k=0;k<4;k++)put(S.torso,G3.box(P.glow,.04,.1,.02),(k%2?1:-1)*.07,.18+k*.12,.2);}
  if(pf.gold){put(S.torso,G3.sph(P.glow,.07,10,8),0,.4,.2);}
  for(const sx of[-1,1]){const pd=put(S.torso,G3.sph(pf.robe?P.cloth:P.armor2,(pf.heavy?.19:.15)*(.85+.15*w),12,10),sx*D.shX*tw,D.torsoH-.08,0);pd.scale.set(1,.72,1);
    put(S.torso,G3.cyl(P.trim,.12*(.85+.15*w),.12*(.85+.15*w),.03,12),sx*D.shX*tw,D.torsoH-.1,0);
    if(pf.heavy)for(let k=0;k<3;k++)put(S.torso,G3.cone(P.steel,.035,.1,6),sx*(D.shX*tw+.03),D.torsoH+.02,(k-1)*.07);}
  /* neck + head */
  put(S.head,G3.cyl(P.skin,.065,.075,.14,8),0,0,0);rgHelm(pf.helm,P,S.head);
  /* arms */
  for(const[U,F,sx]of[[S.uL,S.fL,1],[S.uR,S.fR,-1]]){
    U.add(rgLimb(armM,.075*(.9+.1*w),.068,D.armU,10));
    F.add(rgLimb(pf.robe?P.cloth:P.steel,.065,.058,D.armL,10));put(F,G3.sph(P.skin,.065,10,8),0,-D.armL,0);
    if(pf.robe){put(F,G3.cone(P.cloth,.12,.22,10),0,-.1,0,Math.PI);}
  }
  /* cape */
  if(pf.cape){const L=pf.cape*.9;const cp=G3.box(P.cloth,.52*tw,L,.035);put(S.torso,cp,0,D.torsoH-.1-L/2,-.2,.12);put(S.torso,G3.box(P.trim,.54*tw,.04,.045),0,D.torsoH-.1,-.2,.12);}
  /* weapon (right hand = -x) and shield (left) */
  const wep=rgWeapon(pf.wep,P);wep.rotation.x=Math.PI/2;wep.position.y=-D.armL;S.fR.add(wep);
  if(pf.shield){const sh=rgShield(pf.shield,P);sh.position.set(.08,-D.armL*.55,.1);S.fL.add(sh);}
  if(pf.mount)rigHorse(S,P);
  S._P=P;
  return S;
}
/* merge each segment's meshes per material so a piece costs ~25 meshes with shared geometry */
function rigBakeSeg(g){
  g.updateMatrixWorld(true);const by=new Map();
  g.traverse(o=>{if(!o.isMesh)return;let geo=o.geometry.clone();geo.applyMatrix4(o.matrixWorld);if(geo.index)geo=geo.toNonIndexed();
    let e=by.get(o.material);if(!e){e={pos:[],nor:[]};by.set(o.material,e);}e.pos.push(geo.attributes.position.array);e.nor.push(geo.attributes.normal.array);});
  const parts=[];
  for(const[mat,e]of by){const n=e.pos.reduce((a,b)=>a+b.length,0),Pp=new Float32Array(n),Nn=new Float32Array(n);let k=0;
    for(let j=0;j<e.pos.length;j++){Pp.set(e.pos[j],k);Nn.set(e.nor[j],k);k+=e.pos[j].length;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(Pp,3));geo.setAttribute('normal',new THREE.BufferAttribute(Nn,3));geo.computeBoundingSphere();parts.push({geo,mat});}
  return parts;
}
/* ---- GPU-skinned build: one skeleton, 3 draw calls per piece (metal / soft / glow) instead of ~40 ---- */
const RSEG=[['hips','pelvis',null],['tL','tL','hips'],['sL','sL','tL'],['tR','tR','hips'],['sR','sR','tR'],['torso','torso','hips'],['head','head','torso'],['uL','uL','torso'],['fL','fL','uL'],['uR','uR','torso'],['fR','fR','uR']];
const RSEG_H=[['hbody','hbody',null],['hips','pelvis','hbody']].concat(RSEG.slice(1),HORSE_SEG.slice(1).map(n=>[n,n,n==='hhead'?'hneck':n==='hlfL'?'hlf':n==='hrfL'?'hrf':n==='hlbL'?'hlb':n==='hrbL'?'hrb':'hbody']));
const rsegOf=t=>RPROF[t].mount?RSEG_H:RSEG;
function rigRest(n,tw){const D=RD;
  if(HORSE_REST[n])return HORSE_REST[n].map(v=>v*HK);
  return n==='hips'?[0,D.hipY,0]:n==='tL'?[D.hipX,-.02,0]:n==='tR'?[-D.hipX,-.02,0]:n==='sL'||n==='sR'?[0,-D.legU,0]:n==='torso'?[0,.08,0]:n==='head'?[0,D.torsoH+.02,0]:
    n==='uL'?[D.shX*tw,D.torsoH-.08,0]:n==='uR'?[-D.shX*tw,D.torsoH-.08,0]:[0,-D.armU,0];}
function rigMakeBones(tw,seg){const b={};for(const[n,,par]of(seg||RSEG)){const o=new THREE.Bone();o.position.fromArray(rigRest(n,tw));b[n]=o;if(par)b[par].add(o);}return b;}
function rigBakeSkin(type,vc){
  const pf=RPROF[type],S=rigParts(type,vc,pal(vc)),P=S._P,seg=rsegOf(type),bones=rigMakeBones(pf.w,seg),root=new THREE.Group();
  root.add(bones[seg[0][0]]);root.updateMatrixWorld(true);
  const K={metal:{p:[],n:[],c:[],i:[]},soft:{p:[],n:[],c:[],i:[]},glow:{p:[],n:[],c:[],i:[]}};
  const soft=new Set([P.cloth,P.skin,P.hair,P.leather,P.coat,P.mane]);
  seg.forEach(([bn,sn],bi)=>{
    const M=bones[bn].matrixWorld;
    for(const{geo,mat}of rigBakeSeg(S[sn])){
      const g2=geo.clone();g2.applyMatrix4(M);
      const k=K[mat===P.glow?'glow':soft.has(mat)?'soft':'metal'],pa=g2.attributes.position.array,na=g2.attributes.normal.array,nv=pa.length/3;
      for(let v=0;v<pa.length;v++){k.p.push(pa[v]);k.n.push(na[v]);}
      for(let v=0;v<nv;v++){k.c.push(mat.color.r,mat.color.g,mat.color.b);k.i.push(bi);}
    }
  });
  const out={geo:{},mats:{}};
  for(const n in K){
    const k=K[n];if(!k.p.length)continue;const nv=k.i.length,g=new THREE.BufferGeometry(),si=new Uint16Array(nv*4),sw=new Float32Array(nv*4);
    for(let v=0;v<nv;v++){si[v*4]=k.i[v];sw[v*4]=1;}
    g.setAttribute('position',new THREE.Float32BufferAttribute(k.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(k.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(k.c,3));
    g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));g.computeBoundingSphere();
    out.geo[n]=g;
  }
  P.glow.skinning=true;out.mats.glow=P.glow;
  out.mats.metal=new THREE.MeshStandardMaterial({vertexColors:true,metalness:.62,roughness:.36,skinning:true});
  out.mats.soft=new THREE.MeshStandardMaterial({vertexColors:true,metalness:0,roughness:.85,envMapIntensity:.25,skinning:true});
  return out;
}
function rigModel(R,type,vc){
  const key='rigS'+type+vc;
  if(!R.bake[key])R.bake[key]=rigBakeSkin(type,vc);
  const B=R.bake[key],pf=RPROF[type],seg=rsegOf(type),bones=rigMakeBones(pf.w,seg),root=new THREE.Group(),list=seg.map(s=>bones[s[0]]);
  root.add(bones[seg[0][0]]);root.updateMatrixWorld(true);
  const skel=new THREE.Skeleton(list);
  for(const n of['metal','soft','glow']){if(!B.geo[n])continue;const m=new THREE.SkinnedMesh(B.geo[n],B.mats[n]);m.castShadow=n!=='glow';m.frustumCulled=false;root.add(m);m.bind(skel,new THREE.Matrix4());}
  root.userData.rg={j:bones,pf,hipY:pf.mount?1.22:RD.hipY};
  rigSet(root.userData.rg,{});
  return root;
}
const _sm=k=>k*k*(3-2*k),_cl=(x,a,b)=>Math.max(a,Math.min(b,x)),_lp=(a,b,t)=>a+(b-a)*t;
/* One pure function: pose params -> joint rotations. Everything (walk, slash, idle, leap, death) is a param set. */
function rigSet(rg,p){
  const J=rg.j,sp=p.sp||0,ph=p.ph||0,sw=Math.sin(ph)*.78*sp,bob=Math.abs(Math.sin(ph))*.075*sp,br=p.br||0;
  let tLx=-sw,tRx=sw,sLx=Math.max(0,Math.cos(ph))*1.05*sp,sRx=Math.max(0,-Math.cos(ph))*1.05*sp;
  let uLx=sw*.8,uRx=-sw*.5-.22,uLz=.1,uRz=-.1,fLx=-.55-sp*.4,fRx=-.85-sp*.3,fRz=0,fLz=0,uRy=0,uLy=0;
  let twist=sw*.16,lean=.1*sp,hipX=0,hipRz=0,hipsY=rg.hipY-bob,hy=p.hy||0,hp=p.hp||0,hr=p.hr||0,tilt=0,tz=0;
  /* slash: wind-up (0-.38), strike (.38-.62), recover */
  if(p.sl!=null&&p.sl>=0){
    const s=p.sl,wu=_sm(_cl(s/.36,0,1)),st=_sm(_cl((s-.36)/.2,0,1)),rc=_sm(_cl((s-.58)/.42,0,1));
    const k=wu*(1-st)+st*(1-rc);   // arm raised amount 0..1..0 isn't right for strike, so compute explicit angles
    uRx=_lp(_lp(-.22,-3.0,wu),_lp(-3.0,-.35,st),st);uRx=_lp(uRx,-.22,rc);
    fRx=_lp(_lp(-.85,-1.5,wu),_lp(-1.5,-.12,st),st);fRx=_lp(fRx,-.85,rc);
    uRz=_lp(-.1,-.45,wu*(1-st));fRz=0;
    twist=_lp(_lp(0,-.65,wu),_lp(-.65,.75,st),st);twist=_lp(twist,0,rc);
    lean=_lp(_lp(-.1,-.22,wu),_lp(-.22,.34,st),st);lean=_lp(lean,0,rc);
    tLx=_lp(_lp(0,.35,wu),_lp(.35,-.75,st),st);tLx=_lp(tLx,0,rc);tRx=_lp(_lp(0,-.1,wu),_lp(-.1,.5,st),st);tRx=_lp(tRx,0,rc);
    sLx=_lp(0,.4,st*(1-rc));sRx=_lp(0,.3,wu*(1-rc));
    uLx=_lp(0,.6,st*(1-rc))+_lp(0,-.4,wu*(1-st));uLz=.1+.5*wu*(1-rc);
    hipX=0;hipsY=rg.hipY-.07*st*(1-rc);hy=_lp(0,-.15,wu*(1-st));
  }
  /* leap: both legs tucked, arms flung */
  if(p.jp!=null&&p.jp>=0){const a=Math.sin(p.jp*Math.PI);tLx=-1.1*a;tRx=-.5*a;sLx=1.5*a;sRx=1.1*a;uLx=-.9*a;uRx=-1.0*a-.2;uLz=.1+.8*a;uRz=-.1-.8*a;lean=.2*a;hipsY=rg.hipY-.04;}
  /* idle gestures (envelopes e in 0..1) */
  const e=p.sc||0;
  if(p.scr){const E=p.scr,jig=Math.sin((p.t||0)*13)*.12;uLx=_lp(uLx,-2.55,E);fLx=_lp(fLx,-2.1+jig,E);uLz=_lp(uLz,.5,E);hr+=.2*E;hy+=.35*E;}
  if(p.str){const E=p.str;uLx=_lp(uLx,-3.1,E);uRx=_lp(uRx,-3.1,E);uLz=_lp(uLz,.35,E);uRz=_lp(uRz,-.35,E);fLx=_lp(fLx,-.2,E);fRx=_lp(fRx,-.2,E);lean-=.25*E;hp-=.35*E;}
  if(p.sft){const E=p.sft,sg=Math.sin((p.t||0)*2.2);hipX=.05*sg*E;hipRz=.07*sg*E;tLx+=.15*E;sLx+=.35*Math.max(0,sg)*E;tz=-.05*sg*E;}
  if(p.ins){const E=p.ins;uRx=_lp(uRx,-1.35,E);fRx=_lp(fRx,-1.0,E);fRz=Math.sin((p.t||0)*3)*.5*E;hp+=.35*E;hy=_lp(hy,-.35,E);}
  /* death flail */
  if(p.dt!=null){const d=p.dt;uLx=-2.2*d;uRx=-2.4*d;uLz=.3+.8*d;uRz=-.3-.8*d;fLx=-.6;fRx=-.6;tLx=-.3*d;tRx=.5*d;sLx=.6*d;sRx=.2;lean=-.2*d;hp=-.5*d;}
  const mt=!!rg.pf.mount;
  if(mt&&p.dt==null){tLx=tRx=-.95;sLx=sRx=1.25;}
  J.hips.position.set(hipX,hipsY,mt?-.27:0);J.hips.rotation.set(0,0,hipRz);
  J.tL.rotation.set(tLx,0,mt?.3:0);J.tR.rotation.set(tRx,0,mt?-.3:0);J.sL.rotation.set(sLx,0,0);J.sR.rotation.set(sRx,0,0);
  J.torso.rotation.set(lean,twist,tz);J.torso.scale.set(1,1+br*.012,1+br*.01);
  J.uL.rotation.set(uLx,uLy,uLz);J.uR.rotation.set(uRx,uRy,uRz);J.fL.rotation.set(fLx,0,fLz);J.fR.rotation.set(fRx,0,fRz);
  J.head.rotation.set(hp-lean*.6,hy-twist*.5,hr);
  if(mt)rigHorseSet(J,p,sp,ph,sw);
}
function rigHorseSet(J,p,sp,ph,sw){
  const t=p.t||0,jp=p.jp!=null&&p.jp>=0?Math.sin(p.jp*Math.PI):0,d=p.dt||0,br=p.br||0;
  const leg=(U,L,phi,front)=>{
    let u=-.62*sp*Math.sin(phi),l=(front?1.1:.9)*sp*Math.max(0,Math.cos(phi));
    if(jp){u=front?-1.0*jp:.75*jp;l=front?1.9*jp:.5*jp;}
    if(d){u=(front?-1.4:.6)*d;l=.8*d;}
    J[U].rotation.set(u,0,0);J[L].rotation.set(l,0,0);};
  leg('hlf','hlfL',ph,1);leg('hrb','hrbL',ph,0);leg('hrf','hrfL',ph+Math.PI,1);leg('hlb','hlbL',ph+Math.PI,0);
  if(p.sft&&!jp&&!sp){const e=p.sft*Math.max(0,Math.sin(t*3.4));J.hlf.rotation.x=-.7*e;J.hlfL.rotation.x=1.2*e;}
  J.hbody.rotation.x=-Math.sin(ph*2)*.03*sp-.15*jp+.25*d;J.hbody.position.y=Math.abs(Math.sin(ph))*.05*sp+.12*jp;
  J.hneck.rotation.set(-.08+Math.sin(ph*2)*.06*sp+.06*br+(p.hp||0)*.5+.2*jp,(p.hy||0)*.55,0);
  J.hhead.rotation.set(.1+.08*Math.sin(t*.9)-.25*d,0,0);
  J.htail.rotation.set(.2,0,Math.sin(t*1.7)*.14+sw*.25);
}
/* ---------- idle scheduler: every piece gets its own timing so nobody animates in sync ---------- */
const IDLE_W={P:{look:3,scratch:3,shift:3,ins:1,str:1},N:{look:3,shift:3,ins:2,scratch:1,str:1},B:{look:4,shift:2,ins:2,str:1,scratch:1},R:{look:2,shift:3,ins:2,str:2,scratch:1},
  Q:{look:4,shift:2,ins:2,str:1,scratch:1},K:{look:4,shift:2,ins:2,str:2,scratch:1},M:{look:3,shift:2,ins:2,str:2,scratch:1},C:{look:4,shift:2,ins:2,str:1,scratch:1},H:{look:3,shift:2,ins:3,str:1,scratch:0}};
function rigIdle(o,now,dt){
  const rg=o.rg,id=o.idle||(o.idle={kind:null,t0:0,dur:0,next:now+Math.random()*7,seed:Math.random()*100});
  const p={br:Math.sin(now*1.6+o.ph),t:now+id.seed};
  if(!id.kind&&now>=id.next){
    const W=IDLE_W[o.p.t]||IDLE_W.P;let tot=0;for(const k in W)tot+=W[k];let x=Math.random()*tot,kind='look';for(const k in W){x-=W[k];if(x<=0){kind=k;break;}}
    id.kind=kind;id.t0=now;id.dur=kind==='look'?2.6+Math.random()*1.6:kind==='scratch'?1.8+Math.random():kind==='str'?2.2:kind==='shift'?2.4:1.9;
  }
  if(id.kind){
    const k=(now-id.t0)/id.dur;
    if(k>=1){id.kind=null;id.next=now+2.2+Math.random()*7.5;}
    else{
      const E=Math.pow(Math.sin(k*Math.PI),.6);
      if(id.kind==='look'){p.hy=Math.sin(k*Math.PI*2.2+id.seed)*.95*E;p.hp=Math.sin(k*Math.PI*4)*.05;}
      else if(id.kind==='scratch')p.scr=E;else if(id.kind==='str')p.str=E;else if(id.kind==='shift')p.sft=E;else if(id.kind==='ins')p.ins=E;
    }
  }
  rigSet(rg,p);
}
function rigStep(R,x,z,pp){
  const t=performance.now();if(t-(R.lastStep||0)<70)return;R.lastStep=t;sfx('step');
  v3Emit(R,{x,y:.04,z},{n:3,col:'190,185,170',blend:false,v0:.15,v1:.5,l0:.25,l1:.5,s0:.12,s1:.24,g:.2,flat:true,up:.15});
}
/* ---------- walking / slashing / leaping move animation (replaces the old slide-and-twist) ---------- */
function rigTs(cine,u){ // time scale as a function of virtual time since slash start (deterministic so kill delay can be pre-computed)
  if(!cine)return 1;
  const hit=cine.hitAt;
  if(cine.kind==='long'){
    if(u<hit-.5)return .6; if(u<hit-.12)return .3; if(u<hit+.1)return .07; if(u<hit+.8)return _lp(.07,1,_sm((u-hit-.1)/.7)); return 1;}
  if(u<hit-.2)return .75; if(u<hit+.06)return .16; if(u<hit+.4)return _lp(.16,1,_sm((u-hit-.06)/.34)); return 1;
}
function v3Walk(R,mv,impact,killSq,first,evs){
  const o=mv.o,g=o.grp,b=o.body,rg=o.rg,p=o.p,x0=g.position.x,z0=g.position.z,x1=sqX(mv.to),z1=sqZ(mv.to),dx=x1-x0,dz=z1-z0,dist=Math.hypot(dx,dz)||1,ux=dx/dist,uz=dz/dist;
  const cap=killSq.has(mv.to),leap=p.t==='M'||(p.t==='N'&&Math.abs(dx)*Math.abs(dz)>1.9),yawT=Math.atan2(dx,dz),face0=o.faceY;
  const victim=cap?[...R.pcs.values()].find(v=>v.i===mv.to&&!v.dying&&v!==o):null;
  const fast=!FX.on||first;
  const ang=(a,bb)=>{let d=((bb-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d;};
  o.i=mv.to;o.moving=true;
  if(fast){g.position.set(x1,0,z1);b.rotation.y=face0;rigSet(rg,{});o.moving=false;impact.set(o.id,0);return;}
  const yawTo=ang(face0,yawT);
  /* timeline (virtual seconds) */
  const stopD=cap?Math.max(0,dist-.92):dist;   // walk until one tile short of the victim
  const run=stopD>2.2,vel=run?Math.min(8,4.4+stopD*.5):Math.max(2.6,2.9+stopD*.2);
  const tWalk=leap?Math.min(.62,.32+dist*.07):(stopD>.05?stopD/vel:0);
  const tSl=cap?.74:0,hitU=.5*tSl,tStep=cap?.26:0;
  const valV=victim?(VAL[victim.p.t]||0):0,valA=VAL[p.t]||0;
  const upset=!!victim&&p.t!=='K'&&victim.p.t!=='K'&&(valV-valA>=200);
  let cine=null;
  if(cap&&victim&&victim.p.t!=='K'&&G.killcam!==false){
    if(upset)cine={kind:'long',hitAt:hitU,dur:tWalk+tSl+tStep+1.2};
    else if(valV>=500&&Math.random()<.6||Math.random()<.22)cine={kind:'short',hitAt:hitU,dur:tWalk+tSl+tStep+.4};
  }
  const tHold=cine?(cine.kind==='long'?1.3:.5):0;   // killer stays put until the kill cam is done, then steps in
  const tCap=tWalk+tSl+tHold+tStep;
  /* real-time moment of the hit (needed so the victim reacts at the right instant under slow motion) */
  let realHit=0;
  {let vt=0,rt=0;const hitV=tWalk+hitU;while(vt<hitV){const ts=(cine&&vt>=tWalk)?rigTs(cine,vt-tWalk):1;vt+=.01*ts;rt+=.01;}realHit=rt;}
  impact.set(o.id,cap?realHit:tWalk);
  if(victim){victim.vdir={x:ux,z:uz};victim.attId=o.id;}
  if(cine){G.holdUntil=performance.now()+(tCap+(cine.kind==='long'?1.6:.5))*1000;}
  let vt=0,last=performance.now(),phase=0,snd={kiai:0,slash:0,hit:0},lastFoot=0,auraS=null,done=false,camEnded=false;
  const aTotal=cap?tCap:tWalk;
  if(cine)v3CineStart(R,o,victim,cine,{x0,z0,x1,z1,ux,uz,stopD,tWalk,tSl,hitU});
  const stopX=x0+ux*stopD,stopZ=z0+uz*stopD;
  R.anims.push({upd:()=>{
    const now=performance.now(),rdt=Math.min(.06,(now-last)/1000);last=now;
    const ts=(cine&&vt>=tWalk)?rigTs(cine,vt-tWalk):1;vt+=rdt*ts;
    let px,pz,py=0;
    /* face walking direction */
    const fy=ang(b.rotation.y,yawTo);b.rotation.y+=(fy-b.rotation.y)*Math.min(1,rdt*14);
    const pose={};
    if(vt<tWalk||(!cap&&vt<tWalk+.0001)){
      const k=tWalk>0?_cl(vt/tWalk,0,1):1;
      if(leap){const e=_sm(k),jx=cap?stopX-x0:dx,jz=cap?stopZ-z0:dz;px=x0+jx*e;pz=z0+jz*e;py=Math.sin(k*Math.PI)*(cap?1.15:.95);pose.jp=k;}
      else{const A=.14,ee=k<A?k*k/(2*A*(1-A)):(k>1-A?1-(1-k)*(1-k)/(2*A*(1-A)):(k-A/2)/(1-A));px=x0+(cap?stopX-x0:dx)*ee;pz=z0+(cap?stopZ-z0:dz)*ee;
        phase+=rdt*vel*(run?3.1:3.6)*Math.min(1,.35+k*3,(1-k)*3+.35);pose.ph=phase;pose.sp=run?1:.78;
        const ft=Math.floor(phase/Math.PI);if(ft!==lastFoot){lastFoot=ft;rigStep(R,px,pz);}}
    }else if(cap&&vt<tWalk+tSl){
      const u=(vt-tWalk)/tSl;px=stopX;pz=stopZ;pose.sl=u;
      if(!snd.kiai){snd.kiai=1;sfx('kiai');if(cine&&cine.kind==='long'){sfx('riser');v3CineAura(R,o,true);}}
      if(u>=.36&&!snd.slash){snd.slash=1;sfx('slash');sfx('shing',60);v3SlashArc(R,o,ux,uz);}
      if(u>=.5&&!snd.hit){snd.hit=1;v3Impact(R,o,victim,x1,z1,ux,uz,cine);}
    }else if(cap&&vt<tWalk+tSl+tHold){
      if(cine&&!camEnded){camEnded=true;v3CineEnd(R,o,cine);}
      px=stopX;pz=stopZ;pose.sl=_lp(.62,1,_cl((vt-tWalk-tSl)/.4,0,1));
    }else if(cap){
      const k=_cl((vt-tWalk-tSl-tHold)/Math.max(.01,tStep),0,1),e=_sm(k);
      px=_lp(stopX,x1,e);pz=_lp(stopZ,z1,e);pose.ph=phase+k*3;pose.sp=.5*(1-k)+.1;
      pose.sl=1;
    }else{px=x1;pz=z1;}
    g.position.set(px,py,pz);rigSet(rg,pose);
    if(window.__wl)window.__wl.push([+vt.toFixed(2),+px.toFixed(2),+pz.toFixed(2),cap?1:0,cine?cine.kind:'-']);
    if(cine)v3CineUpdate(R,o,victim,cine,vt,tWalk,tSl,{x0,z0,x1,z1,ux,uz,px,pz});
    if(vt>=aTotal){
      g.position.set(x1,0,z1);b.rotation.y=face0+(ang(face0,yawT)-face0)*0;o.moving=false;rigSet(rg,{});
      if(!snd.hit&&cap)v3Impact(R,o,victim,x1,z1,ux,uz,cine);
      if(cine&&!camEnded){camEnded=true;v3CineEnd(R,o,cine);}v3CineAura(R,o,false);
      // face the enemy side again
      const y1=b.rotation.y;let d=((face0-y1+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;
      const t0=performance.now();R.anims.push({upd:()=>{const kk=Math.min(1,(performance.now()-t0)/260);b.rotation.y=y1+d*_sm(kk);return kk>=1;}});
      return true;
    }
    return false;
  }});
}

/* ---------- hit effects, slash arc, aura ---------- */
const CINE_KANJI={P:'歩',N:'桂',B:'角',R:'飛',Q:'后',K:'王',M:'司',C:'司',H:'勇',T:'砲',A:'弓'};
const CINE_TAGS=['ONE STRIKE','KNOW YOUR PLACE','NOTHING PERSONAL','THE UNDERDOG BITES','GAME OVER, YOUR MAJESTY','DESTINY CUT','CHECK THIS','NO MERCY'];
function v3SlashArc(R,o,ux,uz){
  const g=o.grp,col=o.p.c===0?0xfff0b0:0xff5470;
  const m=new THREE.Mesh(new THREE.RingGeometry(.5,.64,28,1,0,Math.PI*.85),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.95,depthWrite:false,toneMapped:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
  m.position.set(g.position.x+ux*.55,.95,g.position.z+uz*.55);m.rotation.set(0,Math.atan2(ux,uz)+Math.PI/2,-.7,'YXZ');m.raycast=()=>{};R.fxRoot.add(m);
  const t0=performance.now();R.anims.push({upd:()=>{const k=Math.min(1,(performance.now()-t0)/260);m.scale.setScalar(.8+k*.7);m.material.opacity=.95*(1-k*k);m.rotation.z=-.7-k*.5;if(k>=1){R.fxRoot.remove(m);m.geometry.dispose();m.material.dispose();return true;}}});
}
function v3Impact(R,o,victim,x1,z1,ux,uz,cine){
  const q={x:x1,y:.9,z:z1},big=cine&&cine.kind==='long';
  sfx('impact');if(big)sfx('sting');else if(victim)sfx('cry',80);
  v3Burst(R,q,'255,255,255',big?3.4:2.4,300);v3Ring(R,{x:x1,z:z1},{col:'255,235,200',r0:.2,r1:big?3.4:1.8,ms:big?700:420,a:.95});
  v3Emit(R,q,{n:big?60:30,col:o.p.c===0?'255,230,150':'255,110,130',v0:2,v1:big?10:6,l0:.25,l1:.7,g:-6,s0:.05,s1:.14});
  v3Emit(R,{x:x1,y:.15,z:z1},{n:8,col:'190,185,170',blend:false,v0:.3,v1:1.4,l0:.4,l1:.9,s0:.2,s1:.4,g:.4,flat:true,up:.3});
  v3Shake(R,big?.55:.22,big?420:220);if(big)v3Flash(R,'255,235,210',q,380,30);
  cineFlash(big?'impact':'hit');
}
function v3CineAura(R,o,on){
  if(on){
    if(o.aura)return;const c=o.p.c===0?new THREE.Color(1,.82,.35):new THREE.Color(1,.28,.4),col=o.p.c===0?'255,215,100':'255,70,95';
    const sp=v3Sprite(R,R.tex.glow,c);sp.scale.set(3.2,3.6,1);sp.position.y=1;sp.material.opacity=.0;sp.raycast=()=>{};o.grp.add(sp);
    const t0=performance.now();let em=0;o.aura={sp};
    R.anims.push({upd:()=>{if(!o.aura||o.aura.sp!==sp){o.grp.remove(sp);sp.material.dispose();return true;}
      const k=Math.min(1,(performance.now()-t0)/500);sp.material.opacity=.55*k*(.8+.2*Math.sin(performance.now()/60));sp.scale.set(3.2+Math.sin(performance.now()/90)*.25,3.6,1);
      em+=1;if(em%2===0)v3Emit(R,{x:o.grp.position.x+(Math.random()-.5)*.6,y:.1,z:o.grp.position.z+(Math.random()-.5)*.6},{n:2,col,v0:.1,v1:.5,l0:.5,l1:1,g:3,up:2.4,s0:.06,s1:.14});return false;}});
  }else if(o.aura){const sp=o.aura.sp;o.aura=null;const t0=performance.now(),m0=sp.material.opacity;R.anims.push({upd:()=>{const k=Math.min(1,(performance.now()-t0)/400);sp.material.opacity=m0*(1-k);if(k>=1){o.grp.remove(sp);sp.material.dispose();return true;}}});}
}
/* ---------- kill-cam overlays + camera ---------- */
function cineDom(){
  let c=document.getElementById('cine');if(c)return c;
  c=document.createElement('div');c.id='cine';c.className='cine';
  c.innerHTML='<div class="vig"></div><div class="lines"></div><div class="kanji"></div><div class="bar t"></div><div class="bar b"></div><div class="cap"></div><div class="sub"></div><div class="flash"></div><div class="impact"></div>';
  $('boardwrap').appendChild(c);return c;
}
function cineFlash(kind){
  const c=cineDom(),f=c.querySelector(kind==='impact'?'.impact':'.flash');if(!f)return;
  f.classList.remove('f');void f.offsetWidth;f.classList.add('f');
  if(kind==='impact'){const fl=c.querySelector('.flash');fl.classList.remove('f');void fl.offsetWidth;setTimeout(()=>{fl.classList.add('f');},90);}
}
function v3CineStart(R,o,victim,cine,info){
  const c=cineDom();cine.variant=cine.kind==='long'?['push','hero','orbit'][(Math.random()*3)|0]:['orbit','push'][(Math.random()*2)|0];
  cine.info=info;cine.w=0;R.cineCam=cine;
  const long=cine.kind==='long',vic=victim?victim.p:null;
  c.classList.add('on');c.classList.toggle('long',long);
  c.querySelector('.kanji').textContent=CINE_KANJI[o.p.t]||'';
  const cap=c.querySelector('.cap'),sub=c.querySelector('.sub');
  if(long&&vic){cap.textContent=(NAMES[o.p.t]+' slays '+NAMES[vic.t]).toUpperCase();sub.textContent=CINE_TAGS[(Math.random()*CINE_TAGS.length)|0];
    cap.classList.remove('go');sub.classList.remove('go');setTimeout(()=>{cap.classList.add('go');sub.classList.add('go');},Math.max(0,(info.tWalk-.15))*1000);}
  else{cap.textContent='';sub.textContent='';}
  if(long)sfx('heart');
}
function v3CineUpdate(R,o,victim,cine,vt,tWalk,tSl,pos){
  const I=cine.info,t=vt-tWalk,long=cine.kind==='long';
  const lead=long?.55:.18,w=_sm(_cl((vt-(tWalk-lead))/(long?.5:.25),0,1));
  const s=_cl((t+lead)/(tSl+lead+.35),0,1),d={x:I.ux,z:I.uz},p={x:-I.uz,z:I.ux};
  const sx=I.x0+I.ux*I.stopD,sz=I.z0+I.uz*I.stopD,vx=I.x1,vz=I.z1,mx=(sx+vx)/2,mz=(sz+vz)/2;
  let cx,cy,cz,tx,ty,tz,fov;
  const V=cine.variant;
  if(V==='orbit'){const ph=_lp(-1.05,.45,s),r=_lp(3.8,3.0,s);cx=mx+(p.x*Math.cos(ph)+d.x*Math.sin(ph))*r;cz=mz+(p.z*Math.cos(ph)+d.z*Math.sin(ph))*r;cy=_lp(1.5,.95,s);tx=mx;tz=mz;ty=.95;fov=_lp(38,30,s);}
  else if(V==='push'){const k=_sm(s);cx=sx-d.x*_lp(3.4,2.2,k)+p.x*_lp(1.1,.95,k);cz=sz-d.z*_lp(3.4,2.2,k)+p.z*_lp(1.1,.95,k);cy=_lp(1.9,1.4,k);tx=_lp(mx,_lp(mx,vx,.75),k);tz=_lp(mz,_lp(mz,vz,.75),k);ty=_lp(.9,1.1,k);fov=_lp(38,30,k);}
  else{const k=_sm(s);cx=vx+d.x*_lp(2.3,1.6,k)+p.x*(.5+.5*k);cz=vz+d.z*_lp(2.3,1.6,k)+p.z*(.5+.5*k);cy=_lp(.4,.7,k);tx=sx;tz=sz;ty=_lp(1.15,1.0,k);fov=_lp(42,30,k);}
  cine.pose={cx,cy,cz,tx,ty,tz,fov};cine.w=w;
  const c=document.getElementById('cine');if(c){c.querySelector('.lines').classList.toggle('on',long&&t>-.1&&t<tSl+.4);}
}
function v3CineEnd(R,o,cine){
  const c=document.getElementById('cine'),long=cine.kind==='long',hold=long?.5:.05,t0=performance.now(),dur=long?.75:.4,w0=cine.w;
  R.anims.push({upd:()=>{const e=(performance.now()-t0)/1000;if(e>hold){const k=_cl((e-hold)/dur,0,1);cine.w=w0*(1-_sm(k));
      if(k>=.15&&c){c.classList.remove('on');c.querySelector('.lines').classList.remove('on');}
      if(k>=1){if(R.cineCam===cine)R.cineCam=null;if(c)c.querySelector('.cap').classList.remove('go'),c.querySelector('.sub').classList.remove('go');return true;}}return false;}});
}
