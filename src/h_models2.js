/* ===== Miniatures part 2: knight (mech steed + rider), rook (bastion), marshal (dreadnought), cardinal (winged) ===== */
MODEL.N=P=>{
  const g=new THREE.Group();g.add(baseDisk(P));
  const h=new THREE.Group();
  put(h,G3.cyl(P.armor,.46,.5,1.5,18),0,1.25,-.1,Math.PI/2);
  put(h,G3.sph(P.armor,.55,20,14),0,1.3,.62);put(h,G3.sph(P.armor,.52,20,14),0,1.28,-.78);
  put(h,G3.box(P.trim,.9,.5,.1),0,1.3,1.12,-.2);
  put(h,G3.box(P.dark,.85,.12,1.2),0,1.62,-.1);
  for(const s of[-1,1]){
    limb(h,P.armor2,[s*.32,1.15,.62],[s*.38,.62,.8],.15,.11);limb(h,P.dark,[s*.38,.62,.8],[s*.34,.2,.72],.1,.08);
    put(h,G3.box(P.steel,.2,.12,.28),s*.34,.12,.76);put(h,G3.sph(P.trim,.11,10,8),s*.38,.62,.85);
    limb(h,P.armor2,[s*.34,1.15,-.78],[s*.36,.72,-1.05],.17,.11);limb(h,P.dark,[s*.36,.72,-1.05],[s*.3,.2,-.82],.1,.08);
    put(h,G3.box(P.steel,.2,.12,.28),s*.3,.12,-.8);put(h,G3.sph(P.trim,.11,10,8),s*.36,.72,-1.08);
  }
  limb(h,P.armor,[0,1.55,.85],[0,2.4,1.25],.34,.22);
  put(h,G3.box(P.trim,.1,.7,.16),0,2.1,.98,.4);
  put(h,G3.box(P.armor,.34,.4,.9),0,2.62,1.5,.55);
  put(h,G3.box(P.armor2,.28,.28,.4),0,2.42,1.95,.55);
  put(h,G3.sph(P.glow,.06,8,8),.18,2.72,1.55);put(h,G3.sph(P.glow,.06,8,8),-.18,2.72,1.55);
  for(const s of[-1,1])put(h,G3.cone(P.armor2,.07,.3,6),s*.15,3.02,1.22,.3);
  limb(h,P.cloth,[0,1.5,-1.05],[0,.7,-1.55],.12,.07);
  put(h,G3.cyl(P.armor,.28,.34,.7,12),0,2.05,-.05);
  for(const s of[-1,1])put(h,G3.sph(P.armor,.22,12,10),s*.42,2.3,-.05,0,0,0,1.1,.8,1.1);
  put(h,G3.sph(P.armor,.22,16,12),0,2.7,0);put(h,G3.box(P.glow,.26,.07,.08),0,2.72,.19);
  put(h,G3.box(P.trim,.08,.3,.34),0,2.95,-.02);
  limb(h,P.armor2,[.4,2.25,0],[.66,1.7,.35],.1,.09);limb(h,P.armor2,[-.4,2.25,0],[-.2,1.9,.55],.1,.09);
  limb(h,P.steel,[.7,1.3,-.4],[.92,3.45,1.0],.045,.045);
  put(h,G3.cone(P.steel,.08,.4,6),.92+.05,3.62,1.06,.5,0,-.05);
  put(h,G3.box(P.cloth,.45,.3,.03),1.1,3.2,.85,0,.4,0);put(h,G3.box(P.trim,.45,.05,.04),1.1,3.07,.86,0,.4,0);
  h.rotation.y=.7;h.position.y=.22;h.scale.setScalar(.9);
  g.add(h);return g;
};

