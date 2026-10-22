/* ===== Procedural grimdark miniatures (Three.js). Y up, models face +Z, standing on a round base. ===== */
function pal(c){
  const W=c===0,S=o=>new THREE.MeshStandardMaterial(Object.assign({envMapIntensity:.4},o));
  return{
    armor:S({color:W?0xb2a57f:0x0d0e13,metalness:W?.25:.6,roughness:W?.5:.36}),
    armor2:S({color:W?0x7d7156:0x07080b,metalness:W?.35:.65,roughness:W?.52:.4}),
    trim:S({color:W?0xe2b640:0xc2203a,metalness:.75,roughness:.3,envMapIntensity:.9}),
    dark:S({color:0x1b1e26,metalness:.65,roughness:.5}),
    steel:S({color:0x8d96a6,metalness:.85,roughness:.35,envMapIntensity:.8}),
    cloth:S({color:W?0x7f7259:0x45151f,metalness:0,roughness:.95,envMapIntensity:.2}),
    glow:S({color:W?0x8aeaff:0xff6a52,emissive:W?0x35c4ff:0xff2a18,emissiveIntensity:1.9,roughness:.35}),
    gold:S({color:0xeabd4c,metalness:.85,roughness:.26,envMapIntensity:.9}),
    ground:S({color:0x2c2b32,metalness:.1,roughness:.95,envMapIntensity:.3})
  };
}
const G3={
  box:(m,w,h,d)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m),
  cyl:(m,rt,rb,h,s)=>new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,s||16),m),
  sph:(m,r,a,b)=>new THREE.Mesh(new THREE.SphereGeometry(r,a||20,b||14),m),
  cone:(m,r,h,s)=>new THREE.Mesh(new THREE.ConeGeometry(r,h,s||12),m),
  tor:(m,R,r,s)=>new THREE.Mesh(new THREE.TorusGeometry(R,r,10,s||28),m)
};
function put(g,o,x,y,z,rx,ry,rz,sx,sy,sz){
  o.position.set(x||0,y||0,z||0);
  if(rx||ry||rz)o.rotation.set(rx||0,ry||0,rz||0);
  if(sx!=null)o.scale.set(sx,sy==null?sx:sy,sz==null?sx:sz);
  g.add(o);return o;
}
const _Y=new THREE.Vector3(0,1,0);
function limb(g,m,a,b,r1,r2){
  const A=new THREE.Vector3(a[0],a[1],a[2]),B=new THREE.Vector3(b[0],b[1],b[2]),d=B.clone().sub(A),L=d.length();
  const o=new THREE.Mesh(new THREE.CylinderGeometry(r2==null?r1:r2,r1,L,12),m);
  o.position.copy(A.clone().add(B).multiplyScalar(.5));
  o.quaternion.setFromUnitVectors(_Y,d.normalize());
  g.add(o);return o;
}
function baseDisk(P){
  const g=new THREE.Group();
  put(g,G3.cyl(P.dark,.8,.86,.2,40),0,.1,0);
  put(g,G3.tor(P.trim,.82,.04,40),0,.2,0,Math.PI/2);
  put(g,G3.cyl(P.ground,.74,.74,.03,40),0,.215,0);
  for(const r of[[.55,-.1,.1],[-.5,.2,.13],[.2,.62,.08],[-.1,-.7,.11],[.7,-.4,.07],[-.65,-.45,.08],[.62,.45,.06]]){
    const k=new THREE.Mesh(new THREE.DodecahedronGeometry(r[2]),P.ground);
    k.position.set(r[0]*.8,.23+r[2]*.3,r[1]*.8);k.rotation.set(r[0]*3,r[1]*3,0);k.scale.y=.6;g.add(k);
  }
  return g;
}
/* generic armoured humanoid, feet at y=0, ~3 units tall. o.hl/o.hr = hand targets */
function humanoid(P,o){
  o=Object.assign({wide:1},o);const w=o.wide,g=new THREE.Group();
  for(const s of[-1,1]){
    const x=s*.26*w;
    put(g,G3.box(P.armor2,.3,.2,.5),x,.1,.06);
    put(g,G3.box(P.armor,.3,.62,.32),x,.52,0);
    put(g,G3.sph(P.trim,.17,12,8),x,.86,.1);
    put(g,G3.box(P.armor,.32,.5,.34),x,1.1,0);
  }
  put(g,G3.box(P.dark,.86*w,.2,.46),0,1.38,0);
  put(g,G3.box(P.trim,.26,.26,.06),0,1.36,.25);
  put(g,G3.cyl(P.armor,.6*w,.42,.9,8),0,1.88,0,0,Math.PI/8,0,1,1,.78);
  put(g,G3.box(P.armor2,.72*w,.46,.14),0,2.0,.3,-.12);
  put(g,G3.box(P.trim,.18,.34,.05),0,2.0,.39,-.12);
  put(g,G3.sph(P.glow,.07,10,8),0,1.7,.33);
  put(g,G3.box(P.dark,.62*w,.72,.34),0,1.9,-.38);
  for(const s of[-1,1])put(g,G3.cyl(P.steel,.07,.09,.4,10),s*.2,2.25,-.55);
  for(const s of[-1,1]){
    const S=[s*.72*w,2.22,0],H=s<0?(o.hl||[-.76*w,1.42,.24]):(o.hr||[.76*w,1.42,.24]);
    const E=[(S[0]+H[0])/2+s*.16,(S[1]+H[1])/2-.05,(S[2]+H[2])/2-.02];
    put(g,G3.sph(P.armor,.34,18,12),S[0],2.25,0,0,0,0,1.1,.8,1.1);
    put(g,G3.tor(P.trim,.3,.035,20),S[0],2.28,0,Math.PI/2);
    limb(g,P.armor2,S,E,.13,.12);limb(g,P.armor,E,H,.12,.14);
    put(g,G3.sph(P.dark,.16,12,10),H[0],H[1],H[2]);
  }
  put(g,G3.cyl(P.dark,.12,.14,.14,10),0,2.5,0);
  put(g,G3.sph(P.armor,.3,22,16),0,2.72,0,0,0,0,1,1.02,1.05);
  put(g,G3.box(P.glow,.34,.09,.1),0,2.74,.27);
  put(g,G3.cyl(P.dark,.1,.12,.16,8),0,2.6,.27,Math.PI/2);
  return g;
}
function stand(P,h,s,y){const g=new THREE.Group();g.add(baseDisk(P));h.scale.setScalar(s);h.position.y=y==null?.22:y;g.add(h);return g;}