MODEL.R=P=>{
  const g=new THREE.Group();g.add(baseDisk(P));
  const h=new THREE.Group();
  for(const s of[-1,1]){
    put(h,G3.box(P.dark,.4,.5,1.8),s*.8,.5,0);
    for(const z of[-.65,-.22,.22,.65])put(h,G3.cyl(P.steel,.2,.2,.34,16),s*.8,.42,z,0,0,Math.PI/2);
    put(h,G3.box(P.trim,.44,.08,1.84),s*.8,.78,0);
  }
  put(h,G3.box(P.armor,1.4,.5,1.7),0,.92,0);
  put(h,G3.box(P.armor2,1.3,.26,.42),0,.9,.9,.4);
  put(h,G3.cyl(P.armor,.68,.82,1.5,10),0,1.95,0);
  put(h,G3.tor(P.trim,.8,.05,30),0,1.28,0,Math.PI/2);put(h,G3.tor(P.trim,.7,.05,30),0,2.55,0,Math.PI/2);
  for(let k=0;k<10;k++){const a=k*Math.PI*2/10;put(h,G3.box(P.armor,.28,.3,.2),Math.sin(a)*.72,2.88,Math.cos(a)*.72,0,a,0);}
  put(h,G3.cyl(P.dark,.62,.66,.12,10),0,2.7,0);
  put(h,G3.sph(P.glow,.22,14,10),0,2.95,0);
  for(const a of[-.55,0,.55])put(h,G3.box(P.glow,.1,.5,.05),Math.sin(a)*.74,1.95,Math.cos(a)*.74,0,a,0);
  for(const s of[-1,1]){
    limb(h,P.dark,[s*.5,2.15,.45],[s*.78,2.05,1.55],.13,.11);
    put(h,G3.cyl(P.steel,.16,.13,.22,12),s*.78,2.05,1.6,Math.PI/2);
    put(h,G3.box(P.trim,.3,.3,.3),s*.58,2.15,.55);
  }
  limb(h,P.steel,[.55,1.0,-.75],[.55,3.6,-.75],.04,.04);
  put(h,G3.box(P.cloth,.55,.75,.03),.84,3.2,-.75);put(h,G3.box(P.trim,.55,.09,.04),.84,3.52,-.74);
  put(h,G3.cone(P.gold,.07,.2,6),.55,3.7,-.75);
  h.position.y=.22;h.scale.setScalar(.92);g.add(h);return g;
};

MODEL.M=P=>{
  const g=new THREE.Group();g.add(baseDisk(P));
  const h=new THREE.Group();
  for(const s of[-1,1]){
    limb(h,P.armor2,[s*.55,1.4,-.05],[s*.66,.88,.5],.28,.24);
    limb(h,P.dark,[s*.66,.88,.5],[s*.6,.4,.22],.22,.2);
    put(h,G3.sph(P.trim,.24,14,10),s*.66,.88,.55);
    put(h,G3.box(P.armor,.6,.2,.9),s*.6,.12,.4);put(h,G3.box(P.trim,.62,.06,.5),s*.6,.24,.55);
  }
  put(h,G3.box(P.dark,1.5,.4,.8),0,1.45,0);
  put(h,G3.box(P.armor,1.5,1.1,1.0),0,2.1,0);
  put(h,G3.box(P.armor2,1.34,.62,.2),0,2.3,.58,-.3);
  put(h,G3.box(P.trim,1.38,.08,.24),0,2.0,.62,-.3);
  put(h,G3.cyl(P.glow,.16,.16,.12,14),0,2.35,.7,Math.PI/2);
  put(h,G3.sph(P.armor2,.42,18,12),0,2.8,.02,0,0,0,1,.7,1);
  put(h,G3.cyl(P.dark,.14,.14,.4,10),.3,3.05,-.3);put(h,G3.cyl(P.dark,.14,.14,.4,10),-.3,3.05,-.3);
  for(const s of[-1,1])put(h,G3.box(P.trim,.26,1.0,1.0),s*.94,2.4,0);
  limb(h,P.armor2,[-.85,2.15,.05],[-1.05,1.5,.4],.22,.2);
  put(h,G3.box(P.dark,.62,.55,.7),-1.05,1.2,.55);
  for(const k of[-.18,0,.18])put(h,G3.cyl(P.steel,.07,.07,.28,8),-1.05+k,1.2,.95,Math.PI/2);
  limb(h,P.armor2,[.85,2.15,.05],[1.0,1.7,.4],.2,.18);
  put(h,G3.box(P.dark,.34,.4,.5),1.02,1.55,.55);
  put(h,G3.cyl(P.steel,.13,.15,1.3,14),1.05,1.5,1.2,Math.PI/2);
  put(h,G3.cyl(P.dark,.2,.2,.18,14),1.05,1.5,1.82,Math.PI/2);
  put(h,G3.sph(P.glow,.06,8,8),1.05,1.5,1.93);
  put(h,G3.box(P.cloth,.5,.8,.04),0,2.0,-.58);put(h,G3.box(P.trim,.5,.08,.05),0,1.64,-.6);
  h.position.y=.22;h.scale.setScalar(.88);g.add(h);return g;
};

MODEL.C=P=>{
  const g=new THREE.Group();g.add(baseDisk(P));
  const h=humanoid(P,{wide:.9,hr:[.82,2.1,.42],hl:[-.7,1.6,.45]});
  put(h,G3.tor(P.glow,.55,.04,32),0,.05,0,Math.PI/2);
  put(h,G3.cone(P.glow,.26,.55,14),0,-.28,0,Math.PI);
  limb(h,P.glow,[.82,2.0,.42],[.82,3.55,.42],.06,.045);
  put(h,G3.box(P.trim,.5,.08,.1),.82,2.1,.42);
  put(h,G3.cone(P.glow,.07,.3,6),.82,3.7,.42);
  for(const s of[-1,1]){
    const pv=new THREE.Group();pv.position.set(s*.32,2.3,-.5);
    for(let k=0;k<6;k++){
      const L=2.0-k*.22,f=new THREE.Group();f.rotation.z=-s*(.28+k*.3);f.rotation.y=-s*.08*k;
      put(f,G3.box(k%2?P.armor2:P.armor,.2,L,.045),0,L/2,0);
      put(f,G3.box(P.trim,.2,.12,.05),0,L,0);
      pv.add(f);
    }
    h.add(pv);
  }
  put(h,G3.tor(P.gold,.46,.035,30),0,2.95,-.4);
  h.scale.setScalar(.98);h.position.y=.62;
  g.add(h);
  put(g,G3.tor(P.glow,.62,.035,32),0,.28,0,Math.PI/2);
  return g;
};

/* CHAMPION: gilded hero with tower shield and upright blade, hovering ring */
MODEL.H=P=>{
  const h=humanoid(P,{wide:1.08,hl:[-.8,1.55,.5],hr:[.74,1.7,.56]});
  put(h,G3.box(P.armor2,.16,1.5,.95),-.98,1.75,.55);
  put(h,G3.box(P.trim,.2,1.56,.14),-.98,1.75,.98);put(h,G3.box(P.trim,.2,1.56,.14),-.98,1.75,.12);
  put(h,G3.box(P.trim,.2,.14,1.0),-.98,2.55,.55);put(h,G3.box(P.trim,.2,.14,1.0),-.98,.95,.55);
  put(h,G3.sph(P.glow,.17,12,10),-1.08,1.75,.55);
  limb(h,P.steel,[.74,1.45,.56],[.74,3.6,.56],.07,.025);
  put(h,G3.box(P.trim,.7,.1,.14),.74,1.75,.56);
  put(h,G3.box(P.glow,.04,1.5,.05),.74,2.6,.6);
  put(h,G3.cone(P.trim,.13,.6,6),0,3.28,-.02);
  put(h,G3.box(P.cloth,.7,.9,.04),0,1.7,-.62);
  const g=stand(P,h,.9);
  put(g,G3.tor(P.glow,.66,.035,32),0,.3,0,Math.PI/2);
  return g;
};