const MODEL={};
/* PAWN: line trooper with a rifle */
MODEL.P=P=>{
  const h=humanoid(P,{wide:.92,hr:[.5,1.75,.5]});
  put(h,G3.box(P.dark,.14,.5,.18),.5,1.5,.5,.1,0,.3);
  limb(h,P.dark,[.38,1.2,.5],[.66,2.8,.5],.05,.05);
  put(h,G3.box(P.glow,.06,.06,.16),.52,1.9,.55,0,0,.3);
  put(h,G3.cone(P.steel,.07,.22,8),.67,2.9,.5,0,0,-.3);
    put(h,G3.box(P.trim,.1,.34,.3),0,3.08,-.05);
  return stand(P,h,.9);
};
/* KING: terminator in a crown, upright maul, cape and halo */
MODEL.K=P=>{
  const h=humanoid(P,{wide:1.3,hl:[-.1,1.7,.78],hr:[.1,1.7,.78]});
  limb(h,P.dark,[0,.05,.78],[0,3.3,.78],.08,.08);
  put(h,G3.box(P.armor,1.0,.62,.62),0,3.45,.78);
  put(h,G3.box(P.trim,1.04,.14,.66),0,3.45,.78);
  put(h,G3.box(P.glow,.5,.1,.66),0,3.45,.78);
  put(h,G3.cone(P.trim,.16,.35,8),0,3.95,.78);
  put(h,G3.box(P.cloth,1.9,2.2,.09),0,1.7,-.7,.08);
  put(h,G3.box(P.trim,1.94,.12,.11),0,.62,-.74,.08);
  put(h,G3.tor(P.gold,.66,.045,32),0,2.95,-.3);
  for(let k=0;k<7;k++){const a=-1.15+k*.383;put(h,G3.cone(P.gold,.07,.3+(k===3?.2:0),6),Math.sin(a)*.36,3.1+Math.cos(a)*.1+(k===3?.1:0),Math.cos(a)*.18);}
  put(h,G3.sph(P.gold,.09,10,8),0,3.28,.05);
  return stand(P,h,1.0);
};
/* QUEEN: commander with a planted greatsword, plume and cape */
MODEL.Q=P=>{
  const h=humanoid(P,{wide:.92,hl:[-.08,1.95,.72],hr:[.08,1.95,.72]});
  put(h,G3.box(P.steel,.16,1.95,.05),0,.98,.72);
  put(h,G3.cone(P.steel,.08,.22,4),0,-.1,.72,Math.PI);
  put(h,G3.box(P.trim,.86,.12,.12),0,1.98,.72);
  put(h,G3.sph(P.gold,.1,12,8),0,2.18,.72);
  put(h,G3.box(P.glow,.07,.9,.06),0,1.0,.75);
  put(h,G3.box(P.cloth,1.5,2.1,.08),0,1.75,-.62,.07);
  put(h,G3.box(P.trim,1.54,.1,.1),0,.72,-.66,.07);
  put(h,G3.box(P.trim,.12,.8,.46),0,3.3,-.05,.35);
  put(h,G3.box(P.armor2,.1,.5,.4),0,3.1,.02,.2);
  for(const s of[-1,1])put(h,G3.cone(P.gold,.06,.34,6),s*.2,3.05,.08,0,0,s*-.5);
  put(h,G3.cone(P.gold,.07,.4,6),0,3.12,.14);
  put(h,G3.tor(P.glow,.5,.03,32),0,2.95,-.35);
  return stand(P,h,1.04);
};
/* BISHOP: robed priest with crozier, book and halo */
MODEL.B=P=>{
  const g=new THREE.Group();g.add(baseDisk(P));
  const h=new THREE.Group();
  put(h,G3.cyl(P.cloth,.34,.8,1.9,20),0,.95,0);
  put(h,G3.tor(P.trim,.78,.05,32),0,.1,0,Math.PI/2);
  put(h,G3.cyl(P.trim,.36,.36,.07,20),0,1.55,0);
  put(h,G3.sph(P.armor,.5,22,14),0,1.95,0,0,0,0,1.1,.8,.9);
  put(h,G3.box(P.trim,.16,.5,.06),0,1.95,.4);
  put(h,G3.sph(P.glow,.07,10,8),0,1.55,.38);
  for(const s of[-1,1]){
    put(h,G3.sph(P.armor,.3,16,12),s*.6,2.18,0,0,0,0,1.1,.8,1.1);
    put(h,G3.tor(P.trim,.27,.03,18),s*.6,2.2,0,Math.PI/2);
  }
  limb(h,P.cloth,[.6,2.15,0],[.9,1.7,.2],.15,.14);limb(h,P.cloth,[.9,1.7,.2],[.85,1.55,.5],.14,.16);
  limb(h,P.cloth,[-.6,2.15,0],[-.8,1.75,.25],.15,.14);limb(h,P.cloth,[-.8,1.75,.25],[-.32,1.6,.6],.14,.15);
  put(h,G3.sph(P.dark,.15,10,8),.85,1.55,.5);
  limb(h,P.gold,[.85,.05,.5],[.85,3.5,.5],.055,.055);
  put(h,G3.tor(P.gold,.24,.045,24),.85,3.62,.5);
  put(h,G3.box(P.glow,.07,.55,.07),.85,3.62,.5);put(h,G3.box(P.glow,.34,.07,.07),.85,3.7,.5);
  put(h,G3.box(P.cloth,.5,.09,.38),-.3,1.58,.62,-.15,0,.1);
  put(h,G3.box(P.trim,.52,.1,.4),-.3,1.52,.62,-.15,0,.1);
  put(h,G3.cyl(P.dark,.2,.24,.18,10),0,2.55,0);
  put(h,G3.sph(P.dark,.27,20,14),0,2.82,.04);
  put(h,G3.cone(P.cloth,.42,.95,20),0,3.05,-.04);
  for(const s of[-1,1])put(h,G3.sph(P.glow,.055,8,8),s*.1,2.85,.27);
  put(h,G3.tor(P.glow,.48,.03,30),0,3.0,-.5);
  g.add(h);h.position.y=.22;h.scale.setScalar(.96);
  return g;
};