/* ROCK: terrain boulder cluster (colour-neutral) */
MODEL.X=P=>{
  const g=new THREE.Group();
  const st=new THREE.MeshStandardMaterial({color:0x3b3e4a,roughness:.9,metalness:.05,flatShading:true});
  const st2=new THREE.MeshStandardMaterial({color:0x2b2d38,roughness:.95,metalness:.05,flatShading:true});
  const mo=new THREE.MeshStandardMaterial({color:0x56744a,roughness:.97,flatShading:true});
  const gl=new THREE.MeshStandardMaterial({color:0xff7a4a,emissive:0xff3a10,emissiveIntensity:1.6,roughness:.4});
  const rock=(mt,r,x,y,z,sx,sy,sz,ry)=>{const o=new THREE.Mesh(new THREE.DodecahedronGeometry(r),mt);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.set(.3,ry||0,.2);g.add(o);return o;};
  rock(st,1.1,0,1.0,0,1,1.25,1,.4);rock(st2,.72,.95,.55,.3,1,.9,1,1);rock(st2,.6,-.9,.45,-.2,1,.85,1.1,2);rock(st,.45,.3,.35,.95,1,.8,1,.2);
  rock(mo,.5,-.1,2.0,.1,1.2,.45,1.1,.8);rock(mo,.3,.9,1.05,.3,1,.4,1,0);
  put(g,G3.cone(gl,.1,.5,5),.15,2.35,.15,.1,0,.2);put(g,G3.cone(gl,.07,.35,5),-.25,2.25,-.1,-.2,0,-.3);
  put(g,G3.cyl(P.ground,1.5,1.55,.12,24),0,.06,0);
  return g;
};

/* CASTLE WALL block: crenellated stone segment */
MODEL.XW=P=>{
  const g=new THREE.Group();
  const st=new THREE.MeshStandardMaterial({color:0x8a8d99,roughness:.85,metalness:.05,flatShading:true});
  const st2=new THREE.MeshStandardMaterial({color:0x666977,roughness:.9,metalness:.05,flatShading:true});
  const tr=new THREE.MeshStandardMaterial({color:0xe2b640,metalness:.8,roughness:.35});
  put(g,G3.box(st2,2.0,.25,1.5),0,.12,0);
  put(g,G3.box(st,1.9,1.5,1.25),0,1.0,0);
  put(g,G3.box(tr,1.96,.1,1.3),0,1.78,0);
  for(const x of[-.65,0,.65])put(g,G3.box(st,.52,.42,1.25),x,2.0,0);
  for(let k=0;k<3;k++)put(g,G3.box(st2,.9,.07,.04),-.0,.55+k*.42,.64);
  return g;
};

/* BATTERING RAM half: log on a wheeled frame, iron head points +z */
MODEL.W=P=>{
  const g=new THREE.Group();
  const wood=new THREE.MeshStandardMaterial({color:0x6b4a2a,roughness:.85,metalness:0});
  const wood2=new THREE.MeshStandardMaterial({color:0x4a3220,roughness:.9,metalness:0});
  put(g,G3.box(wood2,.88,.1,1.2),0,.4,0);
  for(const x of[-.4,.4]){put(g,G3.cyl(wood2,.28,.28,.1,12),x,.28,.4,0,0,Math.PI/2);put(g,G3.cyl(wood2,.28,.28,.1,12),x,.28,-.4,0,0,Math.PI/2);put(g,G3.box(wood,.08,.55,.08),x,.72,.35);put(g,G3.box(wood,.08,.55,.08),x,.72,-.35);}
  put(g,G3.box(wood,.9,.1,.9),0,1.0,0);
  put(g,G3.cyl(wood,.17,.19,1.5,10),0,.82,.1,Math.PI/2);
  put(g,G3.cone(P.steel,.23,.4,8),0,.82,.95,Math.PI/2);put(g,G3.cyl(P.trim,.22,.22,.08,10),0,.82,.72,Math.PI/2);
  put(g,G3.box(P.trim,.5,.18,.08),0,1.2,-.35);
  g.scale.setScalar(1.7);return g;
};

/* TURRET: static gun emplacement, barrel points +z */
MODEL.T=P=>{
  const g=new THREE.Group();
  const gun=new THREE.MeshStandardMaterial({color:0x2b303c,metalness:.8,roughness:.3});
  const eye=new THREE.MeshStandardMaterial({color:0xff3a3a,emissive:0xff2020,emissiveIntensity:2,roughness:.4});
  put(g,G3.cyl(P.ground,1.3,1.35,.12,24),0,.06,0);
  put(g,G3.cyl(P.armor2,.95,1.1,.5,8),0,.37,0);
  put(g,G3.cyl(P.trim,.98,.98,.07,8),0,.64,0);
  put(g,G3.cyl(P.armor,.7,.8,.5,16),0,.95,0);
  put(g,G3.sph(P.armor,.62,20,14),0,1.35,0,0,0,0,1,.85,1);
  put(g,G3.cyl(gun,.15,.19,1.15,12),0,1.35,.85,Math.PI/2);
  put(g,G3.cyl(P.trim,.22,.22,.12,12),0,1.35,1.4,Math.PI/2);
  put(g,G3.sph(eye,.1,10,8),0,1.62,.45);
  put(g,G3.box(P.dark,.12,.3,.5),.62,1.35,-.1);put(g,G3.box(P.dark,.12,.3,.5),-.62,1.35,-.1);
  return g;
};

/* DRAGON: separate baked parts so the head, jaw and wings can animate. Model units, faces +z.
   DRB body+tail+legs, DRH head (origin = neck joint), DRJ lower jaw (origin = jaw hinge, in head space), DRW one wing (origin = shoulder). */
const DR_NECK=[0,3.45,1.55],DR_JAW=[0,-.08,.3],DR_MOUTH=[0,-.1,1.5],DR_SHO=[.75,2.75,.2];
function drMats(){
  const f=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m||0,flatShading:true});
  return{sc:f(0x9a2424,.55,.2),sc2:f(0x641414,.65,.2),dk:f(0x3c0c0c,.7,.1),belly:f(0xe0b36a,.65,.05),bone:f(0xeee3c4,.5,.1),horn:f(0x2b1a14,.5,.3),
    mem:new THREE.MeshStandardMaterial({color:0xc03838,roughness:.7,metalness:0,flatShading:true,side:THREE.DoubleSide}),
    memD:new THREE.MeshStandardMaterial({color:0x7a1f1f,roughness:.8,metalness:0,flatShading:true,side:THREE.DoubleSide}),
    eye:new THREE.MeshStandardMaterial({color:0xffd24a,emissive:0xffa010,emissiveIntensity:2.6,roughness:.4}),
    pup:new THREE.MeshStandardMaterial({color:0x100404,roughness:.6}),
    mouth:new THREE.MeshStandardMaterial({color:0xff5a20,emissive:0xff3a08,emissiveIntensity:1.8,roughness:.5}),
    gold:new THREE.MeshStandardMaterial({color:0xd6a638,metalness:.85,roughness:.3})};
}
function drTri(mat,pts){
  const pos=[];for(let k=1;k<pts.length-1;k++)for(const p of[pts[0],pts[k],pts[k+1]])pos.push(p[0],p[1],p[2]);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3));geo.computeVertexNormals();
  return new THREE.Mesh(geo,mat);
}
function drClaw(g,M,x,y,z,s){for(const dx of[-.1,0,.1])put(g,G3.cone(M.bone,.05*s,.2*s,5),x+dx*s,y,z+.1*s,Math.PI/2+.35);}
MODEL.DRB=P=>{
  const g=new THREE.Group(),M=drMats();
  /* torso */
  put(g,G3.sph(M.sc,1,18,12),0,1.95,-.1,0,0,0,.95,.88,1.55);
  put(g,G3.sph(M.belly,.9,14,10),0,1.55,.05,0,0,0,.78,.55,1.45);
  for(let k=0;k<8;k++)put(g,G3.box(M.belly,.9-Math.abs(k-3.5)*.05,.05,.12),0,1.18+Math.abs(k-3.5)*.015,1.0-k*.3);
  put(g,G3.sph(M.sc,.7,14,10),0,2.35,.95,0,0,0,.95,1,1.1);
  /* chest plate */
  put(g,G3.sph(M.belly,.55,12,8),0,2.1,1.35,0,0,0,.8,.9,.5);
  /* neck: rising S-curve */
  const nk=[[0,2.5,1.2,.52],[0,2.8,1.45,.46],[0,3.1,1.55,.4],[0,3.35,1.5,.36]];
  for(let k=0;k<nk.length;k++){const n=nk[k];put(g,G3.sph(M.sc,n[3],12,9),n[0],n[1],n[2]);
    put(g,G3.cone(M.sc2,.13,.34,5),0,n[1]+n[3]*.85,n[2]-.12,-.35);
    put(g,G3.box(M.belly,.4,.06,.16),0,n[1]-n[3]*.55,n[2]+.3,.5);}
  put(g,G3.cyl(M.gold,.4,.4,.06,10),0,3.38,1.52,.3);
  /* back spikes */
  for(let k=0;k<9;k++){const z=1.0-k*.36,y=2.85-Math.min(k,5)*.07-Math.max(0,k-5)*.18;put(g,G3.cone(M.sc2,.17-k*.008,.5-k*.025,5),0,y+.05,z,-.3);}
  /* tail */
  for(let k=0;k<9;k++){const z=-1.35-k*.42,y=1.55-k*.07+Math.sin(k*.7)*.12,x=Math.sin(k*.55)*.35,r=.55-k*.05;
    put(g,G3.sph(k%2?M.sc:M.sc2,Math.max(.1,r),10,8),x,y,z);
    if(k<8)put(g,G3.cone(M.sc2,Math.max(.06,.17-k*.014),.4-k*.03,5),x,y+r*.85,z,-.2);}
  put(g,G3.cone(M.bone,.14,.5,4),Math.sin(8*.55)*.35,.95,-5.0,-Math.PI/2);
  put(g,G3.box(M.dk,.5,.04,.3),Math.sin(8*.55)*.35,.95,-4.9);
  /* legs */
  for(const[sx,z,sc]of[[1,.55,1],[-1,.55,1],[1,-.75,1.12],[-1,-.75,1.12]]){
    put(g,G3.sph(M.sc2,.4*sc,10,8),sx*.78,1.35,z);
    put(g,G3.cyl(M.sc,.2*sc,.28*sc,.8*sc,8),sx*.9,.95*sc,z+.08,.25);
    put(g,G3.sph(M.sc2,.2*sc,8,6),sx*.9,.58*sc,z+.2);
    put(g,G3.cyl(M.sc,.14*sc,.2*sc,.55*sc,8),sx*.9,.33,z+.18,-.3);
    put(g,G3.box(M.dk,.4*sc,.1,.55*sc),sx*.9,.07,z+.35);
    drClaw(g,M,sx*.9,.1,z+.62*sc,sc);
  }
  return g;
};
MODEL.DRH=P=>{
  const g=new THREE.Group(),M=drMats();
  put(g,G3.sph(M.sc,.52,16,12),0,.1,.32,0,0,0,1,.85,1.2);
  put(g,G3.box(M.sc,.5,.34,.95),0,.02,.95,.06);
  put(g,G3.box(M.sc2,.46,.1,.9),0,.2,.98,.06);
  put(g,G3.box(M.sc,.36,.28,.3),0,0,1.46,.04);
  for(const x of[-1,1]){
    put(g,G3.sph(M.dk,.05,6,5),x*.13,.14,1.58);
    put(g,G3.box(M.sc2,.18,.12,.5),x*.34,.34,.5,0,x*.3,x*.3);
    put(g,G3.sph(M.eye,.1,10,8),x*.34,.28,.58);put(g,G3.box(M.pup,.03,.12,.04),x*.34,.28,.66);
    put(g,G3.cone(M.horn,.1,.9,6),x*.3,.5,-.05,-1.0,0,x*.25);
    put(g,G3.cone(M.horn,.07,.7,6),x*.34,.35,-.45,-1.25,0,x*.5);
    put(g,G3.cone(M.horn,.06,.4,6),x*.5,.05,.15,0,0,x*1.2);
    put(g,G3.cone(M.horn,.06,.34,6),x*.46,-.12,.12,.4,0,x*1.1);
    for(let k=0;k<6;k++)put(g,G3.cone(M.bone,.035,.14,5),x*(.17+k*.002),-.17,.5+k*.18,Math.PI);
    put(g,G3.box(M.sc2,.04,.2,.6),x*.3,-.02,.2,0,0,x*.15);
  }
  for(let k=0;k<3;k++)put(g,G3.cone(M.sc2,.1,.3,5),0,.5-k*.03,.1-k*.22,-.7);
  put(g,G3.box(M.mouth,.3,.03,.8),0,-.14,.9);
  return g;
};
MODEL.DRJ=P=>{
  const g=new THREE.Group(),M=drMats();
  put(g,G3.box(M.sc,.4,.12,.95),0,-.02,.62,-.04);
  put(g,G3.box(M.sc2,.34,.1,.3),0,-.02,1.2);
  put(g,G3.sph(M.sc,.2,10,8),0,-.04,.18,0,0,0,1.4,.8,1.2);
  put(g,G3.box(M.mouth,.26,.03,.8),0,.05,.7);
  for(const x of[-1,1])for(let k=0;k<5;k++)put(g,G3.cone(M.bone,.03,.13,5),x*.16,.1,.38+k*.2);
  put(g,G3.cone(M.horn,.06,.3,5),0,-.12,1.22,Math.PI-.3);
  return g;
};
MODEL.DRW=P=>{
  const g=new THREE.Group(),M=drMats();
  const sh=[0,0,0],el=[1.2,.85,-.1],wr=[2.3,.45,-.5];
  limb(g,M.sc,sh,el,.17,.14);limb(g,M.sc,el,wr,.13,.1);
  put(g,G3.sph(M.sc2,.2,8,6),el[0],el[1],el[2]);put(g,G3.sph(M.sc2,.16,8,6),wr[0],wr[1],wr[2]);
  put(g,G3.cone(M.bone,.07,.3,5),wr[0]+.12,wr[1]+.12,wr[2],-.2,0,-1.2);
  const tips=[[3.5,-.1,.35],[3.5,-.25,-.55],[3.0,-.5,-1.55],[2.2,-.55,-2.3]];
  for(const t of tips)limb(g,M.sc,wr,t,.08,.035);
  const body=[.15,-.2,-1.5];
  const edge=[wr,...tips,body];
  g.add(drTri(M.mem,[wr,tips[0],tips[1]]));g.add(drTri(M.mem,[wr,tips[1],tips[2]]));g.add(drTri(M.memD,[wr,tips[2],tips[3]]));g.add(drTri(M.memD,[wr,tips[3],body]));g.add(drTri(M.memD,[sh,wr,body]));
  for(const t of tips)put(g,G3.cone(M.bone,.04,.18,5),t[0],t[1],t[2],0,0,-Math.PI/2);
  put(g,G3.sph(M.gold,.07,6,5),el[0],el[1]+.14,el[2]);
  return g;
};

/* KRAKEN boss: ~2x2 tiles */
MODEL.KR=P=>{
  const g=new THREE.Group();
  const sk=new THREE.MeshStandardMaterial({color:0x4a2f86,roughness:.55,metalness:.1,flatShading:true});
  const sk2=new THREE.MeshStandardMaterial({color:0x6c4bb0,roughness:.5,metalness:.1,flatShading:true});
  const wh=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.3});
  const wt=new THREE.MeshStandardMaterial({color:0x2a7ab8,roughness:.2,metalness:.3,transparent:true,opacity:.75});
  const gl=new THREE.MeshStandardMaterial({color:0xffef8a,emissive:0xffd040,emissiveIntensity:2.2,roughness:.4});
  put(g,G3.cyl(wt,2.2,2.3,.2,24),0,.1,0);
  put(g,G3.tor(wt,2.0,.12,28),0,.25,0,Math.PI/2);
  put(g,G3.sph(sk,1.25,16,12),0,2.0,0,0,0,0,1,1.2,1);
  put(g,G3.sph(sk2,.85,12,10),0,3.1,-.1,0,0,0,1,1.3,1);
  for(const x of[-1,1]){put(g,G3.sph(wh,.28,10,8),x*.5,2.4,1.0);put(g,G3.sph(gl,.14,8,8),x*.5,2.4,1.22);}
  for(let k=0;k<8;k++){
    const a=k/8*Math.PI*2,cx=Math.cos(a),cz=Math.sin(a);
    for(let j=0;j<4;j++){const rr=.9+j*.38,hh=Math.max(.2,1.4-j*.28+(j===3?.4:0));put(g,G3.sph(j%2?sk2:sk,.38-j*.06,8,6),cx*rr,hh,cz*rr);}
    put(g,G3.sph(sk,.14,6,5),cx*2.45,.55,cz*2.45);
  }
  return g;
};

/* BOSS: stone colossus, ~2x2 tiles */
MODEL.Z=P=>{
  const g=new THREE.Group();
  const st=new THREE.MeshStandardMaterial({color:0x3a2f44,roughness:.8,metalness:.2,flatShading:true});
  const st2=new THREE.MeshStandardMaterial({color:0x241c2e,roughness:.85,metalness:.2,flatShading:true});
  const gl=new THREE.MeshStandardMaterial({color:0xff4a3a,emissive:0xff2a10,emissiveIntensity:2.2,roughness:.4});
  const gold=new THREE.MeshStandardMaterial({color:0xd6a638,metalness:.85,roughness:.3});
  put(g,G3.cyl(st2,2.3,2.5,.3,10),0,.15,0);
  put(g,G3.cyl(st,1.7,2.1,1.6,9),0,1.1,0);
  put(g,G3.cyl(gold,1.74,1.74,.1,9),0,1.95,0);
  put(g,G3.sph(st,1.35,12,10),0,3.0,0,0,0,0,1.1,1.0,1.0);
  put(g,G3.sph(st,.9,10,8),0,4.5,.1);
  put(g,G3.sph(gl,.17,8,8),-.34,4.6,.82);put(g,G3.sph(gl,.17,8,8),.34,4.6,.82);
  put(g,G3.box(gl,.6,.08,.05),0,4.18,.86);
  for(const s of[-1,1]){put(g,G3.sph(st,.7,8,7),s*1.75,3.2,0);put(g,G3.cyl(st2,.38,.5,1.5,7),s*1.95,2.1,.2,0,0,s*.15);put(g,G3.cone(gl,.2,.9,5),s*1.0,4.9,-.1,0,0,-s*.5);}
  for(let k=0;k<5;k++){const a=-.8+k*.4;put(g,G3.cone(st2,.2,.9,5),Math.sin(a)*1.1,3.9+Math.cos(a)*.2,-1.05,-.5);}
  put(g,G3.tor(gl,2.0,.06,36),0,.36,0,Math.PI/2);
  return g;
};
